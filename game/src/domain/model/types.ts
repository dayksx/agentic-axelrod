/**
 * Domain types for tournament orchestration (Iterated Prisoner's Dilemma hackathon).
 */

/** Player definition supplied at tournament start (e.g. CLI JSON). Mirrors ai-side config conceptually. */
export interface PlayerConfig {
  name: string;
  strategyPrompt: string;
  /** Agent base URL (wins over `AGENT_SLOT_${rosterIndex+1}_URL` for this player). */
  url?: string;
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

/** Simultaneous decision per player in an arena. D = Defect, C = Cooperate. */
export type Decision = "C" | "D";

/** Lifecycle phases within one tournament round (GM drives all transitions). */
export type RoundPhase =
  | "LOAD" // GM pushes rules, strategy prompt, score, round meta → each player
  | "ANNOUNCE" // GM collects announcements from players; store; players do not read yet
  | "CHAT" // GM drives alternating via GM, 3 msgs/player, 6 total per arena; order from firstSpeaker
  | "DECISION" // GM prompts simultaneous C/D prompts; invalid/timeout → C
  | "REVEAL" // GM pushes updated cumulative score only; infer opponent move from delta
  | "REVEAL_ANNOUNCEMENT"; // GM broadcasts all 6 announces to all players

/** One row of the schedule: 3 concurrent matches (3 arenas). */
export interface ScheduledRound {
  roundIndex: number;
  matches: Match[];
}

/**
 * Payoff matrix (row = you, col = opponent).
 * CC +3/+3, CD +0/+5, DC +5/+0, DD +1/+1.
 */
export function getScoresFromDecisions(
  you: Decision,
  opponent: Decision,
): { you: number; opponent: number } {
  if (you === "C" && opponent === "C") return { you: 3, opponent: 3 };
  if (you === "C" && opponent === "D") return { you: 0, opponent: 5 };
  if (you === "D" && opponent === "C") return { you: 5, opponent: 0 };
  return { you: 1, opponent: 1 };
}

/** Invalid or timeout outputs default to Cooperate (spec). */
export function parseDecision(raw: string): Decision {
  const t = raw.trim().toUpperCase();
  if (t === "D") return "D";
  return "C";
}
