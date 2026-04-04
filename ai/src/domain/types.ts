/**
 * Domain types (no imports from adapters — keeps dependency direction clean).
 */

export type EnsName = `${string}.eth`;

export type Cooperation = "cooperate" | "defect";

/**
 * Public announcement for a specific arena (1v1 match) in a round — not a single “tournament” proclamation.
 * Aligns with `announcements` (tournament_id, round_number, message) plus `arenaId` and `agentName` until DB stores them.
 */
export interface ArenaAnnouncement {
  readonly id: number;
  readonly tournamentId: number;
  readonly roundNumber: number;
  /** Which arena in the round (same as GM `Match.arenaId`). */
  readonly arenaId: number;
  readonly message: string;
  readonly agentName: EnsName;
}

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
export const WORKFLOW_PHASES = [
  "load",
  "announce",
  "chat",
  "decision",
  "reveal",
  "end",
] as const;

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
      phase: "announce";
      tournamentId: number;
      roundNumber: number;
      arenaId: number;
      arenaAnnouncements: readonly ArenaAnnouncement[];
    }
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "chat";
      iteration: number;
      message: string;
      arenaAnnouncements?: readonly ArenaAnnouncement[];
    }
  | {
      readonly name: EnsName;
      readonly domain: string;
      readonly strategy: string;
      phase: "decision";
      arenaAnnouncements?: readonly ArenaAnnouncement[];
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
  | { phase: "announce"; announcement: string }
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

export type GamePhase = "announce" | "chat" | "decision" | "reveal" | "end";

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
