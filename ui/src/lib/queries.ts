import { supabase } from "./supabase";
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
} from "@/types/models";

export async function fetchTournamentList(): Promise<TournamentSummary[]> {
  const [tournamentsRes, agentsRes, scoresRes] = await Promise.all([
    supabase.from("tournaments").select("*").order("id", { ascending: true }),
    supabase.from("tournament_agents").select("tournament_id, agent_id"),
    supabase
      .from("scores")
      .select("tournament_id, agent_name, round_number, cumulative")
      .order("cumulative", { ascending: false }),
  ]);

  if (tournamentsRes.error) throw tournamentsRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (scoresRes.error) throw scoresRes.error;

  const tournaments = tournamentsRes.data as TournamentRow[];
  const tournamentAgentRows = agentsRes.data as { tournament_id: number; agent_id: number }[];
  const allScores = scoresRes.data as ScoreRow[];

  // Fetch all agent names in one query
  const agentIds = [...new Set(tournamentAgentRows.map((ta) => ta.agent_id))];
  const { data: agentsData, error: agentsErr } = await supabase
    .from("agents")
    .select("id, name")
    .in("id", agentIds);

  if (agentsErr) throw agentsErr;
  const agentMap = new Map((agentsData as { id: number; name: string }[]).map((a) => [a.id, a.name]));

  return tournaments.map((t) => {
    const agents = tournamentAgentRows
      .filter((ta) => ta.tournament_id === t.id)
      .map((ta) => ({ id: ta.agent_id, name: agentMap.get(ta.agent_id) ?? `Agent ${ta.agent_id}` }));

    const tournamentScores = allScores.filter((s) => s.tournament_id === t.id);
    const maxRound = Math.max(0, ...tournamentScores.map((s) => s.round_number));
    const finalScores = tournamentScores.filter((s) => s.round_number === maxRound);
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

export async function fetchTournamentData(
  tournamentId: number,
): Promise<TournamentData> {
  const [tournamentRes, taRes, matchesRes, scoresRes, announcementsRes] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
      supabase
        .from("tournament_agents")
        .select("*")
        .eq("tournament_id", tournamentId),
      supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round_number")
        .order("arena_id"),
      supabase
        .from("scores")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round_number")
        .order("agent_name"),
      supabase
        .from("announcements")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round_number"),
    ]);

  if (tournamentRes.error) throw tournamentRes.error;
  if (taRes.error) throw taRes.error;
  if (matchesRes.error) throw matchesRes.error;
  if (scoresRes.error) throw scoresRes.error;
  if (announcementsRes.error) throw announcementsRes.error;

  const tournament = tournamentRes.data as TournamentRow;
  const tournamentAgents = taRes.data as TournamentAgentRow[];
  const matches = matchesRes.data as MatchRow[];
  const scores = scoresRes.data as ScoreRow[];
  const announcements = announcementsRes.data as AnnouncementRow[];

  // Fetch agents for this tournament
  const agentIds = tournamentAgents.map((ta) => ta.agent_id);
  const { data: agentsData, error: agentsErr } = await supabase
    .from("agents")
    .select("*")
    .in("id", agentIds);

  if (agentsErr) throw agentsErr;
  const agents = agentsData as AgentRow[];

  // Fetch chat messages for all matches in this tournament
  const matchIds = matches.map((m) => m.id);
  const { data: chatData, error: chatErr } = await supabase
    .from("chat_messages")
    .select("*")
    .in("match_id", matchIds)
    .order("match_id")
    .order("turn_number");

  if (chatErr) throw chatErr;
  const chatMessages = chatData as ChatMessageRow[];

  return {
    tournament,
    agents,
    tournamentAgents,
    matches,
    chatMessages,
    scores,
    announcements,
  };
}
