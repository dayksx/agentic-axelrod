/**
 * Domain types for tournament orchestration (Iterated Prisoner's Dilemma hackathon).
 */

/**
 * In-memory row for a public line spoken in a specific arena (1v1 match) in a round.
 * Aligns with `announcements` (tournament_id, round_number, message) plus `arenaId` and `agentName`.
 */
export interface ArenaAnnouncement {
  readonly id: number;
  readonly tournamentId: number;
  readonly roundNumber: number;
  /** Same as {@link Match.arenaId} for the match where the announcement was collected. */
  readonly arenaId: number;
  readonly message: string;
  readonly agentName: string;
}

/** Series: GM marks top-3 returnees vs fresh entrants (sent on `phase: "load"`). */
export type RosterRole = "new" | "carryover";

/** Player definition supplied at tournament start (e.g. CLI JSON). Mirrors ai-side config conceptually. */
export interface PlayerConfig {
  name: string;
  strategyPrompt: string;
  /** Agent base URL (wins over `AGENT_SLOT_${rosterIndex+1}_URL` for this player). */
  url?: string;
  /** Omit or `"new"` for first tournament; `"carryover"` for top-3 continuing in a series. */
  rosterRole?: RosterRole;
}

/** One scheduled 1v1 meeting in an arena for a given round. */
export interface Match {
  arenaId: number;
  playerA: string;
  playerB: string;
  /** Speaks first in the chat phase for this meeting. */
  firstSpeaker: string;
}

export interface TournamentConfig {
  players: PlayerConfig[];
  /** Double round-robin play structure; default 10. */
  totalRounds?: number;
  /** Parallel arenas per round; default 3. */
  arenasPerRound?: number;
  /** GM truncates announces beyond this length; TBD tuning. */
  announceMaxChars?: number;
}

export interface TournamentResults {
  /** Final cumulative scores by player name (filled when implementation exists). */
  scoresByPlayer: Record<string, number>;
}

/** Simultaneous move per player in an arena (same literals as `ai` / HTTP `cooperation`). */
export type Cooperation = "cooperate" | "defect";

/** Lifecycle phases within one tournament round (GM drives all transitions). */
export type RoundPhase =
  | "LOAD" // GM pushes rules, strategy prompt, score, round meta → each player
  | "ANNOUNCE" // GM collects announcements from players; store; players do not read yet
  | "CHAT" // GM drives alternating via GM, 3 msgs/player, 6 total per arena; order from firstSpeaker
  | "DECISION" // GM prompts simultaneous cooperate/defect; invalid/timeout → cooperate
  | "REVEAL" // GM pushes updated cumulative score only; infer opponent move from delta
  | "REVEAL_ANNOUNCEMENT"; // GM broadcasts all 6 announces to all players

/** One row of the schedule: 3 concurrent matches (3 arenas). */
export interface ScheduledRound {
  roundIndex: number;
  matches: Match[];
}

/**
 * Payoff matrix (row = you, col = opponent).
 * Both cooperate +3/+3; you cooperate they defect +0/+5; you defect they cooperate +5/+0; both defect +1/+1.
 */
export function getScoresFromCooperation(
  you: Cooperation,
  opponent: Cooperation,
): { you: number; opponent: number } {
  if (you === "cooperate" && opponent === "cooperate") {
    return { you: 3, opponent: 3 };
  }
  if (you === "cooperate" && opponent === "defect") {
    return { you: 0, opponent: 5 };
  }
  if (you === "defect" && opponent === "cooperate") {
    return { you: 5, opponent: 0 };
  }
  return { you: 1, opponent: 1 };
}

/** Invalid or timeout outputs default to cooperate (spec). */
export function parseCooperation(raw: string): Cooperation {
  const t = raw.trim().toLowerCase();
  if (t === "d" || t === "defect") return "defect";
  return "cooperate";
}
