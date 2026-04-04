import type { ThresholdSchemeName } from "./threshold.js";

export type AuthenticatedEvmClientParams = {
  authToken: string;
  environmentId: string;
};

export type CreatedEvmWallet = {
  accountAddress: string;
};

export type CreateEvmWalletsOptions = {
  password: string | undefined;
  thresholdSignatureScheme?: ThresholdSchemeName;
  onError?: (error: Error) => void;
  backUpToClientShareService?: boolean;
};
