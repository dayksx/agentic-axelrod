import { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import type { AuthenticatedEvmClientParams } from "../../../domain/index.js";

export async function createAuthenticatedEvmClient({
  authToken,
  environmentId,
}: AuthenticatedEvmClientParams) {
  const client = new DynamicEvmWalletClient({
    environmentId,
    enableMPCAccelerator: false,
  });
  await client.authenticateApiToken(authToken);
  return client;
}
