/**
 * Run the Game Master from the CLI: loads `game/.env` (if present), reads tournament JSON,
 * then POSTs `phase: load` to each agent (per-player `url` overrides `AGENT_SLOT_*_URL` for that index).
 *
 * Usage (from repo root or `game/`):
 *   pnpm --filter game tournament -- game/players.json
 *   pnpm --filter game tournament -- players.json
 * From `game/`, both `players.json` and `game/players.json` resolve correctly.
 * (`pnpm` inserts `--` before args; we skip it.)
 */
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseTournamentConfigJson } from "../application/parse-tournament-config.js";
import { GameMaster } from "../domain/model/game-master.js";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: join(gameRoot, ".env") });

function parseConfigPath(argv: string[]): string {
  const args = argv.filter((a) => a !== "--");
  const i = args.indexOf("--config");
  if (i >= 0) {
    const p = args[i + 1];
    if (typeof p === "string" && p.length > 0) return p;
    throw new Error("Missing value after --config");
  }
  const positional = args.filter((a) => !a.startsWith("-"));
  const first = positional[0];
  if (typeof first === "string" && first.length > 0) {
    return first;
  }
  throw new Error(
    "Usage: pnpm tournament -- --config <players.json>\n   or: pnpm tournament -- <players.json>",
  );
}

/**
 * Resolve config path for `readFile`. If cwd is `game/` but the arg is `game/foo.json`
 * (copy-paste from repo root), avoid `game/game/foo.json`.
 */
function resolveConfigAbsolutePath(raw: string): string {
  const cwd = process.cwd();
  const primary = resolve(cwd, raw);
  if (existsSync(primary)) return primary;
  if (raw.startsWith("game/")) {
    const stripped = resolve(cwd, raw.slice("game/".length));
    if (existsSync(stripped)) return stripped;
  }
  const underPackage = resolve(gameRoot, raw.replace(/^game\//, ""));
  if (existsSync(underPackage)) return underPackage;
  return primary;
}

const argv = process.argv.slice(2);
const configPath = resolveConfigAbsolutePath(parseConfigPath(argv));
const text = await readFile(configPath, "utf8");
const tournamentConfig = parseTournamentConfigJson(text);

const gm = new GameMaster();
const results = await gm.runTournament(tournamentConfig);
console.log("[GM] Results:", results);
