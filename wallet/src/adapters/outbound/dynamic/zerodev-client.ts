import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import * as nodeEvm from "@dynamic-labs-wallet/node-evm";

/**
 * Kernel account client from {@link createZerodevClientForWallet} (minimal surface for our use case).
 */
export type ZerodevKernelAccountClient = {
  sendTransaction: (args: {
    to: `0x${string}`;
    value: bigint;
    data?: `0x${string}`;
  }) => Promise<`0x${string}`>;
  account?: { address?: `0x${string}` };
};

/**
 * Client returned by Dynamic's `createZerodevClient` (runtime export; package .d.ts is incomplete).
 */
export type ZerodevClient = {
  createKernelClientForAddress: (options: {
    address: string;
    networkId: string;
    externalServerKeyShares?: unknown[];
    withSponsorship?: boolean;
    password?: string;
  }) => Promise<ZerodevKernelAccountClient>;
};

type CreateZerodevClientFn = (
  client: DynamicEvmWalletClient,
) => Promise<ZerodevClient>;

/**
 * Wraps Dynamic's `createZerodevClient` — exported at runtime from `@dynamic-labs-wallet/node-evm`
 * but missing from the package's TypeScript entry.
 */
export async function createZerodevClientForWallet(
  client: DynamicEvmWalletClient,
): Promise<ZerodevClient> {
  const createZerodevClient = (nodeEvm as unknown as {
    createZerodevClient?: CreateZerodevClientFn;
  }).createZerodevClient;
  if (typeof createZerodevClient !== "function") {
    throw new Error(
      "@dynamic-labs-wallet/node-evm: createZerodevClient is missing — check package version",
    );
  }
  return createZerodevClient(client);
}
