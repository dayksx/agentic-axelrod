import { createAuthenticatedEvmClient } from "../../adapters/outbound/dynamic/authenticated-client.js";
import type {
  AuthenticatedEvmClientParams,
  CreatedEvmWallet,
  CreateEvmWalletsOptions,
} from "../../domain/index.js";
import { createEoa } from "../create-agents-wallets/create-eoa.js";

export type ProvisionGameMasterEoaParams = {
  auth: AuthenticatedEvmClientParams;
  createOptions?: CreateEvmWalletsOptions;
};

/**
 * Creates a single EOA via Dynamic for the game master (no persistence).
 * Prefer {@link ensureGameMasterWallet} for CLI / idempotent flows.
 */
export async function provisionGameMasterEoa(
  params: ProvisionGameMasterEoaParams,
): Promise<CreatedEvmWallet> {
  const client = await createAuthenticatedEvmClient(params.auth);
  const list = await createEoa(client, 1, {
    password: undefined,
    ...params.createOptions,
  });
  const w = list[0];
  if (w === undefined) {
    throw new Error("provisionGameMasterEoa: expected one wallet");
  }
  return w;
}
