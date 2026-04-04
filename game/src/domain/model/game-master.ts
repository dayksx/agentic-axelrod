/**
 * Game Master: orchestrates rounds, phases, and scoring hooks (HTTP / DB later).
 */
import { Tournament } from "./tournament.js";
import type {
  Match,
  ScheduledRound,
  TournamentConfig,
  TournamentResults,
} from "./types.js";

/** Phases that run in order for each 1v1 match (arena) in parallel with the other arenas. */
const MATCH_PHASES = [
  "LOAD",
  "ANNOUNCE",
  "CHAT",
  "DECISION",
  "REVEAL",
] as const;

export class GameMaster {
  /**
   * High-level hackathon flow: spin-up (stub) → register → scheduled rounds with phase stubs.
   * TODO: Replace console logs with PlayerGateway + store when implementing.
   */
  runTournamentSkeleton(config: TournamentConfig): TournamentResults {
    console.log("[GM] === Tournament start (skeleton) ===", config);

    // TODO: Spin up 6 LangGraph graphs from the `ai` workspace using PlayerConfig (url, strategyPrompt).
    console.log(
      "[GM] (stub) Would spawn 6 players via LangGraph (ai/) using config.players[].url …",
    );

    const tournament = new Tournament(config);
    console.log(
      `[GM] Registered ${tournament.getPlayers().length} players:`,
      tournament
        .getPlayers()
        .map((p) => p.name)
        .join(", "),
    );

    const schedule = tournament.buildSchedule();
    console.log(
      `[GM] Schedule: ${schedule.length} rounds × ${schedule[0]?.matches.length ?? 0} arenas`,
    );

    for (const round of schedule) {
      this.runRoundSkeleton(round);
    }

    console.log("[GM] === Tournament end (scores not computed yet) ===");
    return {
      scoresByPlayer: Object.fromEntries(
        tournament.getPlayers().map((p) => [p.name, 0]),
      ),
    };
  }

  /**
   * One tournament round: each scheduled match runs the full match phase chain; when all
   * arenas have finished, REVEAL_ANNOUNCEMENT runs once for the whole round (all six players).
   */
  private runRoundSkeleton(round: ScheduledRound): void {
    console.log(`\n[GM] --- Round ${round.roundIndex} ---`);
    for (const m of round.matches) {
      console.log(
        `[GM]   Arena ${m.arenaId}: ${m.playerA} vs ${m.playerB} (first speaker: ${m.firstSpeaker})`,
      );
    }

    for (const match of round.matches) {
      console.log(
        `\n[GM]   — Match (arena ${match.arenaId}: ${match.playerA} vs ${match.playerB}) —`,
      );
      for (const matchPhase of MATCH_PHASES) {
        this.runMatchPhase(round.roundIndex, match, matchPhase);
      }
    }

    console.log(
      `\n[GM]   — End of round ${round.roundIndex} (all matches done) —`,
    );
    this.runRevealAnnouncementPhase(round.roundIndex);
  }

  private runMatchPhase(
    roundIndex: number,
    match: Match,
    matchPhase: (typeof MATCH_PHASES)[number],
  ): void {
    const tag = `[arena ${match.arenaId} ${match.playerA} vs ${match.playerB}]`;

    switch (matchPhase) {
      case "LOAD":
        console.log(
          `[GM]     LOAD ${tag}: rules, tools, strategy, score, round meta → ${match.playerA} & ${match.playerB} (round ${roundIndex})`,
        );
        break;
      case "ANNOUNCE":
        console.log(
          `[GM]     ANNOUNCE ${tag}: each of the two players posts one public message; GM stores; neither reads others yet`,
        );
        break;
      case "CHAT":
        console.log(
          `[GM]     CHAT ${tag}: alternating via GM, 3 msgs/player, 6 total; firstSpeaker=${match.firstSpeaker}`,
        );
        break;
      case "DECISION":
        console.log(
          `[GM]     DECISION ${tag}: simultaneous C/D for this pair; invalid/timeout → C`,
        );
        break;
      case "REVEAL":
        console.log(
          `[GM]     REVEAL ${tag}: updated cumulative score to each player in this arena only`,
        );
        break;
      default: {
        const _exhaustive: never = matchPhase;
        return _exhaustive;
      }
    }
  }

  private runRevealAnnouncementPhase(roundIndex: number): void {
    console.log(
      `[GM]     REVEAL_ANNOUNCEMENT (round ${roundIndex}): broadcast all six players' announces from this round to everyone`,
    );
  }
}
