/**
 * LangGraph state schema for the player workflow (messages + game context).
 */

import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { GameMove, GamePhase } from "../../domain/types.js";

export type { GameMove, GamePhase };

/** One round/settlement document appended as received (opaque string). */
export function appendGameLogs(
  prev: string[],
  next: string[] | undefined,
): string[] {
  if (next === undefined || next.length === 0) return prev;
  return [...prev, ...next];
}

/** Merge per-round message archives (reveal phase snapshots chat/decision thread for that round). */
export function mergeHistoricalMessages(
  prev: Readonly<Record<number, BaseMessage[]>>,
  next: Record<number, BaseMessage[]> | undefined,
): Record<number, BaseMessage[]> {
  if (next === undefined || Object.keys(next).length === 0) return { ...prev };
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
});
