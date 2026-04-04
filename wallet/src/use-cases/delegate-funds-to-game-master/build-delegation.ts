import type { Address, Chain } from "viem";

export type BuildAgentDelegationParams = {
  /** Agent EOA that will delegate balance control. */
  agentEoa: Address;
  /** Game master EOA that should receive delegation rights. */
  gameMasterEoa: Address;
  chain: Chain;
  /** Optional wei amount cap; undefined = full balance / protocol default. */
  valueWei?: bigint;
};

/**
 * Placeholder: build authorization / contract calls for delegating agent funds to the game master.
 * Likely ERC-7702, allowance, or a custom delegation contract — TBD.
 */
export async function buildAgentDelegation(
  _params: BuildAgentDelegationParams,
): Promise<{ data: `0x${string}`; to: Address }> {
  void _params;
  throw new Error("buildAgentDelegation: not implemented");
}
