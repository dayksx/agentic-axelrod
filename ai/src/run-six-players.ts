/**
 * Starts six blank HTTP agents on ports 3100–3105 via {@link launchHttpPlayers}.
 * Use `phase: "load"` on each URL before play. Ctrl+C shuts down all servers.
 */
import "dotenv/config";

import { a2aMessageSendUrl } from "./adapter/http/agent-server.js";
import { launchHttpPlayers } from "./application/launch-http-players.js";

const COUNT = 6;
const BASE_PORT = 3100;
const HOST = "0.0.0.0";

const clientHost = HOST === "0.0.0.0" || HOST === "::" ? "127.0.0.1" : HOST;

const { bindings, shutdown } = await launchHttpPlayers({
  count: COUNT,
  basePort: BASE_PORT,
  host: HOST,
});

console.log(
  `[fleet] ${COUNT} agents on ${BASE_PORT}–${BASE_PORT + COUNT - 1} — load before play; GET /player to inspect identity\n`,
);
for (const { player, port } of bindings) {
  const sendUrl = a2aMessageSendUrl({
    hostForClient: clientHost,
    port,
    ensName: player.name,
  });
  const detailsUrl = `http://${clientHost}:${port}/player`;
  console.log(`${player.name} → POST ${sendUrl}`);
  console.log(`           GET  ${detailsUrl}`);
}

const stop = async () => {
  await shutdown();
  process.exit(0);
};
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => void stop());
}
