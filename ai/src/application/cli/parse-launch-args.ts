/**
 * CLI for the multi-player HTTP entrypoint (`main.ts`).
 */

import type { EnsName, ParsedLaunchCli, PlayerConfig, ResolvedLaunchOptions } from "../../domain/types.js";

export type { ParsedLaunchCli, ResolvedLaunchOptions };

export const DEFAULT_PLAYERS = 1;
export const DEFAULT_PORT_BASE = 3100;
export const DEFAULT_HOST = "0.0.0.0";

function usage(): string {
  return `Usage: node dist/main.js [options]

Start one HTTP server per agent; ports are port-base, port-base+1, …

Options:
  --name <ens>            Agent ENS name (repeat for multiple agents, in order). Appends ".eth" if missing.
  --strategy <prompt>     Strategy / behavior string (repeat per agent, in order)
  -n, --players <n>       Fleet size (default: env PLAYER_COUNT or ${DEFAULT_PLAYERS}; at least # of --name / --strategy values)
  --port-base <n>         First port (default: env PORT_BASE or ${DEFAULT_PORT_BASE})
  --host <host>           Bind address (default: env HOST or ${DEFAULT_HOST})
  -h, --help              Show this help

Examples:
  node dist/main.js --name alice.eth --strategy "Tit-for-tat: cooperate first, then mirror."

  node dist/main.js \\
    --name alice.eth --strategy "Always cooperate." \\
    --name bob.eth --strategy "Grim trigger."

  node dist/main.js -n 3 --strategy "Same strategy for all three (names default to player1.eth, …)."
`;
}

function parsePositiveInt(name: string, raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new Error(`${name} must be a positive integer, got: ${raw}`);
  }
  return n;
}

function takeValue(argv: string[], i: number): { value: string; next: number } {
  const cur = argv[i];
  const eq = cur?.indexOf("=");
  if (eq !== undefined && eq >= 0 && cur !== undefined) {
    const value = cur.slice(eq + 1);
    if (value.length === 0) {
      throw new Error(`missing value in ${cur}`);
    }
    return { value, next: i + 1 };
  }
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("-")) {
    throw new Error(`missing value after ${cur ?? "option"}`);
  }
  return { value: v, next: i + 2 };
}

function readOptionalPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return fallback;
  }
  return n;
}

/**
 * Parse argv (typically `process.argv`). Apply {@link resolveLaunchOptions} for env defaults.
 */
export function parseLaunchArgv(argv: string[]): ParsedLaunchCli {
  let playersFromCli: number | undefined;
  let portBaseFromCli: number | undefined;
  let hostFromCli: string | undefined;
  const ensNames: string[] = [];
  const strategyPrompts: string[] = [];

  for (let i = 2; i < argv.length; ) {
    const a = argv[i];
    if (a === undefined) break;

    if (a === "-h" || a === "--help") {
      return { kind: "help" };
    }
    if (a === "-n" || a === "--players") {
      const { value, next } = takeValue(argv, i);
      playersFromCli = parsePositiveInt("--players", value);
      i = next;
      continue;
    }
    if (a === "--port-base" || a.startsWith("--port-base=")) {
      const { value, next } = takeValue(argv, i);
      portBaseFromCli = parsePositiveInt("--port-base", value);
      i = next;
      continue;
    }
    if (a === "--host" || a.startsWith("--host=")) {
      const { value, next } = takeValue(argv, i);
      hostFromCli = value;
      i = next;
      continue;
    }
    if (a === "--name" || a.startsWith("--name=")) {
      const { value, next } = takeValue(argv, i);
      ensNames.push(value);
      i = next;
      continue;
    }
    if (a === "--strategy" || a.startsWith("--strategy=")) {
      const { value, next } = takeValue(argv, i);
      strategyPrompts.push(value);
      i = next;
      continue;
    }

    throw new Error(`unknown argument: ${a}\n${usage()}`);
  }

  return {
    kind: "ok" as const,
    ...(playersFromCli !== undefined ? { playersFromCli } : {}),
    ...(portBaseFromCli !== undefined ? { portBaseFromCli } : {}),
    ...(hostFromCli !== undefined ? { hostFromCli } : {}),
    ensNames,
    strategyPrompts,
  };
}

