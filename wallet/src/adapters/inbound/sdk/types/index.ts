import type { WalletSnapshot } from "../../../../domain/index.js";

export type GetPlayersWalletResult = {
  wallets: WalletSnapshot[];
  created: boolean[];
  stateFilePath: string;
};

export type GetGameMasterWalletResult = {
  wallet: WalletSnapshot;
  created: boolean;
  stateFilePath: string;
};
