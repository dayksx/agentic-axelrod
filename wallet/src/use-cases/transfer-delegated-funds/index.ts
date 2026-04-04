import type { Address, Chain } from "viem";
import {
  buildDelegatedTransfer,
  type BuildDelegatedTransferParams,
} from "./build-transfer.js";

export type TransferDelegatedFundsParams = BuildDelegatedTransferParams & {
  rpcUrl: string;
};

export type DelegatedTransferReceipt = {
  transactionHash?: `0x${string}`;
};

/**
 * Placeholder use case: game master sends agents’ delegated funds to any address
 * (e.g. back to an agent or to a human wallet).
 */
export async function transferDelegatedFunds(
  params: TransferDelegatedFundsParams,
): Promise<DelegatedTransferReceipt> {
  const _built = await buildDelegatedTransfer({
    gameMasterEoa: params.gameMasterEoa,
    to: params.to,
    valueWei: params.valueWei,
    chain: params.chain,
  });
  void _built;
  void params.rpcUrl;
  throw new Error("transferDelegatedFunds: not implemented");
}
