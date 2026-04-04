/**
 * CLI: create Dynamic EVM wallets from env. Run `pnpm run create-wallets` from `wallet/`.
 */
import { createEvmWallets } from "../../../application/create-evm-wallets.js";
import { createAuthenticatedEvmClient } from "../../outbound/dynamic-authenticated-client.js";
import {
  DEFAULT_WALLET_COUNT,
  ThresholdScheme,
} from "../../../domain/index.js";

async function main(): Promise<void> {
  const authToken = process.env.DYNAMIC_AUTH_TOKEN;
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
  const password = process.env.WALLET_PASSWORD;

  if (!authToken || !environmentId) {
    console.error(
      "Set DYNAMIC_AUTH_TOKEN and DYNAMIC_ENVIRONMENT_ID (see wallet/.env.example).",
    );
    process.exitCode = 1;
    return;
  }

  const client = await createAuthenticatedEvmClient({
    authToken,
    environmentId,
  });

  const wallets = await createEvmWallets(client, DEFAULT_WALLET_COUNT, {
    password,
    thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
    backUpToClientShareService: true,
  });

  wallets.forEach((w, index) => {
    console.log(`Wallet ${index + 1}: ${w.accountAddress}`);
  });
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
