/**
 * Runnable skeleton: `pnpm run demo` after build.
 */
import { GameMaster } from "./domain/model/game-master.js";
import type { PlayerConfig, TournamentConfig } from "./domain/model/types.js";

function fakePlayers(): PlayerConfig[] {
  const names = ["Ada", "Bob", "Chen", "Dana", "Eli", "Faye"];
  return names.map((name) => ({
    name,
    strategyPrompt: `Play ${name}'s tournament strategy (TBD).`,
    url: `https://demo.url/a2a/${name.toLowerCase()}`,
  }));
}

const config: TournamentConfig = {
  players: fakePlayers(),
};

const gameMaster = new GameMaster();
gameMaster.runTournamentSkeleton(config);
