import type { Chain, WalletClient } from "viem";

/** Shipped typings reference missing `./src/index`; keep in sync with @dynamic-labs-wallet/node-evm runtime. */
declare module "@dynamic-labs-wallet/node-evm" {
  export type DynamicEvmWalletAccount = {
    accountAddress: string;
    publicKeyHex: string;
    rawPublicKey?: unknown;
    externalServerKeyShares?: unknown[];
    externalKeySharesWithBackupStatus: Array<{
      share: unknown;
      backedUpToClientKeyShareService: boolean;
    }>;
    walletId: string;
  };

  export class DynamicEvmWalletClient {
    constructor(options: {
      environmentId: string;
      enableMPCAccelerator?: boolean;
    });

    authenticateApiToken(authToken: string): Promise<void>;

    createWalletAccount(params: {
      thresholdSignatureScheme: string;
      password?: string | undefined;
      onError?: (error: Error) => void;
      backUpToClientShareService?: boolean;
    }): Promise<DynamicEvmWalletAccount>;

    getWalletClient(params: {
      accountAddress: string;
      password?: string;
      externalServerKeyShares?: unknown;
      chain?: Chain;
      chainId?: number;
      rpcUrl?: string;
    }): Promise<WalletClient>;
  }
}
