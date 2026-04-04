import type {
  EnsName,
  PlayerConfig,
  PlayerWorkflow,
  PlayerWorkflowInvokeResult,
  RevealRoundDocument,
  WorkflowPhase,
} from "./types.js";

export class Player {
  readonly name: EnsName;
  readonly domain: string;
  readonly strategy: string;

  constructor(
    config: PlayerConfig,
    private readonly workflow: PlayerWorkflow,
  ) {
    this.name = config.name;
    this.domain = config.domain;
    this.strategy = config.strategy;
  }

  async invoke(
    phase: WorkflowPhase,
    args: {
      message?: string;
      iteration?: number;
      reveal?: RevealRoundDocument;
    },
  ): Promise<PlayerWorkflowInvokeResult> {
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
