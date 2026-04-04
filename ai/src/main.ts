import "dotenv/config";

import { a2aMessageSendUrl } from "./adapter/http/agent-server.js";
import { launchHttpPlayers } from "./application/launch-http-players.js";
import type { EnsName } from "./domain/types.js";

const DEFAULT_PORT = 3100;
const DEFAULT_HOST = "0.0.0.0";

function usage(): string {
  return `Usage: pnpm start [-- [options]]

One HTTP agent per process (blank slot until phase "load"). Scale out by running
multiple processes with different ports (e.g. Docker/Kubernetes).

Options:
  --port <n>     Listen port (default: env PORT, then PORT_BASE, then ${DEFAULT_PORT})
  --host <host>  Bind address (default: env HOST or ${DEFAULT_HOST})
  -h, --help     Show this help

Examples:
  pnpm start
  pnpm start -- --port 3101
  PORT=8080 pnpm start
`;
}

function parsePositiveInt(name: string, raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`${name} must be an integer 1–65535, got: ${raw}`);
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

function readPortFromEnv(): number {
  for (const key of ["PORT", "PORT_BASE"] as const) {
    const raw = process.env[key]?.trim();
    if (raw === undefined || raw === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1 && n <= 65535) {
      return n;
    }
  }
  return DEFAULT_PORT;
}

function parseCli(argv: string[]): {
  help: boolean;
  port?: number;
  host?: string;
} {
  const out: { help: boolean; port?: number; host?: string } = { help: false };

  for (let i = 2; i < argv.length; ) {
    const a = argv[i];
    if (a === undefined) break;

    if (a === "--") {
      i += 1;
      continue;
    }
    if (a === "-h" || a === "--help") {
      out.help = true;
      i += 1;
      continue;
    }
    if (a === "--port" || a.startsWith("--port=")) {
      const { value, next } = takeValue(argv, i);
      out.port = parsePositiveInt("--port", value);
      i = next;
      continue;
    }
    if (a === "--host" || a.startsWith("--host=")) {
      const { value, next } = takeValue(argv, i);
      out.host = value;
      i = next;
      continue;
    }

    throw new Error(`unknown argument: ${a}\n${usage()}`);
  }

  return out;
}

const cli = parseCli(process.argv);
if (cli.help === true) {
  console.log(usage());
  process.exit(0);
}

const listenPort = cli.port ?? readPortFromEnv();
const host = cli.host ?? process.env.HOST ?? DEFAULT_HOST;

const { bindings, shutdown } = await launchHttpPlayers({
  count: 1,
  basePort: listenPort,
  host,
});

const clientHost =
  host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
const endpoint = (p: number, ensName: EnsName) =>
  a2aMessageSendUrl({ hostForClient: clientHost, port: p, ensName });

const binding = bindings[0];
if (binding === undefined) {
  throw new Error("expected one HTTP binding");
}
const { player, port: boundPort } = binding;
console.log(
  `listening ${boundPort} (${player.name}) — POST ${endpoint(boundPort, player.name)} (phase "load" before play)`,
);
console.log(`           GET  http://${clientHost}:${boundPort}/player — current name, domain, strategy`);

const stop = async () => {
  await shutdown();
  process.exit(0);
};
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => void stop());
}
