/**
 * Supabase write functions for the Game Master.
 *
 * All 9 unique functions from the API spec. The Game Master is the sole writer;
 * frontend and agents have zero write access (enforced by RLS + service_role key).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase client (lazy-init so dotenv has time to load)
// ---------------------------------------------------------------------------

let _client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment",
    );
  }
  _client = createClient(url, key);
  return _client;
}

// ---------------------------------------------------------------------------
// Payoff matrix (C/D → deltas) — duplicated here to keep this module
// self-contained; mirrors game/src/domain/model/types.ts
// ---------------------------------------------------------------------------

type Decision = "C" | "D";

function computeDeltas(
  a: Decision,
  b: Decision,
): { delta_a: number; delta_b: number } {
  if (a === "C" && b === "C") return { delta_a: 3, delta_b: 3 };
  if (a === "C" && b === "D") return { delta_a: 0, delta_b: 5 };
  if (a === "D" && b === "C") return { delta_a: 5, delta_b: 0 };
  return { delta_a: 1, delta_b: 1 };
}

// ---------------------------------------------------------------------------
// PRE-TOURNAMENT
// ---------------------------------------------------------------------------

/** #1 — Insert agents, skip if already exists (by name). Returns all agent ids+names. */
export async function createAgents(
  agents: {
    name: string;
    strategy_prompt: string;
    url: string;
    wallet_address?: string | null;
    ens_name?: string | null;
  }[],
): Promise<{ id: number; name: string }[]> {
  const { error } = await db()
    .from("agents")
    .upsert(
      agents.map((a) => ({
        name: a.name,
        strategy_prompt: a.strategy_prompt,
        url: a.url,
        wallet_address: a.wallet_address ?? null,
        ens_name: a.ens_name ?? null,
      })),
      { onConflict: "name", ignoreDuplicates: true },
    );

  if (error) throw error;

  const names = agents.map((a) => a.name);
  const { data, error: fetchErr } = await db()
    .from("agents")
    .select("id, name")
    .in("name", names);

  if (fetchErr) throw fetchErr;
  return data as { id: number; name: string }[];
}

/** #2 — Create a tournament. Returns the new tournament_id. */
export async function createTournament(config: {
  total_rounds: number;
  total_agents: number;
}): Promise<number> {
  const { data, error } = await db()
    .from("tournaments")
    .insert({
      status: "running",
      total_rounds: config.total_rounds,
      total_agents: config.total_agents,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: number }).id;
}

/** #3 — Link agents to a tournament via the join table. */
export async function enrollAgents(
  tournament_id: number,
  agents: { agent_id: number; url: string }[],
): Promise<void> {
  const { error } = await db()
    .from("tournament_agents")
    .insert(agents.map((a) => ({ tournament_id, agent_id: a.agent_id, url: a.url })));

  if (error) throw error;
}

/**
 * #4 — Bulk-insert the pre-computed match schedule (decisions/deltas are NULL).
 * Returns inserted rows with their DB ids so the caller can map (round, arena) → match_id.
 */
export async function createAllMatches(
  tournament_id: number,
  schedule: {
    round_number: number;
    arena_id: number;
    agent_a: string;
    agent_b: string;
    first_speaker: string;
  }[],
): Promise<
  { id: number; round_number: number; arena_id: number; agent_a: string; agent_b: string }[]
> {
  const { data, error } = await db()
    .from("matches")
    .insert(
      schedule.map((m) => ({
        tournament_id,
        round_number: m.round_number,
        arena_id: m.arena_id,
        agent_a: m.agent_a,
        agent_b: m.agent_b,
        first_speaker: m.first_speaker,
      })),
    )
    .select("id, round_number, arena_id, agent_a, agent_b");

  if (error) throw error;
  return data as {
    id: number;
    round_number: number;
    arena_id: number;
    agent_a: string;
    agent_b: string;
  }[];
}

/** #5 / #11 / #12 — Record an on-chain transaction (entry_fee | collection | prize). */
export async function recordTransaction(
  tournament_id: number,
  agent_id: number,
  type: "entry_fee" | "collection" | "prize",
  tx_hash: string,
): Promise<void> {
  const { error } = await db()
    .from("tournament_transactions")
    .insert({ tournament_id, agent_id, type, tx_hash });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// PER ROUND
// ---------------------------------------------------------------------------

/** #6 — Store one agent's announcement for a round. */
export async function storeAnnouncement(
  tournament_id: number,
  round_number: number,
  agent_id: number,
  message: string,
): Promise<void> {
  const { error } = await db()
    .from("announcements")
    .insert({ tournament_id, round_number, agent_id, message });

  if (error) throw error;
}

/** #7 — Store a single chat message within a match. */
export async function storeChatMessage(
  match_id: number,
  turn_number: number,
  speaker: string,
  content: string,
): Promise<void> {
  const { error } = await db()
    .from("chat_messages")
    .insert({ match_id, turn_number, speaker, content });

  if (error) throw error;
}

/** #8 — Record both decisions for a match; deltas computed from payoff matrix. */
export async function recordDecisions(
  match_id: number,
  decision_a: Decision,
  decision_b: Decision,
): Promise<void> {
  const { delta_a, delta_b } = computeDeltas(decision_a, decision_b);

  const { error } = await db()
    .from("matches")
    .update({ decision_a, decision_b, delta_a, delta_b })
    .eq("id", match_id);

  if (error) throw error;
}

/** #9 — Upsert scores for every agent in a round. */
export async function updateScores(
  tournament_id: number,
  round_number: number,
  scores: { agent_name: string; delta: number; cumulative: number }[],
): Promise<void> {
  const { error } = await db()
    .from("scores")
    .upsert(
      scores.map((s) => ({
        tournament_id,
        round_number,
        agent_name: s.agent_name,
        delta: s.delta,
        cumulative: s.cumulative,
      })),
      { onConflict: "tournament_id,agent_name,round_number" },
    );

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// POST-TOURNAMENT
// ---------------------------------------------------------------------------

/** #10 — Mark tournament as completed. */
export async function completeTournament(
  tournament_id: number,
): Promise<void> {
  const { error } = await db()
    .from("tournaments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", tournament_id);

  if (error) throw error;
}
