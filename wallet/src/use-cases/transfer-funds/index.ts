import type { Chain } from "viem";
import { createAuthenticatedEvmClient } from "../../adapters/outbound/dynamic/authenticated-client.js";
import type {
  AuthenticatedEvmClientParams,
  WalletSnapshot,
} from "../../domain/index.js";

export type TransferFundsParams = {
  auth: AuthenticatedEvmClientParams;
  /** Wallet that signs and pays gas (must hold enough native balance). */
  from: WalletSnapshot;
  /** Destination EOA is `to.eoaAddress`. */
  to: WalletSnapshot;
  valueWei: bigint;
  chain: Chain;
  rpcUrl: string;
  password?: string;
};

export type TransferFundsReceipt = {
  transactionHash: `0x${string}`;
};

/**
 * Native transfer from one persisted Dynamic EOA to another (same `auth` / environment).
 */
export async function transferFunds(
  params: TransferFundsParams,
): Promise<TransferFundsReceipt> {
  const { auth, from, to, valueWei, chain, rpcUrl, password } = params;
  const client = await createAuthenticatedEvmClient(auth);
  const walletClient = await client.getWalletClient({
    accountAddress: from.eoaAddress,
    chain,
    rpcUrl,
    ...(password !== undefined ? { password } : {}),
  });
  const account = walletClient.account;
  if (!account) {
    throw new Error("transferFunds: Dynamic returned no account");
  }
  const hash = await walletClient.sendTransaction({
    account,
    chain,
    to: to.eoaAddress as `0x${string}`,
    value: valueWei,
  });
  return { transactionHash: hash };
}
