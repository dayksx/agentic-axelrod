import type { PlayerConfig, TournamentConfig } from "../domain/model/types.js";

/**
 * Parse and validate a tournament config object (same rules as CLI `run-tournament`).
 * Used by the HTTP API from `req.body` and by the CLI after reading a file client-side.
 */
export function parseTournamentConfig(raw: unknown): TournamentConfig {
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
    if (pl.rosterRole !== undefined) {
      if (pl.rosterRole !== "new" && pl.rosterRole !== "carryover") {
        throw new Error(
          `players[${i}].rosterRole must be "new" or "carryover" when set`,
        );
      }
    }
    const pc: PlayerConfig = {
      name: pl.name,
      strategyPrompt: pl.strategyPrompt,
    };
    if (typeof pl.url === "string" && pl.url.length > 0) {
      pc.url = pl.url;
    }
    if (pl.rosterRole === "new" || pl.rosterRole === "carryover") {
      pc.rosterRole = pl.rosterRole;
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
  if (o.consumedUsersRowIds !== undefined) {
    if (!Array.isArray(o.consumedUsersRowIds)) {
      throw new Error("consumedUsersRowIds must be an array of positive integers");
    }
    const ids: number[] = [];
    for (let i = 0; i < o.consumedUsersRowIds.length; i++) {
      const x = o.consumedUsersRowIds[i];
      if (typeof x !== "number" || !Number.isInteger(x) || x < 1) {
        throw new Error(
          `consumedUsersRowIds[${i}] must be a positive integer`,
        );
      }
      ids.push(x);
    }
    if (ids.length > 0) {
      cfg.consumedUsersRowIds = ids;
    }
  }
  return cfg;
}

export function parseTournamentConfigJson(text: string): TournamentConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON: ${msg}`);
  }
  return parseTournamentConfig(raw);
}
