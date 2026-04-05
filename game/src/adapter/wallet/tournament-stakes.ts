/**
 * Optional on-chain stakes: collect from payers before play, distribute to top 3 after.
 * Enabled when `GM_COLLECT_STAKES` is true/1/yes.
 *
 * **Resolving player addresses** (for `agents.wallet_address`): `loadWalletsForPlayers` calls
 * the wallet HTTP API (`WALLET_SERVICE_URL` + `POST /agents`). Collect / distribute still use
 * `wallet/internal-api` on this process and need Dynamic + RPC env here.
 */
import { sepolia } from "viem/chains";
import type { CreateEvmWalletsOptions } from "wallet";
import { ThresholdScheme } from "wallet";
import {
  collectTournamentStakeFromPlayers,
  distributeTournamentRewardsToAgents,
} from "wallet/internal-api";

import type { PlayerConfig } from "../../domain/model/types.js";

export function isTournamentStakingEnabled(): boolean {
  const v = process.env.GM_COLLECT_STAKES?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** T1: all pay; T2+ with carryovers: only non-carryover players pay. */
export function stakePayerNames(players: readonly PlayerConfig[]): string[] {
  const hasCarryover = players.some((p) => p.rosterRole === "carryover");
  if (!hasCarryover) return players.map((p) => p.name);
  return players.filter((p) => p.rosterRole !== "carryover").map((p) => p.name);
}

/** Subset of wallet snapshot; enough for DB `wallet_address` and HTTP `POST /agents` rows. */
export type PlayerWalletAddressRow = { readonly eoaAddress: string };

export function snapshotOnChainAddress(s: PlayerWalletAddressRow): string {
  return s.eoaAddress;
}

function requireDynamicAuth(): {
  authToken: string;
  environmentId: string;
} {
  const authToken = process.env.DYNAMIC_AUTH_TOKEN?.trim();
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID?.trim();
  if (!authToken || !environmentId) {
    throw new Error(
      "GM_COLLECT_STAKES is enabled: set DYNAMIC_AUTH_TOKEN and DYNAMIC_ENVIRONMENT_ID (same as wallet/.env).",
    );
  }
  return { authToken, environmentId };
}

function rpcUrl(): string {
  const raw = process.env.RPC_URL?.trim();
  if (raw !== undefined && raw.length > 0) return raw;
  return sepolia.rpcUrls.default.http[0]!;
}

function walletCreateOptions(): CreateEvmWalletsOptions {
  const passwordRaw = process.env.WALLET_PASSWORD?.trim();
  const password: string | undefined =
    passwordRaw !== undefined && passwordRaw.length > 0
      ? passwordRaw
      : undefined;
  return {
    password,
    thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
    backUpToClientShareService: true,
  };
}

function optionalStatePaths(): {
  gameMasterStateFilePath?: string;
  playerWalletsStateFilePath?: string;
} {
  const gm = process.env.GAME_MASTER_WALLET_FILE?.trim();
  const pw = process.env.PLAYER_WALLETS_FILE?.trim();
  return {
    ...(gm !== undefined && gm.length > 0
      ? { gameMasterStateFilePath: gm }
      : {}),
    ...(pw !== undefined && pw.length > 0
      ? { playerWalletsStateFilePath: pw }
      : {}),
  };
}

function walletHttpBase(): string | undefined {
  const b = process.env.WALLET_SERVICE_URL?.trim().replace(/\/$/, "");
  return b !== undefined && b.length > 0 ? b : undefined;
}

const WALLET_HTTP_TIMEOUT_MS = 120_000;

function parseWalletAgentsResponse(
  raw: unknown,
  expectedNames: number,
): PlayerWalletAddressRow[] {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Wallet service returned invalid JSON (not an object)");
  }
  const o = raw as Record<string, unknown>;
  const walletsRaw = o.wallets;
  if (!Array.isArray(walletsRaw)) {
    throw new Error('Wallet service response missing "wallets" array');
  }
  if (walletsRaw.length !== expectedNames) {
    throw new Error(
      `Wallet service returned ${walletsRaw.length} wallet(s), expected ${expectedNames}`,
    );
  }
  const wallets: PlayerWalletAddressRow[] = [];
  for (let i = 0; i < walletsRaw.length; i++) {
    const row = walletsRaw[i];
    if (row === null || typeof row !== "object") {
      throw new Error(`wallets[${i}] must be an object`);
    }
    const eoa = (row as { eoaAddress?: unknown }).eoaAddress;
    if (typeof eoa !== "string" || eoa.length === 0) {
      throw new Error(`wallets[${i}].eoaAddress must be a non-empty string`);
    }
    wallets.push({ eoaAddress: eoa });
  }
  return wallets;
}

/**
 * Resolves on-chain addresses for player names via the wallet **HTTP** service (`POST /agents`).
 * Does not use the in-process wallet SDK (Dynamic credentials stay on the wallet service).
 */
export async function loadWalletsForPlayers(
  playerNames: string[],
): Promise<{ wallets: PlayerWalletAddressRow[] }> {
  const base = walletHttpBase();
  if (base === undefined) {
    throw new Error(
      "Set WALLET_SERVICE_URL to the wallet HTTP service base URL (e.g. http://127.0.0.1:3210). " +
        "The Game Master calls POST /agents to resolve player addresses when staking is enabled.",
    );
  }

  const res = await fetch(`${base}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names: playerNames }),
    signal: AbortSignal.timeout(WALLET_HTTP_TIMEOUT_MS),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text.length > 0 ? (JSON.parse(text) as unknown) : {};
  } catch {
    throw new Error(
      `Wallet service returned non-JSON (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const errMsg =
      json !== null &&
      typeof json === "object" &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : text.slice(0, 300);
    throw new Error(
      `Wallet service POST /agents failed (${res.status}): ${errMsg}`,
    );
  }

  const wallets = parseWalletAgentsResponse(json, playerNames.length);
  return { wallets };
}

export async function runCollectStakes(playerNames: string[]) {
  const { authToken, environmentId } = requireDynamicAuth();
  const createOptions = walletCreateOptions();
  const passwordRaw = process.env.WALLET_PASSWORD?.trim();
  const password =
    passwordRaw !== undefined && passwordRaw.length > 0
      ? passwordRaw
      : undefined;
  return collectTournamentStakeFromPlayers({
    auth: { authToken, environmentId },
    playerNames,
    rpcUrl: rpcUrl(),
    chain: sepolia,
    createOptions,
    ...(password !== undefined ? { password } : {}),
    ...optionalStatePaths(),
  });
}

export async function runDistributeRewards(recipientNames: string[]) {
  const { authToken, environmentId } = requireDynamicAuth();
  const createOptions = walletCreateOptions();
  const passwordRaw = process.env.WALLET_PASSWORD?.trim();
  const password =
    passwordRaw !== undefined && passwordRaw.length > 0
      ? passwordRaw
      : undefined;
  return distributeTournamentRewardsToAgents({
    auth: { authToken, environmentId },
    recipientPlayerNames: recipientNames,
    rpcUrl: rpcUrl(),
    chain: sepolia,
    createOptions,
    ...(password !== undefined ? { password } : {}),
    ...optionalStatePaths(),
  });
}
