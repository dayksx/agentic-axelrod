import type {
  ArenaAnnouncement,
  EnsName,
  LoadPlayerConfig,
  LoadRosterRole,
  PlayerConfig,
  PlayerWorkflow,
  PlayerWorkflowFactory,
  PlayerWorkflowInvokeResult,
  RevealRoundDocument,
  WorkflowPhase,
} from "./types.js";

export class Player {
  private workflow: PlayerWorkflow;
  private createWorkflow: PlayerWorkflowFactory | undefined;

  /** Updated by constructor and `phase: "load"` only. */
  name: EnsName;
  /** Updated by constructor and `phase: "load"` only. */
  domain: string;
  /** Updated by constructor and `phase: "load"` only. */
  strategy: string;

  /**
   * Set on `phase: "load"` from `playerConfig.tournamentId`. LangGraph thread id is `${name}:${activeTournamentId}`.
   */
  activeTournamentId = 0;

  /** Set on `phase: "load"` — series roster hint from GM (`new` vs `carryover`). */
  rosterRole: LoadRosterRole = "new";

  /**
   * @param workflow - Initial graph; omit only when `createWorkflow` is provided.
   * @param createWorkflow - If set, used on `phase: "load"` to replace the workflow. Pass from `createPlayer` when using the default LangGraph backend.
   */
  constructor(
    config: PlayerConfig,
    workflow?: PlayerWorkflow,
    createWorkflow?: PlayerWorkflowFactory,
  ) {
    this.name = config.name;
    this.domain = config.domain;
    this.strategy = config.strategy;
    this.createWorkflow = createWorkflow;
    if (workflow !== undefined) {
      this.workflow = workflow;
    } else if (createWorkflow !== undefined) {
      this.workflow = createWorkflow(config.strategy);
    } else {
      throw new Error(
        "Player requires an initial workflow or createWorkflow(strategy)",
      );
    }
  }

  async invoke(
    phase: WorkflowPhase,
    args: {
      message?: string;
      iteration?: number;
      reveal?: RevealRoundDocument;
      playerConfig?: LoadPlayerConfig;
      tournamentId?: number;
      roundNumber?: number;
      arenaId?: number;
      arenaAnnouncements?: readonly ArenaAnnouncement[];
    },
  ): Promise<PlayerWorkflowInvokeResult> {
    if (phase === "load") {
      if (args.playerConfig === undefined) {
        throw new Error("playerConfig required for load phase");
      }
      if (this.createWorkflow === undefined) {
        throw new Error(
          "load is not supported: Player was constructed with a fixed workflow and no createWorkflow factory",
        );
      }
      const s = args.playerConfig;
      this.name = s.name;
      this.domain = s.domain;
      this.strategy = s.strategy;
      this.activeTournamentId = s.tournamentId;
      this.rosterRole = s.rosterRole ?? "new";
      this.workflow = this.createWorkflow(s.strategy);
      return {
        phase: "load",
        name: this.name,
        domain: this.domain,
        strategy: this.strategy,
        tournamentId: this.activeTournamentId,
        rosterRole: this.rosterRole,
      };
    }

    if (this.activeTournamentId === 0) {
      throw new Error(
        'phase: "load" with tournamentId is required before other phases',
      );
    }

    const identity = {
      name: this.name,
      domain: this.domain,
      strategy: this.strategy,
    } as const;

    const tid = this.activeTournamentId;

    if (phase === "announce") {
      if (
        args.tournamentId === undefined ||
        args.roundNumber === undefined ||
        args.arenaId === undefined
      ) {
        throw new Error(
          "announce phase requires tournamentId, roundNumber, and arenaId",
        );
      }
      if (args.tournamentId !== this.activeTournamentId) {
        throw new Error(
          `announce tournamentId ${args.tournamentId} does not match loaded tournament ${this.activeTournamentId}`,
        );
      }
      return this.workflow.invoke({
        ...identity,
        phase: "announce",
        tournamentId: args.tournamentId,
        roundNumber: args.roundNumber,
        arenaId: args.arenaId,
        arenaAnnouncements: args.arenaAnnouncements ?? [],
      });
    }

    if (phase === "chat") {
      if (typeof args.message !== "string" || args.message.length === 0) {
        throw new Error("message required for chat phase");
      }
      return this.workflow.invoke({
        ...identity,
        phase: "chat",
        tournamentId: tid,
        message: args.message,
        iteration: args.iteration ?? 0,
        ...(args.arenaAnnouncements !== undefined
          ? { arenaAnnouncements: args.arenaAnnouncements }
          : {}),
      });
    }

    if (phase === "decision") {
      return this.workflow.invoke({
        ...identity,
        phase: "decision",
        tournamentId: tid,
        ...(args.arenaAnnouncements !== undefined
          ? { arenaAnnouncements: args.arenaAnnouncements }
          : {}),
      });
    }

    if (phase === "reveal") {
      if (args.reveal === undefined) {
        throw new Error("reveal document required for reveal phase");
      }
      return this.workflow.invoke({
        ...identity,
        phase: "reveal",
        tournamentId: tid,
        reveal: args.reveal,
      });
    }

    if (phase === "end") {
      return this.workflow.invoke({
        ...identity,
        phase: "end",
        tournamentId: tid,
      });
    }

    const _exhaustive: never = phase;
    void _exhaustive;
    throw new Error("unknown phase");
  }
}
