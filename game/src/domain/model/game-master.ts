/**
 * Game Master: orchestrates rounds, phases, and scoring hooks (HTTP / DB later).
 */
import {
  postAgentAnnounce,
  postAgentChat,
  postAgentDecision,
  postAgentEnd,
  postAgentLoad,
  postAgentReveal,
} from "../../adapter/http/agent-client.js";
import { resolveAgentBaseUrls } from "../../config/env-agent-urls.js";
import { Tournament } from "./tournament.js";
import {
  getScoresFromCooperation,
  type Cooperation,
  type Match,
  type ScheduledRound,
  type ArenaAnnouncement,
  type TournamentConfig,
  type TournamentResults,
} from "./types.js";

/** Phases that run in order for each 1v1 match (arena) in parallel with the other arenas. */
const MATCH_PHASES = [
  "LOAD",
  "ANNOUNCE",
  "CHAT",
  "DECISION",
  "REVEAL",
] as const;

/** In-memory tournament id until persistence (`announcements.tournament_id`). */
const DEFAULT_TOURNAMENT_ID = 1;

export class GameMaster {
  private readonly tournamentId = DEFAULT_TOURNAMENT_ID;
  private nextAnnouncementId = 1;
  private arenaAnnouncements: ArenaAnnouncement[] = [];

  private snapshotArenaAnnouncements(): readonly ArenaAnnouncement[] {
    return [...this.arenaAnnouncements];
  }

  private truncateAnnouncement(text: string, maxChars: number | undefined): string {
    if (maxChars === undefined || text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  }

  /**
   * High-level flow: load agents (HTTP) → scheduled rounds (chat / decision / reveal to agents).
   */
  async runTournament(
    config: TournamentConfig,
  ): Promise<TournamentResults> {
    console.log("[GM] === Tournament start ===", config);

    this.nextAnnouncementId = 1;
    this.arenaAnnouncements = [];

    const tournament = new Tournament(config);
    const players = tournament.getPlayers();
    const agentBaseUrls = resolveAgentBaseUrls(players);

    // Map player name to agent base URL
    const nameToAgentUrl = new Map<string, string>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i]!;
      const u = agentBaseUrls[i];
      if (u === undefined) {
        throw new Error(`Missing agent base URL for player index ${i}`);
      }
      nameToAgentUrl.set(p.name, u);
    }

    // Load agents
    await Promise.all(
      players.map((p, i) => {
        const agentBaseUrl = agentBaseUrls[i];
        if (agentBaseUrl === undefined) {
          throw new Error(`Missing agent base URL for player index ${i}`);
        }
        return postAgentLoad(agentBaseUrl, {
          name: p.name,
          strategy: p.strategyPrompt,
        });
      }),
    );
    console.log(
      "[GM] Load phase complete for:",
      players.map((p) => p.name).join(", "),
    );

    // Initialize scores for each player
    const scores: Record<string, number> = Object.fromEntries(
      players.map((p) => [p.name, 0]),
    );

    // Build schedule
    const schedule = tournament.buildSchedule();
    console.log(
      `[GM] Schedule: ${schedule.length} rounds × ${schedule[0]?.matches.length ?? 0} arenas`,
    );

    // Run rounds
    for (const round of schedule) {
      await this.runRound(
        round,
        nameToAgentUrl,
        scores,
        config.announceMaxChars,
      );
    }

    await Promise.all(
      players.map((p, i) => {
        const u = agentBaseUrls[i];
        if (u === undefined) {
          throw new Error(`Missing agent base URL for player index ${i}`);
        }
        return postAgentEnd(u);
      }),
    );
    console.log("[GM] Tournament end: cleared announcement state on all agents");

