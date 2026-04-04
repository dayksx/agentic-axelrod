/**
 * One Express app per {@link Player}. Entry: `POST /message/send`.
 */

import express, { type Request, type Response } from "express";
import type { A2aMessageSendUrlOptions } from "../../domain/types.js";
import type { Player } from "../../domain/player.js";
import { parseMessageSendBody } from "./message-send.schema.js";

function jsonError(
  res: Response,
  status: number,
  payload: { error: string; issues?: unknown },
): void {
  res.status(status).json(payload);
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
    const parsed = parseMessageSendBody(req.body);
    if (!parsed.ok) {
      jsonError(res, parsed.status, {
        error: parsed.error,
        ...(parsed.issues !== undefined ? { issues: parsed.issues } : {}),
      });
      return;
    }

    try {
      const body = parsed.body;
      switch (body.phase) {
        case "reveal": {
          const result = await player.invoke("reveal", { reveal: body.reveal });
          res.json(result);
          return;
        }
        case "decision": {
          const result = await player.invoke("decision", {});
          res.json(result);
          return;
        }
        case "end": {
          const result = await player.invoke("end", {});
          res.json(result);
          return;
        }
        case "chat": {
          const result = await player.invoke("chat", {
            message: body.message,
            iteration: body.iteration ?? 1,
          });
          res.json(result);
          return;
        }
        default: {
          const _exhaustive: never = body;
          void _exhaustive;
          jsonError(res, 500, { error: "unreachable phase" });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      const status = /required/.test(msg) ? 400 : 500;
      jsonError(res, status, { error: msg });
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
