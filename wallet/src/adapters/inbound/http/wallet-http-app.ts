import { sepolia } from "viem/chains";
import express, { type Request, type Response } from "express";
import { getPlayersWallet } from "../sdk/internal-api.js";
import { ThresholdScheme } from "../../../domain/index.js";

/** Default Sepolia HTTP RPC from viem when `RPC_URL` is unset (same idea as CLI). */
function defaultSepoliaRpcUrl(): string {
  return sepolia.rpcUrls.default.http[0]!;
}

/**
 * JSON body for `POST /agents` — only agent names. Dynamic credentials, RPC, chain,
 * and optional password / player file path come from the server environment (see `wallet/.env`).
 */
export type CreateAgentsHttpBody = {
  /** Non-empty agent / player names (order preserved). */
  names: string[];
};

function parseAgentNames(body: unknown): string[] {
  if (body === null || typeof body !== "object") {
    throw new Error("body must be a JSON object");
  }
  const names = (body as { names?: unknown }).names;
  if (!Array.isArray(names)) {
    throw new Error('body.names must be a non-empty array of strings');
  }
  const cleaned = names
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .filter((s) => s.length > 0);
  if (cleaned.length === 0) {
    throw new Error("body.names must contain at least one non-empty name");
  }
  return cleaned;
}

/**
 * REST API for wallet operations used by integrators.
 *
 * - `POST /agents` — ensure one wallet per name via {@link getPlayersWallet}
 * - `GET /health` — liveness
 */
export function createWalletHttpApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "wallet" });
  });

  app.post("/agents", async (req: Request, res: Response) => {
    try {
      const names = parseAgentNames(req.body);

      const authToken = process.env.DYNAMIC_AUTH_TOKEN?.trim();
      const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID?.trim();

      if (authToken === undefined || authToken === "") {
        res.status(503).json({
          error:
            "Server is not configured: set DYNAMIC_AUTH_TOKEN in the wallet service environment",
        });
        return;
      }
      if (environmentId === undefined || environmentId === "") {
        res.status(503).json({
          error:
            "Server is not configured: set DYNAMIC_ENVIRONMENT_ID in the wallet service environment",
        });
        return;
      }

      const rpcRaw = process.env.RPC_URL?.trim();
      const rpcUrl =
        rpcRaw !== undefined && rpcRaw !== "" ? rpcRaw : defaultSepoliaRpcUrl();

      const password = process.env.WALLET_PASSWORD?.trim();
      const pw: string | undefined =
        password !== undefined && password !== "" ? password : undefined;

      const playerFile = process.env.PLAYER_WALLETS_FILE?.trim();
      const resolvedState =
        playerFile !== undefined && playerFile !== "" ? playerFile : undefined;

      const result = await getPlayersWallet({
        auth: { authToken, environmentId },
        playerNames: names,
        createOptions: {
          password: pw,
          thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
          backUpToClientShareService: true,
        },
        rpcUrl,
        chain: sepolia,
        ...(resolvedState !== undefined ? { stateFilePath: resolvedState } : {}),
      });

      res.status(200).json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.startsWith("body.") ||
        msg === "body must be a JSON object" ||
        msg.includes("must be")
      ) {
        res.status(400).json({ error: msg });
        return;
      }
      console.error("[wallet HTTP] POST /agents", e);
      res.status(500).json({ error: msg });
    }
  });

  return app;
}
