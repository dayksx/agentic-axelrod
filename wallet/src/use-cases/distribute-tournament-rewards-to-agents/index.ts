import type { Chain } from "viem";
import type {
  AuthenticatedEvmClientParams,
  CreateEvmWalletsOptions,
} from "../../domain/index.js";
import { ensureGameMasterWallet } from "../create-game-master-wallet/index.js";
import { getPlayerWallets } from "../get-player-wallets/index.js";
import { transferFunds } from "../transfer-funds/index.js";
import { TOURNAMENT_STAKING_PRICE_WEI } from "../collect-tournament-stake-from-players/index.js";

/** At most this many agents receive a reward per run (each gets one stake-sized payout). */
export const MAX_TOURNAMENT_REWARD_RECIPIENTS = 3 as const;

export type DistributeTournamentRewardsToAgentsParams = {
  auth: AuthenticatedEvmClientParams;
  /** 1–3 player names; each receives {@link TOURNAMENT_STAKING_PRICE_WEI} from the game master. */
  recipientPlayerNames: string[];
  rpcUrl: string;
  chain: Chain;
  password?: string;
  createOptions?: CreateEvmWalletsOptions;
  gameMasterStateFilePath?: string;
  playerWalletsStateFilePath?: string;
};

export type TournamentRewardReceipt = {
  playerName: string;
  transactionHash: `0x${string}`;
};

export type DistributeTournamentRewardsToAgentsResult = {
  /** Same wei amount as one tournament stake (`TOURNAMENT_STAKING_PRICE_WEI`). */
  rewardPerRecipientWei: bigint;
  receipts: TournamentRewardReceipt[];
};

/**
 * Loads the game master and recipient wallets, then the GM sends one stake-sized
 * native transfer to each named agent (sequential txs).
 */
export async function distributeTournamentRewardsToAgents(
  params: DistributeTournamentRewardsToAgentsParams,
): Promise<DistributeTournamentRewardsToAgentsResult> {
  const {
    auth,
    recipientPlayerNames,
    rpcUrl,
    chain,
    password,
    createOptions,
    gameMasterStateFilePath,
    playerWalletsStateFilePath,
  } = params;

  const n = recipientPlayerNames.length;
  if (n === 0 || n > MAX_TOURNAMENT_REWARD_RECIPIENTS) {
    throw new Error(
      `distributeTournamentRewardsToAgents: need 1–${MAX_TOURNAMENT_REWARD_RECIPIENTS} recipient player name(s), got ${n}`,
    );
  }

  const valueWei = TOURNAMENT_STAKING_PRICE_WEI;

  const { wallet: gmWallet } = await ensureGameMasterWallet({
    auth,
    ...(createOptions !== undefined ? { createOptions } : {}),
    ...(gameMasterStateFilePath !== undefined
      ? { stateFilePath: gameMasterStateFilePath }
      : {}),
  });

  const { wallets: recipientWallets } = await getPlayerWallets({
    auth,
    playerNames: recipientPlayerNames,
    rpcUrl,
    chain,
    ...(createOptions !== undefined ? { createOptions } : {}),
    ...(playerWalletsStateFilePath !== undefined
      ? { stateFilePath: playerWalletsStateFilePath }
      : {}),
  });

  const from = gmWallet.toJSON();
  const receipts: TournamentRewardReceipt[] = [];

  for (let i = 0; i < recipientPlayerNames.length; i++) {
    const playerName = recipientPlayerNames[i]!;
    const to = recipientWallets[i]!.toJSON();
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

  return { rewardPerRecipientWei: valueWei, receipts };
}
