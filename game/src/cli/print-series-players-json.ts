/**
 * Build a `players.series-tournament2`-style JSON from Supabase:
 * top 3 agents by final cumulative score from a completed tournament (carryover)
 * plus 3 new players from `public.users` (FIFO: both `tournament_date` and `reserved_date` NULL),
 * or from exactly 3 CLI names if you pass them.
 *
 * Loads `game/.env` (SUPABASE_URL + SUPABASE_SECRET_KEY).
 *
 * Usage:
 *   pnpm run series-players
 *     (from `game/` — new slots = 3 rows from `users` table)
 *   pnpm run series-players -- grace.eth henry.eth ivy.eth
 *   pnpm run series-players -- --tournament 12
 *   pnpm run series-players -- --base-port 3100
 *
 * Prints JSON to stdout; redirect to a file to save.
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: join(gameRoot, ".env") });

/** Row shape for standalone `public.users` (not linked to `agents`). */
type UsersRow = {
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

type CliPlayer = {
  name: string;
  url: string;
  strategyPrompt: string;
  rosterRole: "carryover" | "new";
};

function userArgs(): string[] {
  let out = process.argv.slice(2);
  if (out[0] === "--") {
    out = out.slice(1);
  }
  return out;
}

function parseArgs(argv: string[]): {
  tournamentId: number | undefined;
  basePort: number;
  /** Length 0 → load from `users` table; length 3 → use these names (optional `agents` enrichment). */
  newNamesFromCli: string[];
} {
  const rest = [...argv];
  let tournamentId: number | undefined;
  const t = rest.indexOf("--tournament");
  if (t >= 0) {
    const raw = rest[t + 1];
    if (raw === undefined || raw === "") {
      throw new Error("--tournament requires a numeric id");
    }
    tournamentId = Number.parseInt(raw, 10);
    if (Number.isNaN(tournamentId)) {
      throw new Error(`Invalid --tournament value: ${raw}`);
    }
    rest.splice(t, 2);
  }

  let basePort = 3100;
  const p = rest.indexOf("--base-port");
  if (p >= 0) {
    const raw = rest[p + 1];
    if (raw === undefined || raw === "") {
      throw new Error("--base-port requires a port number");
    }
    basePort = Number.parseInt(raw, 10);
    if (Number.isNaN(basePort)) {
      throw new Error(`Invalid --base-port value: ${raw}`);
    }
    rest.splice(p, 2);
  }

  const newNamesFromCli = rest.filter((a) => a.length > 0 && !a.startsWith("-"));
  if (newNamesFromCli.length !== 0 && newNamesFromCli.length !== 3) {
    throw new Error(
      "Provide zero names (load 3 from public.users) or exactly 3 new player names, e.g.:\n  pnpm run series-players -- alice.eth bob.eth carol.eth",
    );
  }
  return { tournamentId, basePort, newNamesFromCli };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY in game/.env (service role for reads).",
    );
  }

  const { tournamentId: explicitTid, basePort, newNamesFromCli } =
    parseArgs(userArgs());
  const client = createClient(url, key);

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
        "No completed tournament found; pass --tournament <id> explicitly.",
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

  let news: CliPlayer[];
  let usersPicked: UsersRow[] | undefined;

  if (newNamesFromCli.length === 3) {
    usersPicked = undefined;
    news = newNamesFromCli.map((name, i) => ({
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
    console.error(
      `[series-players] New players from public.users (ids ${usersPicked.map((u) => u.id).join(", ")}): ${usersPicked.map((u) => u.agent_name).join(", ")}`,
    );
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

  const carryovers: CliPlayer[] = [];
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

  const out = {
    notes: `Series next tournament: carryover = top 3 by final score from tournament id ${tournamentId} (${scoreLine}). New entrants use ports ${basePort}–${basePort + 2} for HTTP unless overridden from agents.${usersNote} Edit notes as needed.`,
    players: [...carryovers, ...news],
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
