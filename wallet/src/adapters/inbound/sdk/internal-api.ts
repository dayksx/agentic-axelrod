import type { WalletSnapshot } from "../../../domain/index.js";
import {
  createAgentsWallets,
  type CreateAgentsWalletsParams,
} from "../../../use-cases/create-agents-wallets/index.js";
import {
  ensureGameMasterWallet,
  type EnsureGameMasterWalletParams,
} from "../../../use-cases/create-game-master-wallet/index.js";

/**
 * In-repo “SDK”: same public surface as the package root, grouped for imports like
 * `wallet/internal-api` from other packages in this monorepo.
 *
 * **Agent wallets:** {@link createAgentsWallets} returns {@link Wallet} instances;
 * {@link createAgentsWalletsData} returns the same fields as plain {@link WalletSnapshot} rows.
 *
 * **Game master:** {@link ensureGameMasterWallet} returns a {@link Wallet} plus `created` and
 * `stateFilePath`; {@link ensureGameMasterWalletData} returns a snapshot instead of the class.
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

export type EnsureGameMasterWalletDataResult = {
  wallet: WalletSnapshot;
  created: boolean;
  stateFilePath: string;
};

/** Same as {@link ensureGameMasterWallet}, but `wallet` is a {@link WalletSnapshot} for JSON/API use. */
export async function ensureGameMasterWalletData(
  params: EnsureGameMasterWalletParams,
): Promise<EnsureGameMasterWalletDataResult> {
  const { wallet, created, stateFilePath } = await ensureGameMasterWallet(params);
  return { wallet: wallet.toJSON(), created, stateFilePath };
}
