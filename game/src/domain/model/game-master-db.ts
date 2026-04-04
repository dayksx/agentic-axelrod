/**
 * Helpers for Game Master ↔ Supabase writes (keeps game-master.ts readable).
 */
import { createHash } from "node:crypto";

import type { Cooperation, ScheduledRound } from "./types.js";

/** DB `matches` uses C/D; HTTP agents use cooperate/defect. */
export function cooperationToDecision(c: Cooperation): "C" | "D" {
  return c === "defect" ? "D" : "C";
}

/** Deterministic 66-char placeholder for `tournament_transactions.tx_hash` until chain integration. */
export function stubTxHash(parts: (string | number)[]): string {
  const h = createHash("sha256")
    .update(parts.join(":"))
    .digest("hex");
  return `0x${h.slice(0, 64)}`;
}

export function scheduleRowsForMatchesTable(
  schedule: readonly ScheduledRound[],
): {
  round_number: number;
  arena_id: number;
  agent_a: string;
  agent_b: string;
  first_speaker: string;
}[] {
  const rows: {
    round_number: number;
    arena_id: number;
    agent_a: string;
    agent_b: string;
    first_speaker: string;
  }[] = [];
  for (const round of schedule) {
    for (const m of round.matches) {
      rows.push({
        round_number: round.roundIndex,
        arena_id: m.arenaId,
        agent_a: m.playerA,
        agent_b: m.playerB,
        first_speaker: m.firstSpeaker,
      });
    }
  }
  return rows;
}

export function matchIdKey(roundNumber: number, arenaId: number): string {
  return `${roundNumber}:${arenaId}`;
}

export function buildMatchIdMap(
  inserted: readonly {
    id: number;
    round_number: number;
    arena_id: number;
  }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of inserted) {
    map.set(matchIdKey(row.round_number, row.arena_id), row.id);
  }
  return map;
}
