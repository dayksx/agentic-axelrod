import {
  ensureGameMasterWallet,
  type EnsureGameMasterWalletParams,
  type EnsureGameMasterWalletResult,
} from "./ensure-game-master-wallet.js";

export type { EnsureGameMasterWalletParams, EnsureGameMasterWalletResult };
export { ensureGameMasterWallet };

/**
 * Load or create the persisted game master wallet (alias of {@link ensureGameMasterWallet}).
 */
export async function getGameMasterWallet(
  params: EnsureGameMasterWalletParams,
): Promise<EnsureGameMasterWalletResult> {
  return ensureGameMasterWallet(params);
}
export {
  provisionGameMasterEoa,
  type ProvisionGameMasterEoaParams,
} from "./provision-eoa.js";

export type GameMasterWalletRef = {
  eoaAddress: `0x${string}`;
  dynamicWalletId: string;
};

/** @deprecated Prefer {@link ensureGameMasterWallet} for full wallet + `created` flag. */
export type CreateGameMasterWalletParams = EnsureGameMasterWalletParams;

/**
 * Ensures the persisted game master wallet exists (same as {@link ensureGameMasterWallet}),
 * but returns only EOA + Dynamic id.
 */
export async function createGameMasterWallet(
  params: EnsureGameMasterWalletParams,
): Promise<GameMasterWalletRef> {
  const { wallet } = await ensureGameMasterWallet(params);
  return {
    eoaAddress: wallet.eoaAddress as `0x${string}`,
    dynamicWalletId: wallet.dynamicWalletId,
  };
}
