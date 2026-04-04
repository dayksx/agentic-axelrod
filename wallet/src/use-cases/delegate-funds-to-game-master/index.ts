import {
  buildAgentDelegation,
  type BuildAgentDelegationParams,
} from "./build-delegation.js";

export type DelegateFundsToGameMasterParams = BuildAgentDelegationParams & {
  /** RPC URL used to broadcast when implementation is added. */
  rpcUrl: string;
};

export type DelegationReceipt = {
  /** Placeholder tx hash once submission exists. */
  transactionHash?: `0x${string}`;
};

/**
 * Placeholder use case: allow an agent wallet to delegate ETH (or spend rights) to the game master wallet.
 */
export async function delegateFundsToGameMaster(
  params: DelegateFundsToGameMasterParams,
): Promise<DelegationReceipt> {
  const _built = await buildAgentDelegation({
    agentEoa: params.agentEoa,
    gameMasterEoa: params.gameMasterEoa,
    chain: params.chain,
    ...(params.valueWei !== undefined ? { valueWei: params.valueWei } : {}),
  });
  void _built;
  void params.rpcUrl;
  throw new Error("delegateFundsToGameMaster: not implemented");
}
