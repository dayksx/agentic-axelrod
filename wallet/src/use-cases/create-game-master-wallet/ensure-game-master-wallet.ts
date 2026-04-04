import {
  readGameMasterWalletFile,
  resolveGameMasterWalletPath,
  writeGameMasterWalletFile,
} from "../../adapters/outbound/fs/game-master-wallet-file.js";
import { createAuthenticatedEvmClient } from "../../adapters/outbound/dynamic/authenticated-client.js";
import {
  GAME_MASTER_ENS_NAME,
  Wallet,
  type AuthenticatedEvmClientParams,
  type CreateEvmWalletsOptions,
} from "../../domain/index.js";
import { createEoa } from "../dynamic-eoa/create-eoa.js";

export type EnsureGameMasterWalletParams = {
  auth: AuthenticatedEvmClientParams;
  createOptions?: CreateEvmWalletsOptions;
  /**
   * JSON file written after first successful create. Default: `.game-master-wallet.json` under cwd.
   * Override with env `GAME_MASTER_WALLET_FILE` from the CLI when needed.
   */
  stateFilePath?: string;
};

export type EnsureGameMasterWalletResult = {
  wallet: Wallet;
  created: boolean;
  stateFilePath: string;
};

const DEFAULT_FILENAME = ".game-master-wallet.json";

/**
 * Creates the game master EOA once, assigns {@link GAME_MASTER_ENS_NAME}, and persists metadata.
 * Later runs load from disk and do not call Dynamic again.
 */
export async function ensureGameMasterWallet(
  params: EnsureGameMasterWalletParams,
): Promise<EnsureGameMasterWalletResult> {
  const stateFilePath = resolveGameMasterWalletPath(
    params.stateFilePath ?? DEFAULT_FILENAME,
  );

  const existing = readGameMasterWalletFile(stateFilePath);
  if (existing !== null) {
    return {
      wallet: Wallet.fromSnapshot(existing),
      created: false,
      stateFilePath,
    };
  }

  const client = await createAuthenticatedEvmClient(params.auth);
  const createdList = await createEoa(client, 1, {
    password: undefined,
    ...params.createOptions,
  });
  const created = createdList[0];
  if (created === undefined) {
    throw new Error("ensureGameMasterWallet: expected one created wallet");
  }

  const wallet = Wallet.fromDynamicCreated(created);
  wallet.assignEnsName(GAME_MASTER_ENS_NAME);
  writeGameMasterWalletFile(stateFilePath, wallet.toJSON());

  return {
    wallet,
    created: true,
    stateFilePath,
  };
}
