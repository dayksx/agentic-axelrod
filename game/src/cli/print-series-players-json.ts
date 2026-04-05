/**
 * CLI wrapper for {@link buildSeriesTournamentDraft} — prints JSON like
 * `players.series-tournament2.example.json` to stdout.
 *
 * Loads `game/.env` (SUPABASE_URL + SUPABASE_SECRET_KEY).
 *
 * Usage:
 *   pnpm run series-players
 *   pnpm run series-players -- grace.eth henry.eth ivy.eth
 *   pnpm run series-players -- --tournament 12 --base-port 3100
 */
import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSeriesTournamentDraft } from "../application/build-series-tournament-draft.js";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: join(gameRoot, ".env") });

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
  newPlayerNames: string[] | undefined;
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

  const names = rest.filter((a) => a.length > 0 && !a.startsWith("-"));
  if (names.length !== 0 && names.length !== 3) {
    throw new Error(
      "Provide zero names (users table) or exactly 3 names, e.g.:\n  pnpm run series-players -- alice.eth bob.eth carol.eth",
    );
  }
  return {
    tournamentId,
    basePort,
    newPlayerNames: names.length === 3 ? names : undefined,
  };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY in game/.env (service role for reads).",
    );
  }

  const { tournamentId, basePort, newPlayerNames } = parseArgs(userArgs());

  const draft = await buildSeriesTournamentDraft({
    supabaseUrl: url,
    supabaseServiceRoleKey: key,
    ...(tournamentId !== undefined ? { tournamentId } : {}),
    basePort,
    ...(newPlayerNames !== undefined ? { newPlayerNames } : {}),
  });

  if (draft.usersRowIds !== undefined) {
    console.error(
      `[series-players] New players from public.users (ids ${draft.usersRowIds.join(", ")}): ${draft.players
        .filter((p) => p.rosterRole === "new")
        .map((p) => p.name)
        .join(", ")}`,
    );
  }

  const out = {
    notes: draft.notes,
    players: draft.players,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
