/**
 * HTTP API for the Game Master: start tournaments with POST, poll job status with GET.
 *
 * - `POST /tournaments/runs` — full config JSON (`players` length 6, optional round options).
 * - `GET /tournaments/next-players` — Supabase-backed series draft (carryovers + new slots), same logic as `pnpm run series-players`.
 * - `POST /tournaments/series-runs` — builds that draft server-side, then starts a run (optional body: `tournamentId`, `basePort`, `newPlayerNames`, round options).
 *
 * Env: `GM_HTTP_PORT` (default 3200), `GM_HTTP_HOST` (default 0.0.0.0).
 * Loads `game/.env` for Supabase + agent slot URLs.
 */
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import express, { type Request, type Response } from "express";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { isSupabaseConfigured } from "../../adapter/db/supabase-writes.js";
import {
  buildSeriesTournamentDraft,
  seriesDraftPlayersToConfigPlayers,
} from "../../application/build-series-tournament-draft.js";
import { parseTournamentConfig } from "../../application/parse-tournament-config.js";
import { GameMaster } from "../../domain/model/game-master.js";
import type { TournamentConfig, TournamentResults } from "../../domain/model/types.js";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnv({ path: join(gameRoot, ".env") });

type JobStatus = "pending" | "running" | "completed" | "failed";

type JobRecord = {
  readonly id: string;
  status: JobStatus;
  readonly createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  results?: TournamentResults;
  error?: string;
};

const jobs = new Map<string, JobRecord>();

type SeriesRunBody = {
  tournamentId?: number;
  basePort?: number;
  newPlayerNames?: string[];
  totalRounds?: number;
  arenasPerRound?: number;
  announceMaxChars?: number;
};

function parseSeriesRunBody(raw: unknown): SeriesRunBody {
  if (raw === null || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: SeriesRunBody = {};
  if (typeof o.tournamentId === "number" && Number.isInteger(o.tournamentId)) {
    out.tournamentId = o.tournamentId;
  }
  if (typeof o.basePort === "number" && Number.isInteger(o.basePort)) {
    out.basePort = o.basePort;
  }
  if (Array.isArray(o.newPlayerNames)) {
    out.newPlayerNames = o.newPlayerNames.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  }
  if (typeof o.totalRounds === "number") out.totalRounds = o.totalRounds;
  if (typeof o.arenasPerRound === "number") {
    out.arenasPerRound = o.arenasPerRound;
  }
  if (typeof o.announceMaxChars === "number") {
    out.announceMaxChars = o.announceMaxChars;
  }
  return out;
}

function firstQuery(
  q: Request["query"][string] | undefined,
): string | undefined {
  if (q === undefined) return undefined;
  if (Array.isArray(q)) {
    const x = q[0];
    return typeof x === "string" ? x : undefined;
  }
  return typeof q === "string" ? q : undefined;
}

function parseNewPlayerNamesFromQuery(
  q: Request["query"][string],
): string[] | undefined {
  const first = firstQuery(q);
  if (first === undefined || first === "") return undefined;
  const parts = first
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length === 0 ? undefined : parts;
}

function supabaseEnvOr503(res: Response): { url: string; key: string } | null {
  if (!isSupabaseConfigured()) {
    res
      .status(503)
      .json({
        error:
          "Supabase not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY",
      });
    return null;
  }
  return {
    url: process.env.SUPABASE_URL!.trim(),
    key: process.env.SUPABASE_SECRET_KEY!.trim(),
  };
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 65535) {
    return fallback;
  }
  return n;
}

async function runTournamentJob(job: JobRecord, config: TournamentConfig): Promise<void> {
  job.status = "running";
  job.startedAt = new Date().toISOString();
  try {
    const gm = new GameMaster();
    const results = await gm.runTournament(config);
    job.status = "completed";
    job.results = results;
    console.log(`[GM API] job ${job.id} completed`, results);
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
    console.error(`[GM API] job ${job.id} failed`, job.error);
  } finally {
    job.finishedAt = new Date().toISOString();
  }
}

