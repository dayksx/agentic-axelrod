import type { Address, Chain } from "viem";

export type BuildDelegatedTransferParams = {
  /** Game master EOA that moves delegated liquidity. */
  gameMasterEoa: Address;
  /** Destination: another agent wallet, a human wallet, or treasury. */
  to: Address;
  valueWei: bigint;
  chain: Chain;
};

/**
 * Placeholder: encode + optionally sign a transfer of previously delegated funds.
 */
export async function buildDelegatedTransfer(
  _params: BuildDelegatedTransferParams,
): Promise<{ data: `0x${string}`; to: Address; value: bigint }> {
  void _params;
  throw new Error("buildDelegatedTransfer: not implemented");
}
