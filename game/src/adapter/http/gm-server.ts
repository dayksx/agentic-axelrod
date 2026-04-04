/**
 * HTTP API for the Game Master: start tournaments with POST, poll job status with GET.
 *
 * `POST /tournaments/runs` expects the **full tournament config as JSON in the body**
 * (`Content-Type: application/json`). The server does not read paths or example files;
 * clients must send the complete object (e.g. `{ "players": [ ...6 ], "totalRounds"?: … }`).
 *
 * Env: `GM_HTTP_PORT` (default 3200), `GM_HTTP_HOST` (default 0.0.0.0).
 * Loads `game/.env` for Supabase + agent slot URLs.
 */
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import express, { type Request, type Response } from "express";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
        `[GM API] POST /tournaments/runs (JSON body = full config)  GET /tournaments/runs/:jobId  GET /health`,
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
