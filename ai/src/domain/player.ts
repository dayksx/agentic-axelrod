import type {
  EnsName,
  LoadPlayerConfig,
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
      this.workflow = this.createWorkflow(s.strategy);
      return {
        phase: "load",
        name: this.name,
        domain: this.domain,
        strategy: this.strategy,
      };
    }

    const identity = {
      name: this.name,
      domain: this.domain,
      strategy: this.strategy,
    } as const;

    if (phase === "chat") {
      if (typeof args.message !== "string" || args.message.length === 0) {
        throw new Error("message required for chat phase");
      }
      return this.workflow.invoke({
        ...identity,
        phase: "chat",
        message: args.message,
        iteration: args.iteration ?? 0,
      });
    }

    if (phase === "decision") {
      return this.workflow.invoke({ ...identity, phase: "decision" });
    }

    if (phase === "reveal") {
      if (args.reveal === undefined) {
        throw new Error("reveal document required for reveal phase");
      }
      return this.workflow.invoke({
        ...identity,
        phase: "reveal",
        reveal: args.reveal,
      });
    }

    if (phase === "end") {
      return this.workflow.invoke({
        ...identity,
        phase: "end",
      });
    }

    const _exhaustive: never = phase;
    void _exhaustive;
    throw new Error("unknown phase");
  }
}
