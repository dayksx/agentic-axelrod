/**
 * Run the Game Master from the CLI: loads `game/.env` (if present), reads tournament JSON,
 * then POSTs `phase: load` to each agent (per-player `url` overrides `AGENT_SLOT_*_URL` for that index).
 *
 * Usage (from repo root or `game/`):
 *   pnpm --filter game tournament -- --config players.json
 *   pnpm --filter game tournament -- players.json
 */
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { GameMaster } from "../domain/model/game-master.js";
import type {
  PlayerConfig,
  TournamentConfig,
} from "../domain/model/types.js";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: join(gameRoot, ".env") });

function parseConfigPath(argv: string[]): string {
  const i = argv.indexOf("--config");
  if (i >= 0) {
    const p = argv[i + 1];
    if (typeof p === "string" && p.length > 0) return p;
    throw new Error("Missing value after --config");
  }
  const first = argv[0];
  if (typeof first === "string" && first.length > 0 && !first.startsWith("-")) {
    return first;
  }
  throw new Error(
    "Usage: pnpm tournament -- --config <players.json>\n   or: pnpm tournament -- <players.json>",
  );
}

function parseTournamentJson(text: string): TournamentConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON: ${msg}`);
  }
  if (raw === null || typeof raw !== "object") {
    throw new Error("Config root must be a JSON object");
  }
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.players)) {
    throw new Error('Config must include a "players" array');
  }
  if (o.players.length !== 6) {
    throw new Error(`Expected exactly 6 players, got ${o.players.length}`);
  }

  const players: PlayerConfig[] = [];
  for (let i = 0; i < o.players.length; i++) {
    const p = o.players[i];
    if (p === null || typeof p !== "object") {
      throw new Error(`players[${i}] must be an object`);
    }
    const pl = p as Record<string, unknown>;
    if (typeof pl.name !== "string" || pl.name.length === 0) {
      throw new Error(`players[${i}].name must be a non-empty string`);
    }
    if (typeof pl.strategyPrompt !== "string") {
      throw new Error(`players[${i}].strategyPrompt must be a string`);
    }
    if (pl.url !== undefined && typeof pl.url !== "string") {
      throw new Error(`players[${i}].url must be a string when set`);
    }
    const pc: PlayerConfig = {
      name: pl.name,
      strategyPrompt: pl.strategyPrompt,
    };
    if (typeof pl.url === "string" && pl.url.length > 0) {
      pc.url = pl.url;
    }
    players.push(pc);
  }

  const cfg: TournamentConfig = { players };
  if (typeof o.totalRounds === "number") cfg.totalRounds = o.totalRounds;
  if (typeof o.arenasPerRound === "number") {
    cfg.arenasPerRound = o.arenasPerRound;
  }
  if (typeof o.announceMaxChars === "number") {
    cfg.announceMaxChars = o.announceMaxChars;
  }
  return cfg;
}

const argv = process.argv.slice(2);
const configPath = resolve(process.cwd(), parseConfigPath(argv));
const text = await readFile(configPath, "utf8");
const tournamentConfig = parseTournamentJson(text);

const gm = new GameMaster();
const results = await gm.runTournament(tournamentConfig);
console.log("[GM] Results:", results);
