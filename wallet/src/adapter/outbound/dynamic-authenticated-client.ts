import { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import type { AuthenticatedEvmClientParams } from "../../domain/types.js";

/** Authenticated EVM client for server-side wallet operations. */
export const createAuthenticatedEvmClient = async ({
  authToken,
  environmentId,
}: AuthenticatedEvmClientParams) => {
  const client = new DynamicEvmWalletClient({
    environmentId,
    enableMPCAccelerator: false,
  });
  await client.authenticateApiToken(authToken);
  return client;
};
