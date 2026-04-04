import { startPlayerHttpServer } from "../adapter/http/agent-server.js";
import { LangGraphPlayerWorkflow } from "../adapter/workflow/player-workflow.js";
import { Player } from "../domain/player.js";
import type {
  EnsName,
  LaunchHttpPlayersOptions,
  PlayerConfig,
  PlayerWorkflow,
} from "../domain/types.js";

export type { LaunchHttpPlayersOptions };

export type HttpPlayerBinding = {
  readonly player: Player;
  readonly port: number;
};

/** Placeholder until the GM sends `phase: "load"` with real name, domain, and strategy. */
function defaultPlayerConfig(index1Based: number): PlayerConfig {
  const name = `slot${index1Based}.eth` as EnsName;
  return {
    name,
    domain: `https://slot${index1Based}.local`,
    strategy: "",
  };
}

/**
 * Wire a {@link Player} with the default LangGraph workflow unless you pass a custom one.
 * Default players get a `createWorkflow` factory so `phase: "load"` can start a fresh graph per session.
 */
export function createPlayer(
  config: PlayerConfig,
  workflow?: PlayerWorkflow,
): Player {
  if (workflow !== undefined) {
    return new Player(config, workflow, undefined);
  }
  return new Player(
    config,
    undefined,
    (strategy) => new LangGraphPlayerWorkflow(strategy),
  );
}

// TODO: Remove it when we deploy the players to the cloud
export async function launchHttpPlayers(
  options: LaunchHttpPlayersOptions,
): Promise<{
  readonly bindings: readonly HttpPlayerBinding[];
  readonly shutdown: () => Promise<void>;
}> {
  const { count, basePort, host } = options;
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("launchHttpPlayers: count must be a positive integer");
  }
  if (!Number.isInteger(basePort) || basePort < 1) {
    throw new Error("launchHttpPlayers: basePort must be a positive integer");
  }
  if (options.configs !== undefined && options.configs.length !== count) {
    throw new Error("launchHttpPlayers: configs length must match count");
  }

  const bindings: HttpPlayerBinding[] = [];
  const closers: (() => Promise<void>)[] = [];

  for (let i = 0; i < count; i++) {
    const config = options.configs?.[i] ?? defaultPlayerConfig(i + 1);
    const player = createPlayer(config);
    const port = basePort + i;
    const { close } = await startPlayerHttpServer(
      player,
      port,
      host ?? "0.0.0.0",
    );
    closers.push(close);
    bindings.push({ player, port });
  }

  async function shutdown(): Promise<void> {
    await Promise.all(closers.map((c) => c()));
  }

  return { bindings, shutdown };
}
