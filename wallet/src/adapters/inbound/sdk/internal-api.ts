import type {
  GetGameMasterWalletResult,
  GetPlayersWalletResult,
} from "./types/index.js";
import {
  getGameMasterWallet as loadGameMasterWallet,
  type EnsureGameMasterWalletParams,
} from "../../../use-cases/create-game-master-wallet/index.js";
import {
  getPlayerWallets,
  type GetPlayerWalletsParams,
} from "../../../use-cases/get-player-wallets/index.js";
import {
  collectTournamentStakeFromPlayers,
  TOURNAMENT_STAKING_PRICE_ETH,
  TOURNAMENT_STAKING_PRICE_WEI,
  type CollectTournamentStakeFromPlayersParams,
  type CollectTournamentStakeFromPlayersResult,
  type TournamentStakeReceipt,
} from "../../../use-cases/collect-tournament-stake-from-players/index.js";
import {
  distributeTournamentRewardsToAgents,
  MAX_TOURNAMENT_REWARD_RECIPIENTS,
  type DistributeTournamentRewardsToAgentsParams,
  type DistributeTournamentRewardsToAgentsResult,
  type TournamentRewardReceipt,
} from "../../../use-cases/distribute-tournament-rewards-to-agents/index.js";
import {
  transferFunds,
  type TransferFundsParams,
  type TransferFundsReceipt,
} from "../../../use-cases/transfer-funds/index.js";

export type { WalletSnapshot } from "../../../domain/index.js";
export type {
  CollectTournamentStakeFromPlayersParams,
  CollectTournamentStakeFromPlayersResult,
  DistributeTournamentRewardsToAgentsParams,
  DistributeTournamentRewardsToAgentsResult,
  EnsureGameMasterWalletParams,
  GetPlayerWalletsParams,
  TournamentRewardReceipt,
  TournamentStakeReceipt,
  TransferFundsParams,
  TransferFundsReceipt,
};
export {
  MAX_TOURNAMENT_REWARD_RECIPIENTS,
  TOURNAMENT_STAKING_PRICE_ETH,
  TOURNAMENT_STAKING_PRICE_WEI,
};
export type { GetGameMasterWalletResult, GetPlayersWalletResult } from "./types/index.js";

/**
 * In-repo SDK for `wallet/internal-api`: player wallets by name, game master wallet,
 * native transfers, collecting the fixed tournament stake (0.001 ETH) from players into the GM treasury,
 * and distributing that same amount from the GM to up to three named agents.
 */

/** Create or load one wallet per player name; returns plain {@link WalletSnapshot} rows. */
export async function getPlayersWallet(
  params: GetPlayerWalletsParams,
): Promise<GetPlayersWalletResult> {
  const { wallets, created, stateFilePath } = await getPlayerWallets(params);
  return {
    wallets: wallets.map((w) => w.toJSON()),
    created,
    stateFilePath,
  };
}

/** Create or load the persisted game master; `wallet` is a {@link WalletSnapshot}. */
export async function getGameMasterWallet(
  params: EnsureGameMasterWalletParams,
): Promise<GetGameMasterWalletResult> {
  const { wallet, created, stateFilePath } = await loadGameMasterWallet(params);
  return { wallet: wallet.toJSON(), created, stateFilePath };
}

export {
  collectTournamentStakeFromPlayers,
  distributeTournamentRewardsToAgents,
  transferFunds,
};
