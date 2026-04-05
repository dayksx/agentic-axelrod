/**
 * Optional on-chain stakes: collect from payers before play, distribute to top 3 after.
 * Enabled when `GM_COLLECT_STAKES` is true/1/yes (same Dynamic + RPC env as `wallet` CLI).
 */
import { sepolia } from "viem/chains";
import type { CreateEvmWalletsOptions } from "wallet";
import { ThresholdScheme } from "wallet";
import type { WalletSnapshot } from "wallet/internal-api";
import {
  collectTournamentStakeFromPlayers,
  distributeTournamentRewardsToAgents,
  getPlayersWallet,
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

export function snapshotOnChainAddress(s: WalletSnapshot): string {
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

export async function loadWalletsForPlayers(playerNames: string[]) {
  const { authToken, environmentId } = requireDynamicAuth();
  const createOptions = walletCreateOptions();
  return getPlayersWallet({
    auth: { authToken, environmentId },
    playerNames,
    rpcUrl: rpcUrl(),
    chain: sepolia,
    createOptions,
    ...optionalStatePaths(),
  });
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
