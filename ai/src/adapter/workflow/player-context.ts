/**
 * Builders for Prisoner's Dilemma player workflow LLM prompts (system preamble, phase text, history).
 */

import type { BaseMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";

/** Rules + strategy block prepended to every chat and decision call. */
export function buildSystemPreamble(strategyPrompt: string): string {
  return [
    "Prisoner's Dilemma — rules:",
    "Discussion: at most 3 messages from you (same limit for adversary). Talk only — no moves until decision.",
    "Decision: choose simultaneously; moves are only cooperate or defect.",
    "Payoffs (you, them): (C,C)→(3,3) (D,D)→(1,1) (C,D)→(0,5) (D,C)→(5,0). So 5>3>1>0; mutual (3,3) beats mutual (1,1).",
    "In decision phase output exactly one action: cooperate or defect.",
    "",
    "Strategy and behavior (follow this in every reply):",
    strategyPrompt,
  ].join("\n");
}

export const CHAT_PHASE_INSTRUCTION =
  "Chat phase: talk with your adversary (coordinate, influence, persuade, or bluff) to maximize your points under the payoffs in the rules.";

/** Prior rounds' chat/decision transcripts, chronologically, for LLM context. */
export function historicalMessagesForPrompt(
  historical: Readonly<Record<number, BaseMessage[]>>,
): BaseMessage[] {
  const rounds = Object.keys(historical)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const out: BaseMessage[] = [];
  for (const r of rounds) {
    const chunk = historical[r];
    if (chunk === undefined || chunk.length === 0) continue;
    out.push(
      new SystemMessage(
        `Archived discussion for round ${r} (completed; not the current round).`,
      ),
    );
    out.push(...chunk);
  }
  return out;
}

export function buildChatPhaseLlmMessages(options: {
  readonly strategyPrompt: string;
  readonly round: number;
  readonly historicalMessages: Readonly<Record<number, BaseMessage[]>>;
  readonly threadMessages: readonly BaseMessage[];
}): BaseMessage[] {
  return [
    new SystemMessage(buildSystemPreamble(options.strategyPrompt)),
    new SystemMessage(`Round ${options.round}.`),
    new SystemMessage(CHAT_PHASE_INSTRUCTION),
    ...historicalMessagesForPrompt(options.historicalMessages),
    ...options.threadMessages,
  ];
}

export function buildDecisionPhaseLlmMessages(options: {
  readonly strategyPrompt: string;
  readonly round: number;
  readonly historicalMessages: Readonly<Record<number, BaseMessage[]>>;
  readonly threadMessages: readonly BaseMessage[];
}): BaseMessage[] {
  return [
    new SystemMessage(buildSystemPreamble(options.strategyPrompt)),
    new SystemMessage(
      `Round ${options.round}. Decision phase — choose cooperate or defect for this round. Reply with a single word only: cooperate or defect.`,
    ),
    ...historicalMessagesForPrompt(options.historicalMessages),
    ...options.threadMessages,
  ];
}
