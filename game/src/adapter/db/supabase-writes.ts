/**
 * Game Master write functions — now backed by Firestore (Admin SDK).
 *
 * The module keeps its original name and exported signatures so callers are
 * unchanged, but it no longer talks to Supabase. The Game Master is the sole
 * writer; the frontend reads through server API routes and never writes.
 *
 * Ids: Postgres `serial` is replaced by per-collection counter docs (see
 * ./firestore.ts). Bulk inserts reserve a contiguous id block in one txn.
 */
import { db, nextId, reserveIds, isFirebaseConfigured } from "./firestore.js";

/** Legacy name kept for callers; persistence is configured via FIREBASE_SERVICE_ACCOUNT. */
export function isSupabaseConfigured(): boolean {
  return isFirebaseConfigured();
}

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Payoff matrix (C/D → deltas)
// ---------------------------------------------------------------------------

type Decision = "C" | "D";

function computeDeltas(a: Decision, b: Decision): { delta_a: number; delta_b: number } {
  if (a === "C" && b === "C") return { delta_a: 3, delta_b: 3 };
  if (a === "C" && b === "D") return { delta_a: 0, delta_b: 5 };
  if (a === "D" && b === "C") return { delta_a: 5, delta_b: 0 };
  return { delta_a: 1, delta_b: 1 };
}

// ---------------------------------------------------------------------------
// PRE-TOURNAMENT
// ---------------------------------------------------------------------------

/** Waitlist rows picked for a series tournament: stamp both date columns so they
 *  drop out of the FIFO queue. */
export async function markUsersConsumedForTournament(
  userIds: readonly number[],
): Promise<void> {
  if (userIds.length === 0) return;
  const now = nowIso();
  const batch = db().batch();
  for (const id of userIds) {
    batch.set(
      db().collection("users").doc(String(id)),
      { reserved_date: now, tournament_date: now },
      { merge: true },
    );
  }
  await batch.commit();
}

/** #1 — Insert agents, skip if a name already exists. Returns all agent ids+names. */
export async function createAgents(
  agents: {
    name: string;
    strategy_prompt: string;
    url: string;
    wallet_address?: string | null;
    ens_name?: string | null;
  }[],
): Promise<{ id: number; name: string }[]> {
  const result: { id: number; name: string }[] = [];
  for (const a of agents) {
    const existing = await db()
      .collection("agents")
      .where("name", "==", a.name)
      .limit(1)
      .get();
    if (!existing.empty) {
      const doc = existing.docs[0]!.data() as { id: number; name: string };
      result.push({ id: doc.id, name: doc.name });
      continue;
    }
    const id = await nextId("agents");
    await db().collection("agents").doc(String(id)).set({
      id,
      name: a.name,
      strategy_prompt: a.strategy_prompt,
      url: a.url,
      wallet_address: a.wallet_address ?? null,
      ens_name: a.ens_name ?? null,
      created_at: nowIso(),
    });
    result.push({ id, name: a.name });
  }
  return result;
}

/** #2 — Create a tournament. Returns the new tournament_id. */
export async function createTournament(config: {
  total_rounds: number;
  total_agents: number;
}): Promise<number> {
  const id = await nextId("tournaments");
  await db().collection("tournaments").doc(String(id)).set({
    id,
    status: "running",
    total_rounds: config.total_rounds,
    total_agents: config.total_agents,
    created_at: nowIso(),
    completed_at: null,
  });
  return id;
}

/** #3 — Link agents to a tournament via the join collection. */
export async function enrollAgents(
  tournament_id: number,
  agents: { agent_id: number; url: string }[],
): Promise<void> {
  if (agents.length === 0) return;
  const ids = await reserveIds("tournament_agents", agents.length);
  const batch = db().batch();
  agents.forEach((a, i) => {
    const id = ids[i]!;
    batch.set(db().collection("tournament_agents").doc(String(id)), {
      id,
      tournament_id,
      agent_id: a.agent_id,
      url: a.url,
    });
  });
  await batch.commit();
}

