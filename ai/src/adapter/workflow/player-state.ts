/**
 * LangGraph state schema for the player workflow (messages + game context).
 */

import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type {
  ArenaAnnouncement,
  GameMove,
  GamePhase,
} from "../../domain/types.js";

export type { GameMove, GamePhase };

/** Internal: `end` phase clears accumulated logs in one update. */
export const GAME_LOGS_CLEAR = { __gameLogsClear: true } as const;

export type GameLogsReducerInput =
  | readonly string[]
  | typeof GAME_LOGS_CLEAR
  | undefined;

/** One round/settlement document appended as received (opaque string). */
export function appendGameLogs(
  prev: string[],
  next: GameLogsReducerInput,
): string[] {
  if (next === undefined) return prev;
  if (typeof next === "object" && next !== null && "__gameLogsClear" in next) {
    return [];
  }
  const arr = next as readonly string[];
  if (arr.length === 0) return prev;
  return [...prev, ...arr];
}

/** Internal: `end` phase clears all archived round threads. */
export const HISTORICAL_MESSAGES_CLEAR = { __historicalClear: true } as const;

export type HistoricalMessagesReducerInput =
  | Record<number, BaseMessage[]>
  | typeof HISTORICAL_MESSAGES_CLEAR
  | undefined;

/** Merge per-round message archives (reveal phase snapshots chat/decision thread for that round). */
export function mergeHistoricalMessages(
  prev: Readonly<Record<number, BaseMessage[]>>,
  next: HistoricalMessagesReducerInput,
): Record<number, BaseMessage[]> {
  if (next === undefined) return { ...prev };
  if (
    typeof next === "object" &&
    next !== null &&
    "__historicalClear" in next
  ) {
    return {};
  }
  if (Object.keys(next).length === 0) return { ...prev };
  return { ...prev, ...next };
}

export const PlayerStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  phase: Annotation<GamePhase>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => "chat",
  }),
  /** Current round number (from chat `iteration`; reveal phase updates from the reveal document). */
  round: Annotation<number>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => 0,
  }),
  /** Tournament id from GM (for prompts; matches future `announcements.tournament_id`). */
  tournamentId: Annotation<number>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => 0,
  }),
  /** Arena (1v1 match slot) within the round — for announce-phase prompts. */
  arenaId: Annotation<number>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => 0,
  }),
  chatMessageCount: Annotation<number>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => 0,
  }),
  gameLogs: Annotation<string[]>({
    reducer: appendGameLogs,
    default: () => [],
  }),
  historicalMessages: Annotation<Record<number, BaseMessage[]>>({
    reducer: mergeHistoricalMessages,
    default: () => ({}),
  }),
  /** Opaque payload for reveal (JSON round doc) or empty when clearing at match end. */
  sharedMatchContext: Annotation<string>({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => "",
  }),
  /** Set by decision phase (plain-text parse; no JSON schema / response_format on the LLM). `null` clears (used by `end`). */
  lastDecision: Annotation<GameMove | undefined | null>({
    reducer: (prev, next) => {
      if (next === null) return undefined;
      return next !== undefined ? next : prev;
    },
    default: () => undefined,
  }),
  /** Full snapshot from GM; replaced when the client sends `arenaAnnouncements`. Cleared on `end`. */
  arenaAnnouncements: Annotation<ArenaAnnouncement[]>({
    reducer: (prev, next) => (next !== undefined ? [...next] : prev),
    default: () => [],
  }),
});
