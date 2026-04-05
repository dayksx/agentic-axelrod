import type { Chain } from "viem";
import { parseEther } from "viem";
import type {
  AuthenticatedEvmClientParams,
  CreateEvmWalletsOptions,
} from "../../domain/index.js";
import { ensureGameMasterWallet } from "../create-game-master-wallet/index.js";
import { getPlayerWallets } from "../get-player-wallets/index.js";
import { transferFunds } from "../transfer-funds/index.js";

/** Human-readable stake each player pays to join (native token, e.g. ETH). */
export const TOURNAMENT_STAKING_PRICE_ETH = "0.001" as const;

export const TOURNAMENT_STAKING_PRICE_WEI = parseEther(TOURNAMENT_STAKING_PRICE_ETH);

export type CollectTournamentStakeFromPlayersParams = {
  auth: AuthenticatedEvmClientParams;
  /** Each sends `stakingPriceWei` to the game master treasury, in list order. */
  playerNames: string[];
  rpcUrl: string;
  chain: Chain;
  password?: string;
  createOptions?: CreateEvmWalletsOptions;
  gameMasterStateFilePath?: string;
  playerWalletsStateFilePath?: string;
};

export type TournamentStakeReceipt = {
  playerName: string;
  transactionHash: `0x${string}`;
};

export type CollectTournamentStakeFromPlayersResult = {
  stakingPriceWei: bigint;
  receipts: TournamentStakeReceipt[];
};

/**
 * Loads the game master and player wallets, then each named player sends
 * {@link TOURNAMENT_STAKING_PRICE_WEI} to the game master (sequential txs).
 */
export async function collectTournamentStakeFromPlayers(
  params: CollectTournamentStakeFromPlayersParams,
): Promise<CollectTournamentStakeFromPlayersResult> {
  const {
    auth,
    playerNames,
    rpcUrl,
    chain,
    password,
    createOptions,
    gameMasterStateFilePath,
    playerWalletsStateFilePath,
  } = params;

  const valueWei = TOURNAMENT_STAKING_PRICE_WEI;

  if (playerNames.length === 0) {
    return { stakingPriceWei: valueWei, receipts: [] };
  }

  const { wallet: gmWallet } = await ensureGameMasterWallet({
    auth,
    ...(createOptions !== undefined ? { createOptions } : {}),
    ...(gameMasterStateFilePath !== undefined
      ? { stateFilePath: gameMasterStateFilePath }
      : {}),
  });

  const { wallets: playerWallets } = await getPlayerWallets({
    auth,
    playerNames,
    rpcUrl,
    chain,
    ...(createOptions !== undefined ? { createOptions } : {}),
    ...(playerWalletsStateFilePath !== undefined
      ? { stateFilePath: playerWalletsStateFilePath }
      : {}),
  });

  const to = gmWallet.toJSON();
  const receipts: TournamentStakeReceipt[] = [];

  for (let i = 0; i < playerNames.length; i++) {
    const playerName = playerNames[i]!;
    const from = playerWallets[i]!.toJSON();
    const { transactionHash } = await transferFunds({
      auth,
      from,
      to,
      valueWei,
      chain,
      rpcUrl,
      ...(password !== undefined ? { password } : {}),
    });
    receipts.push({ playerName, transactionHash });
  }

  return { stakingPriceWei: valueWei, receipts };
}