/**
 * #4 — Bulk-insert the pre-computed match schedule (decisions/deltas NULL).
 * Returns inserted rows with their ids so the caller can map (round, arena) → match_id.
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
  if (schedule.length === 0) return [];
  const ids = await reserveIds("matches", schedule.length);
  const batch = db().batch();
  const created = schedule.map((m, i) => {
    const id = ids[i]!;
    batch.set(db().collection("matches").doc(String(id)), {
      id,
      tournament_id,
      round_number: m.round_number,
      arena_id: m.arena_id,
      agent_a: m.agent_a,
      agent_b: m.agent_b,
      first_speaker: m.first_speaker,
      decision_a: null,
      decision_b: null,
      delta_a: null,
      delta_b: null,
      created_at: nowIso(),
    });
    return {
      id,
      round_number: m.round_number,
      arena_id: m.arena_id,
      agent_a: m.agent_a,
      agent_b: m.agent_b,
    };
  });
  await batch.commit();
  return created;
}

/** #5 / #11 / #12 — Record an on-chain transaction (entry_fee | collection | prize). */
export async function recordTransaction(
  tournament_id: number,
  agent_id: number,
  type: "entry_fee" | "collection" | "prize",
  tx_hash: string,
): Promise<void> {
  const id = await nextId("tournament_transactions");
  await db().collection("tournament_transactions").doc(String(id)).set({
    id,
    tournament_id,
    agent_id,
    type,
    tx_hash,
    created_at: nowIso(),
  });
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
  const id = await nextId("announcements");
  await db().collection("announcements").doc(String(id)).set({
    id,
    tournament_id,
    round_number,
    agent_id,
    message,
  });
}

/** #7 — Store a single chat message within a match. tournament_id is denormalized
 *  onto the row so the read layer can fetch a tournament's chat in one query. */
export async function storeChatMessage(
  match_id: number,
  turn_number: number,
  speaker: string,
  content: string,
): Promise<void> {
  const matchSnap = await db().collection("matches").doc(String(match_id)).get();
  const tournament_id = matchSnap.exists
    ? ((matchSnap.get("tournament_id") as number) ?? null)
    : null;
  const id = await nextId("chat_messages");
  await db().collection("chat_messages").doc(String(id)).set({
    id,
    match_id,
    turn_number,
    speaker,
    content,
    tournament_id,
  });
}

/** #8 — Record both decisions for a match; deltas computed from payoff matrix. */
export async function recordDecisions(
  match_id: number,
  decision_a: Decision,
  decision_b: Decision,
): Promise<void> {
  const { delta_a, delta_b } = computeDeltas(decision_a, decision_b);
  await db()
    .collection("matches")
    .doc(String(match_id))
    .set({ decision_a, decision_b, delta_a, delta_b }, { merge: true });
}

/** #9 — Upsert scores for every agent in a round (unique on tournament+agent+round). */
export async function updateScores(
  tournament_id: number,
  round_number: number,
  scores: { agent_name: string; delta: number; cumulative: number }[],
): Promise<void> {
  for (const s of scores) {
    const existing = await db()
      .collection("scores")
      .where("tournament_id", "==", tournament_id)
      .where("round_number", "==", round_number)
      .where("agent_name", "==", s.agent_name)
      .limit(1)
      .get();
    if (!existing.empty) {
      await existing.docs[0]!.ref.set(
        { delta: s.delta, cumulative: s.cumulative },
        { merge: true },
      );
    } else {
      const id = await nextId("scores");
      await db().collection("scores").doc(String(id)).set({
        id,
        tournament_id,
        round_number,
        agent_name: s.agent_name,
        delta: s.delta,
        cumulative: s.cumulative,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// POST-TOURNAMENT
// ---------------------------------------------------------------------------

/** #10 — Mark tournament as completed. */
export async function completeTournament(tournament_id: number): Promise<void> {
  await db()
    .collection("tournaments")
    .doc(String(tournament_id))
    .set({ status: "completed", completed_at: nowIso() }, { merge: true });
}
