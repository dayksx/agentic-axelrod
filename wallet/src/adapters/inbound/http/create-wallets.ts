import type { Chain } from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import {
  createAgentsWallets,
  type CreateAgentsWalletsParams,
} from "../../../use-cases/create-agents-wallets/index.js";
import type { Wallet } from "../../../domain/index.js";
import { ThresholdScheme } from "../../../domain/index.js";

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
  /** If omitted, {@link upgradeEoaToSa} defaults to Base Sepolia. */
  chainId?: number;
  playerEnsLabels?: string[];
};

/**
 * HTTP-friendly wrapper: maps JSON body to {@link createAgentsWallets}.
 */
export async function runCreateWalletsFromHttpBody(
  body: CreateWalletsHttpBody,
): Promise<Wallet[]> {
  const chain =
    body.chainId !== undefined
      ? CHAINS_BY_ID[body.chainId]
      : undefined;
  if (body.chainId !== undefined && chain === undefined) {
    throw new Error(
      `Unsupported chainId ${body.chainId}; extend CHAINS_BY_ID in create-wallets.ts`,
    );
  }

  const params: CreateAgentsWalletsParams = {
    auth: {
      authToken: body.authToken,
      environmentId: body.environmentId,
    },
    count: body.count,
    rpcUrl: body.rpcUrl,
    createOptions: {
      password: body.password,
      thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
      backUpToClientShareService: true,
    },
    ...(chain !== undefined ? { chain } : {}),
    ...(body.playerEnsLabels !== undefined
      ? { playerEnsLabels: body.playerEnsLabels }
      : {}),
  };

  return createAgentsWallets(params);
}
