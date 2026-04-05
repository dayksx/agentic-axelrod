/**
 * Update `public.users` waitlist rows using `game/.env` (SUPABASE_URL + SUPABASE_SECRET_KEY).
 *
 * Default: set strategy_prompt + reserved_date + tournament_date (now) for each row.
 * `--reset`: clear reserved_date and tournament_date only (re-enter FIFO pool).
 *
 * Usage:
 *   pnpm --filter game run update-users-waitlist
 *   pnpm --filter game run update-users-waitlist -- --reset
 *   pnpm --filter game run update-users-waitlist -- ./my-users.json
 *
 * JSON file: array of `{ "agent_name"|"name", "strategy_prompt"|"strategyPrompt" }`.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: join(gameRoot, ".env") });

type WaitlistUpdateRow = {
  agent_name: string;
  strategy_prompt: string;
};

const DEFAULT_ROWS: WaitlistUpdateRow[] = [
  {
    agent_name: "CyborgDayan",
    strategy_prompt: "Climbing is the way",
  },
  {
    agent_name: "test",
    strategy_prompt: "test",
  },
  {
    agent_name: "Random",
    strategy_prompt: "Just do random decisions each time",
  },
];

function parseArgs(): { reset: boolean; jsonPath: string | undefined } {
  const raw = process.argv.slice(2).filter((a) => a !== "--");
  const reset = raw.includes("--reset");
  const positional = raw.filter((a) => !a.startsWith("-"));
  const jsonPath = positional[0];
  return { reset, jsonPath };
}

function normalizeJsonRow(
  o: Record<string, unknown>,
  index: number,
): WaitlistUpdateRow {
  const nameRaw = o.agent_name ?? o.name;
  const spRaw = o.strategy_prompt ?? o.strategyPrompt;
  if (typeof nameRaw !== "string" || nameRaw.trim().length === 0) {
    throw new Error(`Row ${index}: missing agent_name or name`);
  }
  if (typeof spRaw !== "string") {
    throw new Error(`Row ${index}: missing strategy_prompt or strategyPrompt`);
  }
  return { agent_name: nameRaw.trim(), strategy_prompt: spRaw };
}

async function loadRowsFromJson(path: string): Promise<WaitlistUpdateRow[]> {
  const text = await readFile(path, "utf8");
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in ${path}: ${msg}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`${path}: root must be a JSON array`);
  }
  return raw.map((item, i) => {
    if (item === null || typeof item !== "object") {
      throw new Error(`Row ${i}: must be an object`);
    }
    return normalizeJsonRow(item as Record<string, unknown>, i);
  });
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY in game/.env (service role).",
    );
  }

  const { reset, jsonPath } = parseArgs();
  const rows =
    jsonPath !== undefined ? await loadRowsFromJson(jsonPath) : DEFAULT_ROWS;

  if (rows.length === 0) {
    throw new Error("No rows to update.");
  }

  const client = createClient(url, key);

  if (reset) {
    for (const r of rows) {
      const { data, error } = await client
        .from("users")
        .update({
          reserved_date: null,
          tournament_date: null,
        })
        .eq("agent_name", r.agent_name)
        .select("id, agent_name");

      if (error) throw error;
      const n = data?.length ?? 0;
      if (n === 0) {
        console.warn(`[update-users-waitlist] no row for agent_name=${r.agent_name}`);
      } else {
        console.log(
          `[update-users-waitlist] reset dates for ${r.agent_name} (id=${(data![0] as { id: number }).id})`,
        );
      }
    }
    return;
  }

  const now = new Date().toISOString();
  for (const r of rows) {
    const { data, error } = await client
      .from("users")
      .update({
        strategy_prompt: r.strategy_prompt,
        reserved_date: now,
        tournament_date: now,
      })
      .eq("agent_name", r.agent_name)
      .select("id, agent_name");

    if (error) throw error;
    const n = data?.length ?? 0;
    if (n === 0) {
      console.warn(
        `[update-users-waitlist] no row for agent_name=${r.agent_name} (skipped)`,
      );
    } else {
      console.log(
        `[update-users-waitlist] updated ${r.agent_name} (id=${(data![0] as { id: number }).id})`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
