import type { Tables } from "./database";

// Raw DB row types
export type AgentRow = Tables<"agents">;
export type TournamentRow = Tables<"tournaments">;
export type TournamentAgentRow = Tables<"tournament_agents">;
export type MatchRow = Tables<"matches">;
export type ChatMessageRow = Tables<"chat_messages">;
export type ScoreRow = Tables<"scores">;
export type AnnouncementRow = Tables<"announcements">;
export type TournamentTransactionRow = Tables<"tournament_transactions">;
export type UserRow = Tables<"users">;

// Home page
export type TournamentSummary = {
  id: number;
  status: "pending" | "running" | "completed";
  totalRounds: number;
  totalAgents: number;
  createdAt: string;
  completedAt: string | null;
  winner: { name: string; score: number } | null;
  agents: { id: number; name: string }[];
};

// Full tournament dataset (fetched once, drives the entire replay)
export type TournamentData = {
  tournament: TournamentRow;
  agents: AgentRow[];
  tournamentAgents: TournamentAgentRow[];
  matches: MatchRow[];
  chatMessages: ChatMessageRow[];
  scores: ScoreRow[];
  announcements: AnnouncementRow[];
  transactions: TournamentTransactionRow[];
};

// Organized for timeline consumption
export type OrganizedTournament = {
  tournament: TournamentRow;
  agents: AgentRow[];
  rounds: Round[];
  totalSteps: number;
  transactions: TournamentTransactionRow[];
};

export type AgentAnnouncement = {
  agentId: number;
  agentName: string;
  message: string;
};

export type Round = {
  roundNumber: number;
  arenas: ArenaRound[];
  announcements: AgentAnnouncement[];
  scores: ScoreSnapshot;
};

export type ArenaRound = {
  arenaId: number;
  match: MatchRow;
  messages: ChatMessageRow[];
};

export type ScoreSnapshot = {
  [agentName: string]: { delta: number; cumulative: number };
};

// Timeline-derived state (output of deriveState)
export type Phase =
  | "chat"
  | "decision_sealed"
  | "decision_revealed"
  | "scoring"
  | "announcement";

export type TimelineState = {
  round: number;
  phase: Phase;
  chatStep: number;
  arenas: DerivedArenaState[];
  announcements: AgentAnnouncement[];
  leaderboard: LeaderboardEntry[];
};

export type DerivedArenaState = {
  arenaId: number;
  agentA: string;
  agentB: string;
  visibleMessages: ChatMessageRow[];
  decisionA: "sealed" | "C" | "D";
  decisionB: "sealed" | "C" | "D";
  deltaA: number | null;
  deltaB: number | null;
};

export type LeaderboardEntry = {
  agentName: string;
  score: number;
  rank: number;
};
