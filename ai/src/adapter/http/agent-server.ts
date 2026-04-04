/**
 * One Express app per {@link Player}. Entry: `POST /message/send`.
 */

import express, { type Request, type Response } from "express";
import type { A2aMessageSendUrlOptions, RevealRoundDocument, WorkflowPhase } from "../../domain/types.js";
import { WORKFLOW_PHASES } from "../../domain/types.js";
import type { Player } from "../../domain/player.js";

/** Optional spellings mapped to {@link WorkflowPhase} before invoke. */
const WORKFLOW_PHASE_ALIASES: Readonly<Record<string, WorkflowPhase>> = {
  decide: "decision",
  discussion: "chat",
  game_end: "end",
};

function resolveWorkflowPhase(raw: unknown): WorkflowPhase | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if ((WORKFLOW_PHASES as readonly string[]).includes(s)) {
    return s as WorkflowPhase;
  }
  return WORKFLOW_PHASE_ALIASES[s];
}

function workflowPhaseErrorText(): string {
  const canonical = WORKFLOW_PHASES.join(", ");
  const aliasHint = Object.entries(WORKFLOW_PHASE_ALIASES)
    .map(([alias, phase]) => `${alias}→${phase}`)
    .join(", ");
  return `body.phase must be one of: ${canonical}. Accepted aliases: ${aliasHint}.`;
}

function jsonError(res: Response, status: number, error: string): void {
  res.status(status).json({ error });
}

function isCooperation(v: unknown): v is RevealRoundDocument["yourMove"] {
  return v === "cooperate" || v === "defect";
}

function parseRevealRoundDocument(body: unknown): RevealRoundDocument | undefined {
  if (body === null || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const raw =
    b.reveal !== undefined && typeof b.reveal === "object" && b.reveal !== null
      ? (b.reveal as Record<string, unknown>)
      : b;
  const round = raw.round;
  const yourMove = raw.yourMove;
  const adversaryMove = raw.adversaryMove;
  const yourScore = raw.yourScore;
  const adversaryScore = raw.adversaryScore;
  if (typeof round !== "number" || !Number.isFinite(round)) return undefined;
  if (!isCooperation(yourMove) || !isCooperation(adversaryMove)) return undefined;
  if (typeof yourScore !== "number" || !Number.isFinite(yourScore)) return undefined;
  if (typeof adversaryScore !== "number" || !Number.isFinite(adversaryScore)) return undefined;
  return { round, yourMove, adversaryMove, yourScore, adversaryScore };
}

export function a2aMessageSendUrl(options: A2aMessageSendUrlOptions): string {
  const protocol = options.protocol ?? "http";
  const name = String(options.ensName);
  return `${protocol}://${options.hostForClient}:${options.port}/message/send`;
}

export function createPlayerHttpApp(player: Player): express.Express {
  const app = express();
  app.use(express.json());

  app.post("/message/send", async (req: Request, res: Response) => {
    const phase = resolveWorkflowPhase(req.body?.phase);
    if (phase === undefined) {
      jsonError(res, 400, workflowPhaseErrorText());
      return;
    }

    try {
      if (phase === "reveal") {
        const reveal = parseRevealRoundDocument(req.body);
        if (reveal === undefined) {
          jsonError(
            res,
            400,
            'reveal phase requires round outcome: { "reveal": { "round", "yourMove", "adversaryMove", "yourScore", "adversaryScore" } } (or same fields at top level)',
          );
          return;
        }
        const result = await player.invoke(phase, { reveal });
        res.json(result);
        return;
      }

      if (phase === "decision" || phase === "end") {
        const result = await player.invoke(phase, {});
        res.json(result);
        return;
      }

      const iterationRaw = req.body?.iteration;
      const iteration =
        typeof iterationRaw === "number" && Number.isFinite(iterationRaw)
          ? iterationRaw
          : undefined;
      const result = await player.invoke(phase, {
        message: req.body?.message,
        ...(iteration !== undefined ? { iteration } : {}),
      });
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      const status = /required/.test(msg) ? 400 : 500;
      jsonError(res, status, msg);
    }
  });

  return app;
}

export function startPlayerHttpServer(
  player: Player,
  port: number,
  host = "0.0.0.0",
): Promise<{ close: () => Promise<void>; port: number }> {
  const app = createPlayerHttpApp(player);
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      resolve({
        port,
        close: () =>
          new Promise((res, rej) => {
            server.close((err?: Error) => (err ? rej(err) : res()));
          }),
      });
    });
    server.on("error", reject);
  });
}
