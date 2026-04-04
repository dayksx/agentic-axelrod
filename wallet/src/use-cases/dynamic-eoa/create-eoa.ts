import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import {
  ThresholdScheme,
  type CreatedEvmWallet,
  type CreateEvmWalletsOptions,
} from "../../domain/index.js";

/**
 * Creates `count` separate EOA accounts via Dynamic (each call runs keygen).
 */
export async function createEoa(
  client: DynamicEvmWalletClient,
  count: number,
  options: CreateEvmWalletsOptions,
): Promise<CreatedEvmWallet[]> {
  const {
    password,
    thresholdSignatureScheme = ThresholdScheme.TWO_OF_TWO,
    onError = (error: Error) => {
      console.error("Wallet creation error:", error);
    },
    backUpToClientShareService = true,
  } = options;

  const wallets: CreatedEvmWallet[] = [];
  for (let i = 0; i < count; i++) {
    const wallet = await client.createWalletAccount({
      thresholdSignatureScheme,
      password,
      onError,
      backUpToClientShareService,
    });
    wallets.push(wallet);
  }
  return wallets;
}
