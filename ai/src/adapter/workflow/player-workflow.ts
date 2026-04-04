/**
 * LangGraph implementation of {@link PlayerWorkflow}.
 */

import {
  AIMessage,
  HumanMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import { createOpenAiCompatibleChatLlm } from "../../config/llm-env.js";
import {
  END,
  MemorySaver,
  REMOVE_ALL_MESSAGES,
  START,
  StateGraph,
} from "@langchain/langgraph";
import type {
  PlayerWorkflow,
  PlayerWorkflowInvokeInput,
  PlayerWorkflowInvokeResult,
} from "../../domain/types.js";
import { PlayerStateAnnotation, type GamePhase } from "./player-state.js";
import {
  buildChatPhaseLlmMessages,
  buildDecisionPhaseLlmMessages,
} from "./player-context.js";
import type { GameMove } from "../../domain/types.js";

function threadIdFor(input: Pick<PlayerWorkflowInvokeInput, "name">): string {
  return String(input.name);
}

function toGamePhase(phase: PlayerWorkflowInvokeInput["phase"]): GamePhase {
  switch (phase) {
    case "chat":
      return "chat";
    case "decision":
      return "decision";
    case "reveal":
      return "reveal";
    case "end":
      return "reveal";
    default: {
      const _e: never = phase;
      void _e;
      return "chat";
    }
  }
}

function lastAssistantText(messages: readonly unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m instanceof AIMessage) {
      const c = m.content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) {
        return c
          .map((p) =>
            typeof p === "object" && p !== null && "text" in p
              ? String((p as { text: string }).text)
              : String(p),
          )
          .join("");
      }
      return String(c ?? "");
    }
  }
  return "";
}

/** Plain-text decision (avoids response_format / structured output — many OpenAI-compatible APIs reject it). */
function parseCooperationFromDecisionText(text: string): GameMove {
  const t = text.trim().toLowerCase();
  const hasC = /\bcooperate\b/.test(t);
  const hasD = /\bdefect\b/.test(t);
  if (hasD && !hasC) return "defect";
  if (hasC && !hasD) return "cooperate";
  return "cooperate";
}

function buildChatGraph(strategyPrompt: string) {
  const modelWithoutTools = createOpenAiCompatibleChatLlm();

  const checkpointer = new MemorySaver();

  return new StateGraph(PlayerStateAnnotation)
    .addNode(
      "phaseEntryNode",
      async (_state: typeof PlayerStateAnnotation.State) => {
        if (_state.phase === "end") {
          return {
            messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES })],
          };
        }
        if (_state.phase === "reveal") {
          const doc = _state.sharedMatchContext;
          const round = _state.round;
          const archived = _state.messages.slice();
          return {
            messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES })],
            historicalMessages: { [round]: archived },
            ...(doc.length > 0 ? { gameLogs: [doc] } : {}),
          };
        }
        return {};
      },
    )
    .addConditionalEdges(
      "phaseEntryNode",
      (state: typeof PlayerStateAnnotation.State) => {
        if (state.phase === "end") return END;
        if (state.phase === "reveal") return END;
        if (state.phase === "chat") return "chatNode";
        if (state.phase === "decision") return "decisionNode";
        return END;
      },
    )
    .addNode("chatNode", async (state: typeof PlayerStateAnnotation.State) => {
      const response = await modelWithoutTools.invoke(
        buildChatPhaseLlmMessages({
          strategyPrompt,
          round: state.round,
          historicalMessages: state.historicalMessages,
          threadMessages: state.messages,
        }),
      );
      return {
        messages: [response],
        chatMessageCount: state.chatMessageCount + 1,
      };
    })
    .addNode(
      "decisionNode",
      async (state: typeof PlayerStateAnnotation.State) => {
        const response = await modelWithoutTools.invoke(
          buildDecisionPhaseLlmMessages({
            strategyPrompt,
            round: state.round,
            historicalMessages: state.historicalMessages,
            threadMessages: state.messages,
          }),
        );
        const text =
          typeof response.content === "string"
            ? response.content
            : lastAssistantText([response]);
        const move = parseCooperationFromDecisionText(text);
        return {
          lastDecision: move,
          messages: [response],
        };
      },
    )
    .addEdge(START, "phaseEntryNode")
    .addEdge("chatNode", END)
    .addEdge("decisionNode", END)
    .compile({ checkpointer });
}

export class LangGraphPlayerWorkflow implements PlayerWorkflow {
  private readonly chatGraph;

  constructor(strategyPrompt: string) {
    this.chatGraph = buildChatGraph(strategyPrompt);
  }

  async invoke(
    input: PlayerWorkflowInvokeInput,
  ): Promise<PlayerWorkflowInvokeResult> {
    switch (input.phase) {
      case "chat": {
        const gamePhase = toGamePhase(input.phase);
        const result = await this.chatGraph.invoke(
          {
            phase: gamePhase,
            messages: [new HumanMessage(input.message)],
            round: input.iteration,
          },
          {
            configurable: {
              thread_id: threadIdFor(input),
            },
          },
        );
        const reply = lastAssistantText(result.messages);
        return { phase: "chat", reply };
      }
      case "decision": {
        const gamePhase = toGamePhase(input.phase);
        const result = await this.chatGraph.invoke(
          { phase: gamePhase },
          {
            configurable: {
              thread_id: threadIdFor(input),
            },
          },
        );
        const move = result.lastDecision;
        const cooperation =
          move === "defect" || move === "cooperate" ? move : "cooperate";
        return { phase: "decision", cooperation };
      }
      case "reveal": {
        const gamePhase = toGamePhase(input.phase);
        await this.chatGraph.invoke(
          {
            phase: gamePhase,
            round: input.reveal.round,
            sharedMatchContext: JSON.stringify(input.reveal),
          },
          {
            configurable: {
              thread_id: threadIdFor(input),
            },
          },
        );
        return { phase: "reveal" };
      }
      case "end": {
        const gamePhase = toGamePhase(input.phase);
        await this.chatGraph.invoke(
          {
            phase: gamePhase,
            sharedMatchContext: "",
          },
          {
            configurable: {
              thread_id: threadIdFor(input),
            },
          },
        );
        return { phase: "end" };
      }
      default: {
        const _e: never = input;
        void _e;
        throw new Error("unknown phase");
      }
    }
  }
}
