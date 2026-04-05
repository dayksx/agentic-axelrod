import { stepsForRound } from "./organize";
import type {
  OrganizedTournament,
  TimelineState,
  DerivedArenaState,
  LeaderboardEntry,
  Phase,
  ScoreSnapshot,
  AgentAnnouncement,
} from "@/types/models";

const CHAT_STEPS = 6;

/**
 * The single pure function that maps a step index to the full UI state.
 *
 * Step layout within a round (10 steps total):
 *   [0]     announcement   (agents broadcast their public statements)
 *   [1..6]  chat           (one message per step, across all arenas simultaneously)
 *   [7]     decision_sealed
 *   [8]     decision_revealed
 *   [9]     scoring
 */
export function deriveState(
  step: number,
  tournament: OrganizedTournament,
): TimelineState {
  const clamped = Math.max(0, Math.min(step, tournament.totalSteps - 1));

  let remaining = clamped;
  let roundIndex = 0;

  for (let i = 0; i < tournament.rounds.length; i++) {
    const round = tournament.rounds[i];
    const roundSteps = stepsForRound();
    if (remaining < roundSteps) {
      roundIndex = i;
      break;
    }
    remaining -= roundSteps;
    if (i === tournament.rounds.length - 1) {
      roundIndex = i;
      remaining = roundSteps - 1;
    }
  }

  const round = tournament.rounds[roundIndex];

  let phase: Phase;
  let chatStep = 0;

  if (remaining === 0) {
    phase = "announcement";
  } else if (remaining <= CHAT_STEPS) {
    phase = "chat";
    chatStep = remaining - 1; // 0-based chat index
  } else if (remaining === CHAT_STEPS + 1) {
    phase = "decision_sealed";
  } else if (remaining === CHAT_STEPS + 2) {
    phase = "decision_revealed";
  } else {
    phase = "scoring";
  }

  const showDecisions =
    phase === "decision_revealed" || phase === "scoring";
  const showDeltas = phase === "scoring";

  const arenas: DerivedArenaState[] = round.arenas.map((arena) => ({
    arenaId: arena.arenaId,
    agentA: arena.match.agent_a,
    agentB: arena.match.agent_b,
    visibleMessages:
      phase === "chat" ? arena.messages.slice(0, chatStep + 1) : arena.messages,
    decisionA: showDecisions ? (arena.match.decision_a ?? "sealed") : "sealed",
    decisionB: showDecisions ? (arena.match.decision_b ?? "sealed") : "sealed",
    deltaA: showDeltas ? arena.match.delta_a : null,
    deltaB: showDeltas ? arena.match.delta_b : null,
  }));

  const announcements: AgentAnnouncement[] = round.announcements;
  const leaderboard = buildLeaderboard(tournament, roundIndex, phase);

  return {
    round: round.roundNumber,
    phase,
    chatStep,
    arenas,
    announcements,
    leaderboard,
  };
}

/**
 * Leaderboard shows:
 * - During announcement/chat/decision phases: cumulative scores through the PREVIOUS round
 * - During scoring: cumulative scores through the CURRENT round
 */
function buildLeaderboard(
  tournament: OrganizedTournament,
  roundIndex: number,
  phase: Phase,
): LeaderboardEntry[] {
  const useCurrentRound = phase === "scoring";
  const scoreRoundIndex = useCurrentRound ? roundIndex : roundIndex - 1;

  const scoreMap: Record<string, number> = {};
  for (const agent of tournament.agents) {
    scoreMap[agent.name] = 0;
  }

  if (scoreRoundIndex >= 0) {
    const scores: ScoreSnapshot = tournament.rounds[scoreRoundIndex].scores;
    for (const [name, s] of Object.entries(scores)) {
      scoreMap[name] = s.cumulative;
    }
  }

  const entries: LeaderboardEntry[] = Object.entries(scoreMap)
    .map(([agentName, score]) => ({ agentName, score, rank: 0 }))
    .sort((a, b) => b.score - a.score);

  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  return entries;
}
