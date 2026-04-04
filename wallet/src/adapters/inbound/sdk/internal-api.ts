import type { WalletSnapshot } from "../../../domain/index.js";
import {
  createAgentsWallets,
  type CreateAgentsWalletsParams,
} from "../../../use-cases/create-agents-wallets/index.js";
import {
  ensureGameMasterWallet,
  getGameMasterWallet,
  type EnsureGameMasterWalletParams,
} from "../../../use-cases/create-game-master-wallet/index.js";
import {
  getPlayerWallets,
  type GetPlayerWalletsParams,
} from "../../../use-cases/player-wallets/index.js";

/**
 * In-repo “SDK”: same public surface as the package root, grouped for imports like
 * `wallet/internal-api` from other packages in this monorepo.
 *
 * **Primary flows:** {@link getPlayerWallets} / {@link getPlayerWalletsData} (players by name),
 * {@link getGameMasterWallet} / {@link getGameMasterWalletData}, {@link transferFunds}.
 *
 * Lower-level helpers remain re-exported from {@link ../../../use-cases/index.js}.
 */
export * from "../../../use-cases/index.js";
export * from "../../../domain/index.js";
export { createAuthenticatedEvmClient } from "../../outbound/dynamic/authenticated-client.js";

/** Plain serializable rows (same information as {@link createAgentsWallets}, without class methods). */
export async function createAgentsWalletsData(
  params: CreateAgentsWalletsParams,
): Promise<WalletSnapshot[]> {
  const wallets = await createAgentsWallets(params);
  return wallets.map((w) => w.toJSON());
}

export type GetPlayerWalletsDataResult = {
  wallets: WalletSnapshot[];
  created: boolean[];
  stateFilePath: string;
};

/** {@link WalletSnapshot} rows instead of {@link Wallet} class instances. */
export async function getPlayerWalletsData(
  params: GetPlayerWalletsParams,
): Promise<GetPlayerWalletsDataResult> {
  const { wallets, created, stateFilePath } = await getPlayerWallets(params);
  return {
    wallets: wallets.map((w) => w.toJSON()),
    created,
    stateFilePath,
  };
}

export type GetGameMasterWalletDataResult = {
  wallet: WalletSnapshot;
  created: boolean;
  stateFilePath: string;
};

/** Same as {@link getGameMasterWallet}, but `wallet` is a {@link WalletSnapshot} for JSON/API use. */
export async function getGameMasterWalletData(
  params: EnsureGameMasterWalletParams,
): Promise<GetGameMasterWalletDataResult> {
  const { wallet, created, stateFilePath } = await getGameMasterWallet(params);
  return { wallet: wallet.toJSON(), created, stateFilePath };
}

/** @deprecated Use {@link getGameMasterWalletData}. */
export type EnsureGameMasterWalletDataResult = GetGameMasterWalletDataResult;

/** @deprecated Use {@link getGameMasterWalletData}. */
export async function ensureGameMasterWalletData(
  params: EnsureGameMasterWalletParams,
): Promise<GetGameMasterWalletDataResult> {
  const { wallet, created, stateFilePath } = await ensureGameMasterWallet(params);
  return { wallet: wallet.toJSON(), created, stateFilePath };
}