    console.log("[GM] === Tournament end ===", scores);
    return { scoresByPlayer: { ...scores } };
  }

  /**
   * One tournament round: each scheduled match runs the full match phase chain; when all
   * arenas have finished, REVEAL_ANNOUNCEMENT runs once for the whole round (all six players).
   */
  private async runRound(
    round: ScheduledRound,
    nameToAgentUrl: ReadonlyMap<string, string>,
    scores: Record<string, number>,
    announceMaxChars: number | undefined,
  ): Promise<void> {
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
      await this.runMatch(
        round.roundIndex,
        match,
        nameToAgentUrl,
        scores,
        announceMaxChars,
      );
    }

    console.log(
      `\n[GM]   — End of round ${round.roundIndex} (all matches done) —`,
    );
    this.runRevealAnnouncementPhase(round.roundIndex);
  }

  private async runMatch(
    roundIndex: number,
    match: Match,
    nameToAgentUrl: ReadonlyMap<string, string>,
    scores: Record<string, number>,
    announceMaxChars: number | undefined,
  ): Promise<void> {
    let movesForReveal: { moveA: Cooperation; moveB: Cooperation } | null =
      null;

    for (const matchPhase of MATCH_PHASES) {
      await this.runMatchPhase(
        roundIndex,
        match,
        matchPhase,
        nameToAgentUrl,
        scores,
        announceMaxChars,
        (d) => {
          movesForReveal = d;
        },
        () => movesForReveal,
      );
    }
  }

  private async runMatchPhase(
    roundIndex: number,
    match: Match,
    matchPhase: (typeof MATCH_PHASES)[number],
    nameToAgentUrl: ReadonlyMap<string, string>,
    scores: Record<string, number>,
    announceMaxChars: number | undefined,
    setMoves: (d: { moveA: Cooperation; moveB: Cooperation }) => void,
    getMoves: () => { moveA: Cooperation; moveB: Cooperation } | null,
  ): Promise<void> {
    const tag = `[arena ${match.arenaId} ${match.playerA} vs ${match.playerB}]`;

    switch (matchPhase) {
      case "LOAD":
        console.log(
          `[GM]     LOAD ${tag}: rules, tools, strategy, score, round meta → ${match.playerA} & ${match.playerB} (round ${roundIndex})`,
        );
        return;
      case "ANNOUNCE":
        await this.runArenaAnnouncePhase(
          roundIndex,
          match,
          nameToAgentUrl,
          announceMaxChars,
          tag,
        );
        return;
      case "CHAT":
        await this.runArenaChatPhase(
          roundIndex,
          match,
          nameToAgentUrl,
          tag,
          this.snapshotArenaAnnouncements(),
        );
        return;
      case "DECISION": {
        console.log(
          `[GM]     DECISION ${tag}: simultaneous cooperate/defect; invalid/timeout → cooperate`,
        );
        const urlA = nameToAgentUrl.get(match.playerA);
        const urlB = nameToAgentUrl.get(match.playerB);
        if (urlA === undefined || urlB === undefined) {
          throw new Error(
            `[GM] Missing agent URL for ${match.playerA} or ${match.playerB}`,
          );
        }
        const pubs = this.snapshotArenaAnnouncements();
        const [moveA, moveB] = await Promise.all([
          postAgentDecision(urlA, { arenaAnnouncements: pubs }),
          postAgentDecision(urlB, { arenaAnnouncements: pubs }),
        ]);
        // Store moves for reveal phase
        setMoves({ moveA, moveB });
        console.log(
          `[GM]     DECISION ${tag}: ${match.playerA}=${moveA} ${match.playerB}=${moveB}`,
        );
        return;
      }
      case "REVEAL": {
        // Get moves for reveal phase
        const d = getMoves();
        if (d === null) {
          throw new Error(
            `[GM] REVEAL ${tag}: missing moves (run DECISION first)`,
          );
        }
        await this.runArenaRevealPhase(
          roundIndex,
          match,
          nameToAgentUrl,
          scores,
          d.moveA,
          d.moveB,
          tag,
        );
        return;
      }
      default: {
        const _exhaustive: never = matchPhase;
        return _exhaustive;
      }
    }
  }

  private async runArenaAnnouncePhase(
    roundIndex: number,
    match: Match,
    nameToAgentUrl: ReadonlyMap<string, string>,
    announceMaxChars: number | undefined,
    tag: string,
  ): Promise<void> {
    const order = [match.playerA, match.playerB] as const;
    for (const player of order) {
      const url = nameToAgentUrl.get(player);
      if (url === undefined) {
        throw new Error(`[GM] Missing agent URL for announce ${player}`);
      }
      const raw = await postAgentAnnounce(url, {
        tournamentId: this.tournamentId,
        roundNumber: roundIndex,
        arenaId: match.arenaId,
        arenaAnnouncements: this.snapshotArenaAnnouncements(),
      });
      const message = this.truncateAnnouncement(raw, announceMaxChars);
      const row: ArenaAnnouncement = {
        id: this.nextAnnouncementId++,
        tournamentId: this.tournamentId,
        roundNumber: roundIndex,
        arenaId: match.arenaId,
        message,
        agentName: player,
      };
      this.arenaAnnouncements.push(row);
      const preview =
        message.length > 120 ? `${message.slice(0, 120)}…` : message;
      console.log(`[GM]     ANNOUNCE ${tag} ${player}: ${preview}`);
    }
  }

  private async runArenaChatPhase(
    roundIndex: number,
    match: Match,
    nameToAgentUrl: ReadonlyMap<string, string>,
    tag: string,
    arenaAnnouncements: readonly ArenaAnnouncement[],
  ): Promise<void> {
    const urlA = nameToAgentUrl.get(match.playerA);
    const urlB = nameToAgentUrl.get(match.playerB);
    if (urlA === undefined || urlB === undefined) {
      throw new Error(
        `[GM] Missing agent URL for chat ${match.playerA} or ${match.playerB}`,
      );
    }

    const first = match.firstSpeaker;
    const second = first === match.playerA ? match.playerB : match.playerA;

    let lastReply: string | null = null;

    for (let i = 0; i < 6; i++) {
      // Determine speaker and opponent
      const speaker = i % 2 === 0 ? first : second;
      const opponent =
        speaker === match.playerA ? match.playerB : match.playerA;
      // Get URL for speaker
      const url = speaker === match.playerA ? urlA : urlB;
      // Get turn number for speaker
      const turnForSpeaker = Math.floor(i / 2) + 1;

      // Build message for speaker
      const message =
        lastReply === null
          ? `[Game master] Tournament round ${roundIndex}: you are matched with ${opponent}. Public arena chat — your message ${turnForSpeaker}/3.`
          : `[Game master] ${opponent} said:\n${lastReply}\n\nYour message ${turnForSpeaker}/3.`;

      // Post message to agent
      const reply = await postAgentChat(url, {
        message,
        iteration: roundIndex,
        arenaAnnouncements,
      });
      // Preview message for logging
      const preview = reply.length > 160 ? `${reply.slice(0, 160)}…` : reply;
      console.log(`[GM]     CHAT ${tag} ${speaker}: ${preview}`);
      // Store last reply for next turn
      lastReply = reply;
    }
  }

  private async runArenaRevealPhase(
    roundIndex: number,
    match: Match,
    nameToAgentUrl: ReadonlyMap<string, string>,
    scores: Record<string, number>,
    moveA: Cooperation,
    moveB: Cooperation,
    tag: string,
  ): Promise<void> {
    const urlA = nameToAgentUrl.get(match.playerA);
    const urlB = nameToAgentUrl.get(match.playerB);
    if (urlA === undefined || urlB === undefined) {
      throw new Error(
        `[GM] Missing agent URL for reveal ${match.playerA} or ${match.playerB}`,
      );
    }

    // Calculate round points
    const roundPts = getScoresFromCooperation(moveA, moveB);
    // Get previous scores
    const prevA = scores[match.playerA] ?? 0;
    const prevB = scores[match.playerB] ?? 0;
    // Update scores
    scores[match.playerA] = prevA + roundPts.you;
    scores[match.playerB] = prevB + roundPts.opponent;

    // Post reveal to agents
    await Promise.all([
      postAgentReveal(urlA, {
        round: roundIndex,
        yourMove: moveA,
        adversaryMove: moveB,
        yourScore: scores[match.playerA]!,
        adversaryScore: scores[match.playerB]!,
      }),
      postAgentReveal(urlB, {
        round: roundIndex,
        yourMove: moveB,
        adversaryMove: moveA,
        yourScore: scores[match.playerB]!,
        adversaryScore: scores[match.playerA]!,
      }),
    ]);

    console.log(
      `[GM]     REVEAL ${tag}: cumulative ${match.playerA}=${scores[match.playerA]} ${match.playerB}=${scores[match.playerB]}`,
    );
  }

  private runRevealAnnouncementPhase(roundIndex: number): void {
    console.log(
      `[GM]     REVEAL_ANNOUNCEMENT (round ${roundIndex}): ${this.arenaAnnouncements.length} arena announcement row(s) in GM + agent context (synced on each chat/decision/announce)`,
    );
  }
}
