/**
 * Build the next series tournament roster: top 3 from a completed tournament + 3 new slots
 * (from `public.users` FIFO or explicit names). Same logic as `pnpm run series-players`.
 */
import { createClient } from "@supabase/supabase-js";

import type { PlayerConfig } from "../domain/model/types.js";

/** Row shape for standalone `public.users`. */
export type UsersRow = {
  id: number;
  agent_name: string;
  strategy_prompt: string;
  human_wallet: string;
  agent_wallet: string;
  tx_hash: string;
  reserved_date: string | null;
  tournament_date: string | null;
  created_at: string;
};

export type SeriesDraftPlayer = {
  name: string;
  url: string;
  strategyPrompt: string;
  rosterRole: "carryover" | "new";
};

export type SeriesTournamentDraft = {
  notes: string;
  players: SeriesDraftPlayer[];
  /** Completed tournament scores were read from. */
  sourceTournamentId: number;
  /** When new players came from `users`, their row ids (FIFO). */
  usersRowIds?: number[];
};

export type BuildSeriesTournamentDraftParams = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Omit → latest completed tournament by id. */
  tournamentId?: number;
  /** HTTP URLs for new entrants when not in `agents`; default 3100. */
  basePort?: number;
  /** Omit or empty → next 3 from `users` (both date columns NULL). Exactly 3 → those names. */
  newPlayerNames?: string[];
};

function assertSupabase(
  url: string | undefined,
  key: string | undefined,
): asserts url is string {
  if (!url?.trim() || !key?.trim()) {
    throw new Error(
      "Supabase URL and service role key are required to build a series draft.",
    );
  }
}

/**
 * Loads carryovers + new players from Supabase. Always returns 6 players when successful.
 */