/** CLI wins over env; env wins over built-in defaults. Fleet size is at least the number of --name / --strategy values. */
export function resolveLaunchOptions(parsed: Extract<ParsedLaunchCli, { kind: "ok" }>): ResolvedLaunchOptions {
  const minSlots = Math.max(parsed.ensNames.length, parsed.strategyPrompts.length, 1);
  const fromCliOrEnv =
    parsed.playersFromCli ?? readOptionalPositiveIntEnv("PLAYER_COUNT", DEFAULT_PLAYERS);
  const players = Math.max(fromCliOrEnv, minSlots);
  const portBase =
    parsed.portBaseFromCli ?? readOptionalPositiveIntEnv("PORT_BASE", DEFAULT_PORT_BASE);
  const host = parsed.hostFromCli ?? process.env.HOST ?? DEFAULT_HOST;

  return {
    players,
    portBase,
    host,
    ensNames: parsed.ensNames,
    strategyPrompts: parsed.strategyPrompts,
  };
}

function defaultStrategyPrompt(playerIndex1Based: number): string {
  return `Default strategy for player ${playerIndex1Based}: play fair, explain moves briefly, and adapt to the opponent over repeated rounds.`;
}

function defaultEnsName(playerIndex1Based: number): EnsName {
  return `player${playerIndex1Based}.eth` as EnsName;
}

/** Ensures `.eth` suffix for the domain model. */
export function normalizeEnsName(raw: string): EnsName {
  const t = raw.trim();
  return (t.endsWith(".eth") ? t : `${t}.eth`) as EnsName;
}

/**
 * Resolves ENS + strategy per slot:
 * - No `--name`: `player1.eth`, …
 * - Exactly one `--name` and multiple players: not allowed (ambiguous); use one `--name` per player or omit `--name`.
 * - Several `--name` values: applied in order; remaining slots get default names.
 * - More names than players: error.
 * Strategies: same as before (one `--strategy` repeats for the whole fleet; extra slots get defaults).
 */
export function padEnsNames(names: readonly string[], players: number): EnsName[] {
  if (names.length > players) {
    throw new Error(
      `Got ${names.length} --name values but only ${players} players; remove extra --name or increase -n.`,
    );
  }
  if (names.length === 0) {
    return Array.from({ length: players }, (_, i) => defaultEnsName(i + 1));
  }
  if (names.length === 1 && players > 1) {
    throw new Error(
      "One --name with multiple players is ambiguous; pass --name once per agent (in order) or omit --name to use player1.eth, player2.eth, …",
    );
  }
  const out = names.map((n) => normalizeEnsName(n));
  while (out.length < players) {
    out.push(defaultEnsName(out.length + 1));
  }
  return out;
}

export function padStrategyPrompts(prompts: readonly string[], players: number): string[] {
  if (prompts.length > players) {
    throw new Error(
      `Got ${prompts.length} --strategy prompts but only ${players} players; remove extra --strategy or increase -n.`,
    );
  }
  if (prompts.length === 0) {
    return Array.from({ length: players }, (_, i) => defaultStrategyPrompt(i + 1));
  }
  if (prompts.length === 1 && players > 1) {
    const one = prompts[0]!;
    return Array.from({ length: players }, () => one);
  }
  const out = [...prompts];
  while (out.length < players) {
    out.push(defaultStrategyPrompt(out.length + 1));
  }
  return out;
}

export function buildPlayerConfigs(names: readonly EnsName[], strategies: readonly string[]): PlayerConfig[] {
  if (names.length !== strategies.length) {
    throw new Error("buildPlayerConfigs: names and strategies must have the same length");
  }
  return strategies.map((strategy, i) => {
    const n = i + 1;
    return {
      name: names[i]!,
      domain: `https://player${n}.local`,
      strategy,
    };
  });
}

export function printLaunchUsage(): void {
  console.log(usage());
}
