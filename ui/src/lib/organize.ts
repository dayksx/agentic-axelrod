import type {
  TournamentData,
  OrganizedTournament,
  Round,
  ArenaRound,
  ScoreSnapshot,
  AgentAnnouncement,
} from "@/types/models";

/**
 * Steps per round:
 *   1 announcement + 6 chat messages + 1 decision_sealed + 1 decision_revealed + 1 scoring = 10
 *
 * Announcement is always the first step (even if the array is empty, the phase exists).
 */
const ANNOUNCEMENT_STEPS = 1;
const CHAT_STEPS = 6;
const NON_CHAT_STEPS = 3; // sealed + revealed + scoring

export function stepsForRound(): number {
  return ANNOUNCEMENT_STEPS + CHAT_STEPS + NON_CHAT_STEPS;
}

export function organizeByRound(data: TournamentData): OrganizedTournament {
  const matchesByRound = new Map<number, typeof data.matches>();
  for (const match of data.matches) {
    const list = matchesByRound.get(match.round_number) ?? [];
    list.push(match);
    matchesByRound.set(match.round_number, list);
  }

  const messagesByMatch = new Map<number, typeof data.chatMessages>();
  for (const msg of data.chatMessages) {
    const list = messagesByMatch.get(msg.match_id) ?? [];
    list.push(msg);
    messagesByMatch.set(msg.match_id, list);
  }

  const scoresByRound = new Map<number, typeof data.scores>();
  for (const score of data.scores) {
    const list = scoresByRound.get(score.round_number) ?? [];
    list.push(score);
    scoresByRound.set(score.round_number, list);
  }

  const agentNameById = new Map<number, string>();
  for (const agent of data.agents) {
    agentNameById.set(agent.id, agent.name);
  }

  const announcementsByRound = new Map<number, AgentAnnouncement[]>();
  for (const a of data.announcements) {
    const list = announcementsByRound.get(a.round_number) ?? [];
    list.push({
      agentId: a.agent_id,
      agentName: agentNameById.get(a.agent_id) ?? `Agent ${a.agent_id}`,
      message: a.message,
    });
    announcementsByRound.set(a.round_number, list);
  }

  const roundNumbers = [...matchesByRound.keys()].sort((a, b) => a - b);

  let totalSteps = 0;
  const rounds: Round[] = roundNumbers.map((roundNum) => {
    const roundMatches = matchesByRound.get(roundNum) ?? [];
    const arenas: ArenaRound[] = roundMatches
      .sort((a, b) => a.arena_id - b.arena_id)
      .map((match) => ({
        arenaId: match.arena_id,
        match,
        messages: (messagesByMatch.get(match.id) ?? []).sort(
          (a, b) => a.turn_number - b.turn_number,
        ),
      }));

    const roundScores = scoresByRound.get(roundNum) ?? [];
    const scores: ScoreSnapshot = {};
    for (const s of roundScores) {
      scores[s.agent_name] = { delta: s.delta, cumulative: s.cumulative };
    }

    const announcements = announcementsByRound.get(roundNum) ?? [];
    totalSteps += stepsForRound();

    return { roundNumber: roundNum, arenas, announcements, scores };
  });

  return {
    tournament: data.tournament,
    agents: data.agents,
    rounds,
    totalSteps,
    transactions: data.transactions,
  };
}
