import { stepsForRound } from "./organize";
import type {
  OrganizedTournament,
  TimelineState,
  DerivedArenaState,
  LeaderboardEntry,
  Phase,
  ScoreSnapshot,
} from "@/types/models";

const CHAT_STEPS = 6;

/**
 * The single pure function that maps a step index to the full UI state.
 *
 * Step layout within a round:
 *   [0..5]  chat (one message per step, across all arenas simultaneously)
 *   [6]     decision_sealed
 *   [7]     decision_revealed
 *   [8]     scoring
 *   [9]     announcement (only if round has one)
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
    const roundSteps = stepsForRound(round.announcement !== null);
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

  if (remaining < CHAT_STEPS) {
    phase = "chat";
    chatStep = remaining;
  } else if (remaining === CHAT_STEPS) {
    phase = "decision_sealed";
  } else if (remaining === CHAT_STEPS + 1) {
    phase = "decision_revealed";
  } else if (remaining === CHAT_STEPS + 2) {
    phase = "scoring";
  } else {
    phase = "announcement";
  }

  const showDecisions =
    phase === "decision_revealed" ||
    phase === "scoring" ||
    phase === "announcement";
  const showDeltas = phase === "scoring" || phase === "announcement";

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

  const leaderboard = buildLeaderboard(tournament, roundIndex, phase);

  return {
    round: round.roundNumber,
    phase,
    chatStep,
    arenas,
    leaderboard,
  };
}

/**
 * Leaderboard is frozen during chat/decision phases. It shows:
 * - During chat/decision_sealed/decision_revealed: cumulative scores through the PREVIOUS round
 * - During scoring/announcement: cumulative scores through the CURRENT round
 */
function buildLeaderboard(
  tournament: OrganizedTournament,
  roundIndex: number,
  phase: Phase,
): LeaderboardEntry[] {
  const useCurrentRound = phase === "scoring" || phase === "announcement";
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
