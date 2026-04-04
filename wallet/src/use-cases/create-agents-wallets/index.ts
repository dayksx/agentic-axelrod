import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import type { Chain } from "viem";
import { createAuthenticatedEvmClient } from "../../adapters/outbound/dynamic/authenticated-client.js";
import {
  Wallet,
  type AuthenticatedEvmClientParams,
  type CreateEvmWalletsOptions,
} from "../../domain/index.js";
import { createEoa } from "./create-eoa.js";
// import { upgradeEoaToSa } from "./upgrade-eoa-to-sa.js";

/** Suffix for agent ENS names from {@link CreateAgentsWalletsParams.playerEnsLabels}. */
export const PLAYER_ENS_SUFFIX = ".axelrodtornament.eth";

export type CreateAgentsWalletsParams = {
  auth: AuthenticatedEvmClientParams;
  count: number;
  createOptions: CreateEvmWalletsOptions;
  rpcUrl: string;
  /** Defaults to Base Sepolia in {@link upgradeEoaToSa}. */
  chain?: Chain;
  /**
   * One label per wallet (same order as created wallets). Each becomes
   * `{label}{@link PLAYER_ENS_SUFFIX}` on the corresponding {@link Wallet}.
   */
  playerEnsLabels?: string[];
};

/**
 * Orchestrates authenticate → create N EOAs → (optional) ERC-7702 upgrade for each.
 * Returns {@link Wallet} rows; the Dynamic client is not exposed (use lower-level
 * functions if you need to hold the client across calls).
 */
export async function createAgentsWallets(
  params: CreateAgentsWalletsParams,
): Promise<Wallet[]> {
  const { auth, count, createOptions, rpcUrl, chain, playerEnsLabels } = params;

  const client: DynamicEvmWalletClient = await createAuthenticatedEvmClient(auth);

  const wallets = await createEoa(client, count, createOptions);

  // ERC-7702 upgrade needs on-chain gas (or sponsorship). Re-enable when EOAs are
  // funded or you have a paymaster path — uncomment import + block below and remove
  // the `map(fromDynamicCreated)` fallback.
  // const upgraded = await upgradeEoaToSa(wallets, {
  //   dynamicClient: client,
  //   rpcUrl,
  //   ...(chain !== undefined ? { chain } : {}),
  //   ...(createOptions.password !== undefined
  //     ? { password: createOptions.password }
  //     : {}),
  // });

  const upgraded = wallets.map((w) => Wallet.fromDynamicCreated(w));

  if (playerEnsLabels !== undefined) {
    if (playerEnsLabels.length !== upgraded.length) {
      throw new Error(
        `playerEnsLabels length (${playerEnsLabels.length}) must match wallet count (${upgraded.length})`,
      );
    }
    for (let i = 0; i < upgraded.length; i++) {
      const label = playerEnsLabels[i]!;
      upgraded[i]!.assignEnsName(`${label}${PLAYER_ENS_SUFFIX}`);
    }
  }

  return upgraded;
}
