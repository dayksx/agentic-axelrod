/**
 * Domain types (no imports from adapters — keeps dependency direction clean).
 */

export type EnsName = `${string}.eth`;

export type Cooperation = "cooperate" | "defect";

export interface PlayerConfig {
  readonly name: EnsName;
  readonly domain: string;
  readonly strategy: string;
}

/**
 * Same shape as {@link PlayerConfig}; sent with `phase: "load"` to reconfigure a running player.
 */
export type LoadPlayerConfig = PlayerConfig;

/** Canonical phases accepted by {@link Player.invoke} and the HTTP `/message/send` handler. */
export const WORKFLOW_PHASES = ["load", "chat", "decision", "reveal", "end"] as const;

export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

/** Per-round outcome sent in the reveal phase (after moves are known). */
export interface RevealRoundDocument {
  readonly round: number;
  readonly yourMove: Cooperation;
  readonly adversaryMove: Cooperation;
  readonly yourScore: number;
  readonly adversaryScore: number;
}

export type PlayerWorkflowInvokeInput =
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "chat";
      iteration: number;
      message: string;
    }
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "decision";
    }
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "reveal";
      reveal: RevealRoundDocument;
    }
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "end";
    };

export type PlayerWorkflowInvokeResult =
  | {
      phase: "load";
      name: EnsName;
      domain: string;
      strategy: string;
    }
  | { phase: "chat"; reply: string }
  | { phase: "decision"; cooperation: Cooperation }
  | { phase: "reveal" }
  | { phase: "end" };

/** LLM / LangGraph backend for a {@link Player}. */
export interface PlayerWorkflow {
  invoke(input: PlayerWorkflowInvokeInput): Promise<PlayerWorkflowInvokeResult>;
}

/** Builds a new workflow when {@link Player} handles `phase: "load"` (fresh graph / memory per session). */
export type PlayerWorkflowFactory = (strategy: string) => PlayerWorkflow;

export type GamePhase = "chat" | "decision" | "reveal" | "end";

export type GameMove = Cooperation;

export type LaunchHttpPlayersOptions = {
  readonly count: number;
  readonly basePort: number;
  readonly host?: string;
  readonly configs?: readonly PlayerConfig[];
};

/** Options for {@link a2aMessageSendUrl}. */
export interface A2aMessageSendUrlOptions {
  readonly hostForClient: string;
  readonly port: number;
  readonly ensName: EnsName;
  readonly protocol?: "http" | "https";
}
