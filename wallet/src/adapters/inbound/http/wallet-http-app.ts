import type { Chain } from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import express, { type Request, type Response } from "express";
import { getPlayersWallet } from "../sdk/internal-api.js";
import { ThresholdScheme } from "../../../domain/index.js";

const CHAINS_BY_ID: Record<number, Chain> = {
  [baseSepolia.id]: baseSepolia,
  [sepolia.id]: sepolia,
};

/**
 * JSON body for `POST /agents` — create or load persisted wallets per agent name
 * (same use case as `wallet/internal-api` `getPlayersWallet` and CLI `get-player-wallets`).
 */
export type CreateAgentsHttpBody = {
  /** Defaults to `process.env.DYNAMIC_AUTH_TOKEN` when omitted. */
  authToken?: string;
  /** Defaults to `process.env.DYNAMIC_ENVIRONMENT_ID` when omitted. */
  environmentId?: string;
  /** Defaults to `process.env.RPC_URL` when omitted. */
  rpcUrl?: string;
  /** Non-empty agent / player names (order preserved). */
  names: string[];
  /** Defaults to `process.env.WALLET_PASSWORD` when omitted. */
  password?: string;
  /** If set, must be supported in {@link CHAINS_BY_ID} (Sepolia or Base Sepolia). */
  chainId?: number;
  /** Override player wallets JSON path; else `PLAYER_WALLETS_FILE` env or default file. */
  stateFilePath?: string;
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
      const raw = req.body as CreateAgentsHttpBody;

      const authToken =
        typeof raw.authToken === "string" && raw.authToken.length > 0
          ? raw.authToken
          : process.env.DYNAMIC_AUTH_TOKEN;
      const environmentId =
        typeof raw.environmentId === "string" && raw.environmentId.length > 0
          ? raw.environmentId
          : process.env.DYNAMIC_ENVIRONMENT_ID;

      if (authToken === undefined || authToken.length === 0) {
        res.status(400).json({
          error:
            "Missing authToken (body) or DYNAMIC_AUTH_TOKEN (environment)",
        });
        return;
      }
      if (environmentId === undefined || environmentId.length === 0) {
        res.status(400).json({
          error:
            "Missing environmentId (body) or DYNAMIC_ENVIRONMENT_ID (environment)",
        });
        return;
      }

      const rpcUrl =
        typeof raw.rpcUrl === "string" && raw.rpcUrl.trim() !== ""
          ? raw.rpcUrl.trim()
          : process.env.RPC_URL?.trim();
      if (rpcUrl === undefined || rpcUrl === "") {
        res.status(400).json({
          error: "Missing rpcUrl (body) or RPC_URL (environment)",
        });
        return;
      }

      const chain =
        raw.chainId !== undefined ? CHAINS_BY_ID[raw.chainId] : undefined;
      if (raw.chainId !== undefined && chain === undefined) {
        res.status(400).json({
          error: `Unsupported chainId ${raw.chainId}; supported: ${Object.keys(CHAINS_BY_ID).join(", ")}`,
        });
        return;
      }

      const password =
        typeof raw.password === "string" && raw.password.length > 0
          ? raw.password
          : process.env.WALLET_PASSWORD?.trim();
      const pw: string | undefined =
        password !== undefined && password.length > 0 ? password : undefined;

      const stateFilePath =
        typeof raw.stateFilePath === "string" && raw.stateFilePath.trim() !== ""
          ? raw.stateFilePath.trim()
          : process.env.PLAYER_WALLETS_FILE?.trim();
      const resolvedState =
        stateFilePath !== undefined && stateFilePath !== ""
          ? stateFilePath
          : undefined;

      const result = await getPlayersWallet({
        auth: { authToken, environmentId },
        playerNames: names,
        createOptions: {
          password: pw,
          thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
          backUpToClientShareService: true,
        },
        rpcUrl,
        ...(chain !== undefined ? { chain } : {}),
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
