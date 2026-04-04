/**
 * Tournament: registered players + double round-robin schedule for six players (30 meetings).
 * How those 30 are grouped into rounds is controlled by `totalRounds` × `arenasPerRound` (default 10×3).
 */
import type {
  PlayerConfig,
  ScheduledRound,
  TournamentConfig,
} from "./types.js";

const DEFAULT_ROUNDS = 10;
const DEFAULT_ARENAS = 3;

/**
 * Standard single round-robin for six players: five rounds, three disjoint pairings each.
 * Numbers are indices into roster order (`TournamentConfig.players` / constructor order).
 *
 * Hardcoded for now; TODO: make dynamic.
 */
const SIX_PLAYER_SINGLE_ROUND_ROBIN_INDICES: readonly (readonly [
  number,
  number,
])[][] = [
  [
    [0, 5],
    [1, 4],
    [2, 3],
  ],
  [
    [0, 4],
    [5, 3],
    [1, 2],
  ],
  [
    [0, 3],
    [4, 2],
    [5, 1],
  ],
  [
    [0, 2],
    [3, 1],
    [4, 5],
  ],
  [
    [0, 1],
    [2, 5],
    [3, 4],
  ],
];

/**
 * One tournament run: players are fixed at construction (new run → new instance).
 * Pairing logic assumes exactly six players.
 */
export class Tournament {
  private readonly players: PlayerConfig[];
  private readonly totalRounds: number;
  private readonly arenasPerRound: number;

  constructor(config: TournamentConfig) {
    const { players } = config;
    const names = players.map((p) => p.name);
    const unique = new Set(names);
    if (unique.size !== names.length) {
      throw new Error("Player names must be unique");
    }
    this.players = [...players];
    this.totalRounds = config.totalRounds ?? DEFAULT_ROUNDS;
    this.arenasPerRound = config.arenasPerRound ?? DEFAULT_ARENAS;
  }

  getPlayers(): readonly PlayerConfig[] {
    return this.players;
  }

  /**
   * Double round-robin for six players: 30 meetings total, grouped into
   * `this.totalRounds` rounds with `this.arenasPerRound` parallel arenas each
   * (must multiply to 30). Each unordered pair meets twice; firstSpeaker swaps between meetings.
   */
  buildSchedule(): ScheduledRound[] {
    const pairingsInOrder = this.buildDoubleRoundRobinPairingsFlat();
    const { totalRounds, arenasPerRound } = this;
    const slotCount = totalRounds * arenasPerRound;
    if (pairingsInOrder.length !== slotCount) {
      throw new Error(
        `Expected totalRounds × arenasPerRound === ${pairingsInOrder.length} (six-player double RR), got ${totalRounds} × ${arenasPerRound} = ${slotCount}`,
      );
    }

    const schedule: ScheduledRound[] = [];
    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
      const start = roundIndex * arenasPerRound;
      const pairingsThisRound = pairingsInOrder.slice(
        start,
        start + arenasPerRound,
      );
      schedule.push({
        roundIndex: roundIndex + 1,
        matches: pairingsThisRound.map((pairing, arenaSlotIndex) => ({
          arenaId: arenaSlotIndex + 1,
          playerA: pairing.playerA,
          playerB: pairing.playerB,
          firstSpeaker: pairing.firstSpeaker,
        })),
      });
    }
    return schedule;
  }

  /**
   * Collapse `Pairing[][]` (five “circle” rounds × three pairings, twice for double RR)
   * into one list of 30 pairings for generic `totalRounds` / `arenasPerRound` chunking.
   */
  private buildDoubleRoundRobinPairingsFlat(): Pairing[] {
    return this.buildDoubleRoundRobinRounds().flat();
  }

  /**
   * First five entries: one full single round-robin (each unordered pair once).
   * Next five: same pairings with `firstSpeaker` flipped so every pair meets twice.
   */
  private buildDoubleRoundRobinRounds(): Pairing[][] {
    const rosterNames = this.players.map((p) => p.name);

    // First half: each pairing meets once.
    const firstHalf = SIX_PLAYER_SINGLE_ROUND_ROBIN_INDICES.map(
      (roundIndices) =>
        roundIndices.map(([indexA, indexB]) => {
          const playerA = rosterNames[indexA]!;
          const playerB = rosterNames[indexB]!;
          return {
            playerA,
            playerB,
            firstSpeaker: playerA,
          };
        }),
    );

    // Swap firstSpeaker for each pairing in the second half.
    const secondHalf = firstHalf.map((roundPairings) =>
      roundPairings.map((pairing) => ({
        ...pairing,
        firstSpeaker:
          pairing.firstSpeaker === pairing.playerA
            ? pairing.playerB
            : pairing.playerA,
      })),
    );

    return [...firstHalf, ...secondHalf];
  }
}

/** One pairing in a meeting: two players + who speaks first in chat. */
interface Pairing {
  playerA: string;
  playerB: string;
  firstSpeaker: string;
}