export function createGmHttpApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "game-master" });
  });

  /**
   * JSON draft for the next series tournament (top 3 carryover + 3 new), from Supabase.
   * Query: optional `tournamentId`, `basePort` (default 3100), optional `newPlayerNames` (comma-separated, 0 or 3 names).
   */
  app.get("/tournaments/next-players", async (req: Request, res: Response) => {
    const creds = supabaseEnvOr503(res);
    if (creds === null) return;

    let tournamentId: number | undefined;
    const tidRaw = firstQuery(req.query.tournamentId ?? req.query.tournament);
    if (tidRaw !== undefined && tidRaw !== "") {
      const n = Number.parseInt(tidRaw, 10);
      if (Number.isNaN(n) || !Number.isInteger(n) || n < 1) {
        res.status(400).json({ error: "Invalid tournamentId" });
        return;
      }
      tournamentId = n;
    }

    let basePort = 3100;
    const bpRaw = firstQuery(req.query.basePort ?? req.query.base_port);
    if (bpRaw !== undefined && bpRaw !== "") {
      const n = Number.parseInt(bpRaw, 10);
      if (
        Number.isNaN(n) ||
        !Number.isInteger(n) ||
        n < 1 ||
        n > 65535
      ) {
        res.status(400).json({ error: "Invalid basePort" });
        return;
      }
      basePort = n;
    }

    const nameParts = parseNewPlayerNamesFromQuery(req.query.newPlayerNames);
    if (
      nameParts !== undefined &&
      nameParts.length !== 0 &&
      nameParts.length !== 3
    ) {
      res.status(400).json({
        error:
          "newPlayerNames must be omitted or list exactly 3 comma-separated names",
      });
      return;
    }
    const newPlayerNames =
      nameParts !== undefined && nameParts.length === 3
        ? nameParts
        : undefined;

    try {
      const draft = await buildSeriesTournamentDraft({
        supabaseUrl: creds.url,
        supabaseServiceRoleKey: creds.key,
        ...(tournamentId !== undefined ? { tournamentId } : {}),
        basePort,
        ...(newPlayerNames !== undefined ? { newPlayerNames } : {}),
      });
      res.json({
        notes: draft.notes,
        players: draft.players,
        sourceTournamentId: draft.sourceTournamentId,
        ...(draft.usersRowIds !== undefined
          ? { usersRowIds: draft.usersRowIds }
          : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(400).json({ error: msg });
    }
  });

  /**
   * Build the series roster via Supabase, then start a tournament (same async job as POST /tournaments/runs).
   * Body (JSON, all optional except constraints): `tournamentId`, `basePort`, `newPlayerNames` (0 or 3 strings),
   * `totalRounds`, `arenasPerRound`, `announceMaxChars`.
   */
  app.post("/tournaments/series-runs", async (req: Request, res: Response) => {
    const creds = supabaseEnvOr503(res);
    if (creds === null) return;

    const body = parseSeriesRunBody(req.body);
    const np = body.newPlayerNames;
    if (np !== undefined && np.length !== 0 && np.length !== 3) {
      res.status(400).json({
        error: "newPlayerNames must be omitted or contain exactly 3 names",
      });
      return;
    }

    let draft;
    try {
      draft = await buildSeriesTournamentDraft({
        supabaseUrl: creds.url,
        supabaseServiceRoleKey: creds.key,
        ...(body.tournamentId !== undefined ? { tournamentId: body.tournamentId } : {}),
        ...(body.basePort !== undefined ? { basePort: body.basePort } : {}),
        ...(np !== undefined && np.length === 3 ? { newPlayerNames: np } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(400).json({ error: msg });
      return;
    }

    const players = seriesDraftPlayersToConfigPlayers(draft);
    let config: TournamentConfig;
    try {
      config = parseTournamentConfig({
        players,
        ...(body.totalRounds !== undefined ? { totalRounds: body.totalRounds } : {}),
        ...(body.arenasPerRound !== undefined
          ? { arenasPerRound: body.arenasPerRound }
          : {}),
        ...(body.announceMaxChars !== undefined
          ? { announceMaxChars: body.announceMaxChars }
          : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid tournament config";
      res.status(400).json({ error: msg });
      return;
    }

    const id = randomUUID();
    const job: JobRecord = {
      id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    jobs.set(id, job);

    void runTournamentJob(job, config);

    res.status(202).json({
      jobId: id,
      status: job.status,
      pollUrl: `/tournaments/runs/${id}`,
      sourceTournamentId: draft.sourceTournamentId,
      ...(draft.usersRowIds !== undefined
        ? { usersRowIds: draft.usersRowIds }
        : {}),
    });
  });

  /**
   * Start a tournament in the background.
   * Body: full JSON object — required `players` (length 6), optional `totalRounds`, `arenasPerRound`, `announceMaxChars`.
   */
  app.post("/tournaments/runs", (req: Request, res: Response) => {
    let config: TournamentConfig;
    try {
      config = parseTournamentConfig(req.body);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid tournament config";
      res.status(400).json({ error: msg });
      return;
    }

    const id = randomUUID();
    const job: JobRecord = {
      id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    jobs.set(id, job);

    void runTournamentJob(job, config);

    res.status(202).json({
      jobId: id,
      status: job.status,
      pollUrl: `/tournaments/runs/${id}`,
    });
  });

  app.get("/tournaments/runs/:jobId", (req: Request, res: Response) => {
    const rawId = req.params.jobId;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;
    const job = jobs.get(jobId ?? "");
    if (job === undefined) {
      res.status(404).json({ error: "Unknown jobId" });
      return;
    }
    res.json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      ...(job.results !== undefined ? { results: job.results } : {}),
      ...(job.error !== undefined ? { error: job.error } : {}),
    });
  });

  return app;
}

export async function startGmHttpServer(): Promise<{
  close: () => Promise<void>;
  port: number;
}> {
  const app = createGmHttpApp();
  const port = parsePort(process.env.GM_HTTP_PORT ?? process.env.PORT, 3200);
  const host = process.env.GM_HTTP_HOST ?? "0.0.0.0";

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(
        `[GM API] listening http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`,
      );
      console.log(
        `[GM API] POST /tournaments/runs  GET /tournaments/next-players  POST /tournaments/series-runs  GET /tournaments/runs/:jobId  GET /health`,
      );
      resolve({
        port,
        close: () =>
          new Promise((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
    server.on("error", reject);
  });
}

function isRunAsMain(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
}

if (isRunAsMain()) {
  await startGmHttpServer();
}
