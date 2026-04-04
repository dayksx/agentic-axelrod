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

/** Canonical phases accepted by {@link Player.invoke} and the HTTP `/message/send` handler. */
export const WORKFLOW_PHASES = ["chat", "decision", "reveal", "end"] as const;

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
  | { phase: "chat"; reply: string }
  | { phase: "decision"; cooperation: Cooperation }
  | { phase: "reveal" }
  | { phase: "end" };

/** LLM / LangGraph backend for a {@link Player}. */
export interface PlayerWorkflow {
  invoke(input: PlayerWorkflowInvokeInput): Promise<PlayerWorkflowInvokeResult>;
}

export type GamePhase = "chat" | "decision" | "reveal" | "end";

export type GameMove = Cooperation;

export type ParsedLaunchCli =
  | { readonly kind: "help" }
  | {
      readonly kind: "ok";
      readonly playersFromCli?: number;
      readonly portBaseFromCli?: number;
      readonly hostFromCli?: string;
      readonly ensNames: readonly string[];
      readonly strategyPrompts: readonly string[];
    };

export type ResolvedLaunchOptions = {
  readonly players: number;
  readonly portBase: number;
  readonly host: string;
  readonly ensNames: readonly string[];
  readonly strategyPrompts: readonly string[];
};

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
