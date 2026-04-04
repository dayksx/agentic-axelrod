/** Shipped typings reference missing `./src/index`; keep in sync with @dynamic-labs-wallet/node-evm runtime. */
declare module "@dynamic-labs-wallet/node-evm" {
  export type DynamicEvmWalletAccount = {
    accountAddress: string;
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
  }
}
