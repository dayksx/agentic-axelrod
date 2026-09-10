import "server-only";
import { adminDb } from "./firebase-admin";
import type {
  TournamentSummary,
  TournamentData,
  TournamentRow,
  AgentRow,
  TournamentAgentRow,
  MatchRow,
  ChatMessageRow,
  ScoreRow,
  AnnouncementRow,
  TournamentTransactionRow,
  UserRow,
} from "@/types/models";

// Firestore has no SQL joins, so — as the original Supabase code already did —
// we fetch flat collections and stitch/sort in JS. Only single-field equality
// filters are used (automatic indexes), so no composite indexes are required.

async function all<T>(name: string): Promise<T[]> {
  const snap = await adminDb.collection(name).get();
  return snap.docs.map((d) => d.data() as T);
}

async function whereEq<T>(name: string, field: string, value: unknown): Promise<T[]> {
  const snap = await adminDb.collection(name).where(field, "==", value).get();
  return snap.docs.map((d) => d.data() as T);
}

export async function fetchTournamentList(): Promise<TournamentSummary[]> {
  const [tournaments, tournamentAgentRows, allScores, agentsData] = await Promise.all([
    all<TournamentRow>("tournaments"),
    all<{ tournament_id: number; agent_id: number }>("tournament_agents"),
    all<ScoreRow>("scores"),
    all<{ id: number; name: string }>("agents"),
  ]);

  tournaments.sort((a, b) => a.id - b.id);
  const agentMap = new Map(agentsData.map((a) => [a.id, a.name]));

  return tournaments.map((t) => {
    const agents = tournamentAgentRows
      .filter((ta) => ta.tournament_id === t.id)
      .map((ta) => ({ id: ta.agent_id, name: agentMap.get(ta.agent_id) ?? `Agent ${ta.agent_id}` }));

    const tournamentScores = allScores.filter((s) => s.tournament_id === t.id);
    const maxRound = Math.max(0, ...tournamentScores.map((s) => s.round_number));
    const finalScores = tournamentScores
      .filter((s) => s.round_number === maxRound)
      .sort((a, b) => b.cumulative - a.cumulative);
    const topScore = finalScores.length > 0 ? finalScores[0] : null;

    return {
      id: t.id,
      status: t.status,
      totalRounds: t.total_rounds,
      totalAgents: t.total_agents,
      createdAt: t.created_at,
      completedAt: t.completed_at,
      winner:
        t.status === "completed" && topScore
          ? { name: topScore.agent_name, score: topScore.cumulative }
          : null,
      agents,
    };
  });
}

export async function fetchPlayerQueue(): Promise<UserRow[]> {
  const users = await all<UserRow>("users");
  return users
    .filter((u) => u.tournament_date == null)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
}

export async function fetchTournamentData(tournamentId: number): Promise<TournamentData> {
  const [
    tournamentSnap,
    tournamentAgents,
    matches,
    scores,
    announcements,
    transactions,
    allAgents,
    chatMessages,
  ] = await Promise.all([
    adminDb.collection("tournaments").doc(String(tournamentId)).get(),
    whereEq<TournamentAgentRow>("tournament_agents", "tournament_id", tournamentId),
    whereEq<MatchRow>("matches", "tournament_id", tournamentId),
    whereEq<ScoreRow>("scores", "tournament_id", tournamentId),
    whereEq<AnnouncementRow>("announcements", "tournament_id", tournamentId),
    whereEq<TournamentTransactionRow>("tournament_transactions", "tournament_id", tournamentId),
    all<AgentRow>("agents"),
    // chat_messages carry a denormalized tournament_id (added at load time).
    whereEq<ChatMessageRow>("chat_messages", "tournament_id", tournamentId),
  ]);

  if (!tournamentSnap.exists) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }
  const tournament = tournamentSnap.data() as TournamentRow;

  matches.sort((a, b) => a.round_number - b.round_number || a.arena_id - b.arena_id);
  scores.sort((a, b) => a.round_number - b.round_number || (a.agent_name < b.agent_name ? -1 : 1));
  announcements.sort((a, b) => a.round_number - b.round_number);
  transactions.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  chatMessages.sort((a, b) => a.match_id - b.match_id || a.turn_number - b.turn_number);

  const agentIds = new Set(tournamentAgents.map((ta) => ta.agent_id));
  const agents = allAgents.filter((a) => agentIds.has(a.id));

  return {
    tournament,
    agents,
    tournamentAgents,
    matches,
    chatMessages,
    scores,
    announcements,
    transactions,
  };
}
