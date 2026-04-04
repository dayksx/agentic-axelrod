import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import type { Chain } from "viem";

/** Matches `@dynamic-labs-wallet/core` threshold scheme strings. */
export const ThresholdScheme = {
  TWO_OF_TWO: "TWO_OF_TWO",
  TWO_OF_THREE: "TWO_OF_THREE",
  THREE_OF_FIVE: "THREE_OF_FIVE",
} as const;

export type ThresholdSchemeName =
  (typeof ThresholdScheme)[keyof typeof ThresholdScheme];

export const DEFAULT_WALLET_COUNT = 6;

export type AuthenticatedEvmClientParams = {
  authToken: string;
  environmentId: string;
};

/** Row returned by `DynamicEvmWalletClient.createWalletAccount`. */
export type CreatedEvmWallet = {
  accountAddress: string;
  publicKeyHex: string;
  walletId: string;
  rawPublicKey?: unknown;
  externalServerKeyShares?: unknown[];
  externalKeySharesWithBackupStatus: Array<{
    share: unknown;
    backedUpToClientKeyShareService: boolean;
  }>;
};

export type CreateEvmWalletsOptions = {
  password: string | undefined;
  thresholdSignatureScheme?: ThresholdSchemeName;
  onError?: (error: Error) => void;
  backUpToClientShareService?: boolean;
};

/** Config for ERC-7702 upgrade use case. Defaults chain to Base Sepolia when omitted. */
export type Erc7702UpgradeOptions = {
  dynamicClient: DynamicEvmWalletClient;
  password?: string;
  /** HTTP RPC URL (must match `chain`, e.g. Base Sepolia). */
  rpcUrl: string;
  /** Defaults to `baseSepolia` from viem/chains. */
  chain?: Chain;
};

export type Erc7702SmartAccount = {
  eoaAddress: string;
  /** MetaMask Stateless7702 smart account address (from `toMetaMaskSmartAccount`). */
  smartAccountAddress: `0x${string}`;
  /** Type-0x04 transaction that applies EIP-7702 delegation. */
  setCodeTransactionHash: `0x${string}`;
};
