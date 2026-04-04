import type { Chain } from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import { createAuthenticatedEvmClient } from "../../outbound/dynamic/authenticated-client.js";
import { ThresholdScheme, Wallet } from "../../../domain/index.js";
import { createEoa } from "../../../use-cases/dynamic-eoa/create-eoa.js";
import { getPlayerWallets } from "../../../use-cases/get-player-wallets/index.js";

const CHAINS_BY_ID: Record<number, Chain> = {
  [baseSepolia.id]: baseSepolia,
  [sepolia.id]: sepolia,
};

export type CreateWalletsHttpBody = {
  authToken: string;
  environmentId: string;
  count: number;
  rpcUrl: string;
  password?: string;
  chainId?: number;
  playerEnsLabels?: string[];
};

/**
 * HTTP-friendly wrapper: named players use persisted {@link getPlayerWallets};
 * otherwise mints `count` ephemeral EOAs (no `.player-wallets.json`).
 */
export async function runCreateWalletsFromHttpBody(
  body: CreateWalletsHttpBody,
): Promise<Wallet[]> {
  const chain =
    body.chainId !== undefined ? CHAINS_BY_ID[body.chainId] : undefined;
  if (body.chainId !== undefined && chain === undefined) {
    throw new Error(
      `Unsupported chainId ${body.chainId}; extend CHAINS_BY_ID in create-wallets.ts`,
    );
  }

  const auth = {
    authToken: body.authToken,
    environmentId: body.environmentId,
  };
  const createOptions = {
    password: body.password,
    thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
    backUpToClientShareService: true,
  };

  if (body.playerEnsLabels !== undefined && body.playerEnsLabels.length > 0) {
    if (body.playerEnsLabels.length !== body.count) {
      throw new Error(
        "count must equal playerEnsLabels.length when playerEnsLabels is set",
      );
    }
    const { wallets } = await getPlayerWallets({
      auth,
      playerNames: body.playerEnsLabels,
      createOptions,
      rpcUrl: body.rpcUrl,
      ...(chain !== undefined ? { chain } : {}),
    });
    return wallets;
  }

  const client = await createAuthenticatedEvmClient(auth);
  const created = await createEoa(client, body.count, createOptions);
  return created.map((w) => Wallet.fromDynamicCreated(w));
}
