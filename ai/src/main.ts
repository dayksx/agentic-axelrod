import "dotenv/config";

import { a2aMessageSendUrl } from "./adapter/http/agent-server.js";
import { launchHttpPlayers } from "./application/launch-http-players.js";
import {
  buildPlayerConfigs,
  padEnsNames,
  padStrategyPrompts,
  parseLaunchArgv,
  printLaunchUsage,
  resolveLaunchOptions,
} from "./application/cli/parse-launch-args.js";
import type { EnsName } from "./domain/types.js";

// Parse CLI arguments
const parsed = parseLaunchArgv(process.argv);
if (parsed.kind === "help") {
  printLaunchUsage();
  process.exit(0);
}

const opts = resolveLaunchOptions(parsed);
const names = padEnsNames(opts.ensNames, opts.players);
const strategies = padStrategyPrompts(opts.strategyPrompts, opts.players);
const configs = buildPlayerConfigs(names, strategies);

// Launch HTTP players
const { bindings, shutdown } = await launchHttpPlayers({
  count: opts.players,
  basePort: opts.portBase,
  host: opts.host,
  configs,
});

// Print HTTP players endpoints
const clientHost =
  opts.host === "0.0.0.0" || opts.host === "::" ? "127.0.0.1" : opts.host;
const endpoint = (port: number, ensName: EnsName) =>
  a2aMessageSendUrl({ hostForClient: clientHost, port, ensName });

for (const { player, port } of bindings) {
  console.log(`player ${player.name} → ${endpoint(port, player.name)}`);
}

const stop = async () => {
  await shutdown();
  process.exit(0);
};
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => void stop());
}