export async function buildSeriesTournamentDraft(
  params: BuildSeriesTournamentDraftParams,
): Promise<SeriesTournamentDraft> {
  const {
    supabaseUrl,
    supabaseServiceRoleKey,
    tournamentId: explicitTid,
    basePort: basePortRaw,
    newPlayerNames: namesRaw,
  } = params;

  assertSupabase(supabaseUrl, supabaseServiceRoleKey);
  const basePort = basePortRaw ?? 3100;

  const newPlayerNames = namesRaw?.filter((n) => n.length > 0) ?? [];
  if (newPlayerNames.length !== 0 && newPlayerNames.length !== 3) {
    throw new Error(
      "newPlayerNames must be omitted (use users table) or contain exactly 3 names",
    );
  }

  const client = createClient(supabaseUrl.trim(), supabaseServiceRoleKey.trim());

  let tournamentId = explicitTid;
  if (tournamentId === undefined) {
    const { data, error } = await client
      .from("tournaments")
      .select("id")
      .eq("status", "completed")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    const row = data as { id: number } | null;
    if (row === null) {
      throw new Error(
        "No completed tournament found; pass tournamentId explicitly.",
      );
    }
    tournamentId = row.id;
  }

  const { data: scoreRows, error: scoreErr } = await client
    .from("scores")
    .select("agent_name, round_number, cumulative")
    .eq("tournament_id", tournamentId);

  if (scoreErr) throw scoreErr;
  if (scoreRows === null || scoreRows.length === 0) {
    throw new Error(`No scores for tournament_id=${tournamentId}`);
  }

  const maxRound = Math.max(...scoreRows.map((r) => r.round_number));
  const finalRows = scoreRows.filter((r) => r.round_number === maxRound);
  const byName = new Map<string, { cumulative: number }>();
  for (const r of finalRows) {
    const prev = byName.get(r.agent_name);
    if (prev === undefined || r.cumulative >= prev.cumulative) {
      byName.set(r.agent_name, { cumulative: r.cumulative });
    }
  }

  const ranked = [...byName.entries()].sort((a, b) => b[1].cumulative - a[1].cumulative);
  const top3 = ranked.slice(0, 3);
  if (top3.length < 3) {
    throw new Error(
      `Need at least 3 agents in final scores; found ${top3.length} for tournament ${tournamentId}`,
    );
  }

  const winnerNames = top3.map(([n]) => n);

  let news: SeriesDraftPlayer[];
  let usersPicked: UsersRow[] | undefined;

  if (newPlayerNames.length === 3) {
    usersPicked = undefined;
    news = newPlayerNames.map((name, i) => ({
      name,
      url: `http://127.0.0.1:${basePort + i}`,
      strategyPrompt:
        "Set strategy in agents table or edit this file after generation.",
      rosterRole: "new",
    }));
  } else {
    const { data: userRows, error: usersErr } = await client
      .from("users")
      .select(
        "id, agent_name, strategy_prompt, human_wallet, agent_wallet, tx_hash, reserved_date, tournament_date, created_at",
      )
      .is("tournament_date", null)
      .is("reserved_date", null)
      .order("created_at", { ascending: true })
      .limit(3);

    if (usersErr) throw usersErr;
    const picked = (userRows ?? []) as UsersRow[];
    if (picked.length < 3) {
      throw new Error(
        `Need 3 available row(s) in public.users (tournament_date and reserved_date both NULL); found ${picked.length}.`,
      );
    }
    usersPicked = picked;
    news = usersPicked.map((u, i) => ({
      name: u.agent_name,
      url: `http://127.0.0.1:${basePort + i}`,
      strategyPrompt: u.strategy_prompt,
      rosterRole: "new" as const,
    }));
  }

  const agentNameSet = new Set([...winnerNames, ...news.map((p) => p.name)]);
  const { data: agents, error: agentsErr } = await client
    .from("agents")
    .select("id, name, strategy_prompt, url")
    .in("name", [...agentNameSet]);

  if (agentsErr) throw agentsErr;

  const agentByName = new Map(
    (agents ?? []).map((a) => [a.name, a] as const),
  );

  for (const pl of news) {
    const a = agentByName.get(pl.name);
    if (a === undefined) continue;
    if (a.url.length > 0) {
      pl.url = a.url;
    }
    if (a.strategy_prompt.length > 0) {
      pl.strategyPrompt = a.strategy_prompt;
    }
  }

  const winnerIds = winnerNames
    .map((n) => agentByName.get(n)?.id)
    .filter((id): id is number => id !== undefined);

  const { data: taRows, error: taErr } = await client
    .from("tournament_agents")
    .select("agent_id, url")
    .eq("tournament_id", tournamentId)
    .in("agent_id", winnerIds);

  if (taErr) throw taErr;

  const urlByAgentId = new Map(
    (taRows ?? []).map((r) => [r.agent_id, r.url] as const),
  );

  const carryovers: SeriesDraftPlayer[] = [];
  for (const name of winnerNames) {
    const a = agentByName.get(name);
    if (a === undefined) {
      throw new Error(
        `Agent row missing for winner "${name}" (tournament ${tournamentId})`,
      );
    }
    const taUrl = urlByAgentId.get(a.id);
    carryovers.push({
      name: a.name,
      url: taUrl !== undefined && taUrl.length > 0 ? taUrl : a.url,
      strategyPrompt: a.strategy_prompt,
      rosterRole: "carryover",
    });
  }

  const scoreLine = top3
    .map(([n, { cumulative }]) => `${n} ${cumulative}`)
    .join(", ");

  const usersNote =
    usersPicked !== undefined
      ? ` New slots from users.id=[${usersPicked.map((u) => u.id).join(", ")}] (FIFO, both dates NULL).`
      : "";

  const notes = `Series next tournament: carryover = top 3 by final score from tournament id ${tournamentId} (${scoreLine}). New entrants use ports ${basePort}–${basePort + 2} for HTTP unless overridden from agents.${usersNote} Edit notes as needed.`;

  return {
    notes,
    players: [...carryovers, ...news],
    sourceTournamentId: tournamentId,
    ...(usersPicked !== undefined
      ? { usersRowIds: usersPicked.map((u) => u.id) }
      : {}),
  };
}

/** Map draft players to {@link PlayerConfig}[] for {@link parseTournamentConfig}. */
export function seriesDraftPlayersToConfigPlayers(
  draft: SeriesTournamentDraft,
): PlayerConfig[] {
  return draft.players.map((p) => {
    const pc: PlayerConfig = {
      name: p.name,
      strategyPrompt: p.strategyPrompt,
    };
    if (p.url.length > 0) {
      pc.url = p.url;
    }
    if (p.rosterRole === "new" || p.rosterRole === "carryover") {
      pc.rosterRole = p.rosterRole;
    }
    return pc;
  });
}
