import type { CreatedEvmWallet } from "./types.js";

/**
 * Mutable domain aggregate for one EVM wallet: lifecycle flags plus addresses and Dynamic metadata.
 * Construct with {@link Wallet.fromDynamicCreated} after `createWalletAccount`, then advance through
 * the ERC-7702 path with {@link Wallet.markDelegationSigned}, {@link Wallet.recordSetCodeTransaction},
 * {@link Wallet.markSmartAccount}; call {@link Wallet.assignEnsName} when an ENS name is assigned.
 */
export class Wallet {
  #isEoaCreated = false;
  #isDelegationSigned = false;
  #isSaSet = false;
  #isEnsAssigned = false;

  #eoaAddress!: string;
  #dynamicWalletId!: string;
  #publicKeyHex!: string;
  #keySharesBackedUpToDynamic!: boolean;
  #saAddress?: `0x${string}`;
  #setCodeTransactionHash?: `0x${string}`;
  #ensName?: string;

  private constructor() {}

  static fromDynamicCreated(created: CreatedEvmWallet): Wallet {
    const w = new Wallet();
    w.#eoaAddress = created.accountAddress;
    w.#dynamicWalletId = created.walletId;
    w.#publicKeyHex = created.publicKeyHex;
    w.#keySharesBackedUpToDynamic = created.externalKeySharesWithBackupStatus.some(
      (e: { backedUpToClientKeyShareService: boolean }) =>
        e.backedUpToClientKeyShareService,
    );
    w.#isEoaCreated = true;
    return w;
  }

  /** Restore from {@link Wallet.toJSON} / persisted snapshot (e.g. game master wallet file). */
  static fromSnapshot(snapshot: WalletSnapshot): Wallet {
    const w = new Wallet();
    w.#isEoaCreated = snapshot.isEoaCreated;
    w.#isDelegationSigned = snapshot.isDelegationSigned;
    w.#isSaSet = snapshot.isSaSet;
    w.#isEnsAssigned = snapshot.isEnsAssigned;
    w.#eoaAddress = snapshot.eoaAddress;
    w.#dynamicWalletId = snapshot.dynamicWalletId;
    w.#publicKeyHex = snapshot.publicKeyHex;
    w.#keySharesBackedUpToDynamic = snapshot.keySharesBackedUpToDynamic;
    if (snapshot.saAddress !== undefined) {
      w.#saAddress = snapshot.saAddress;
    }
    if (snapshot.setCodeTransactionHash !== undefined) {
      w.#setCodeTransactionHash = snapshot.setCodeTransactionHash;
    }
    if (snapshot.ensName !== undefined) {
      w.#ensName = snapshot.ensName;
    }
    return w;
  }

  get isEoaCreated(): boolean {
    return this.#isEoaCreated;
  }

  get isDelegationSigned(): boolean {
    return this.#isDelegationSigned;
  }

  get isSaSet(): boolean {
    return this.#isSaSet;
  }

  get isEnsAssigned(): boolean {
    return this.#isEnsAssigned;
  }

  get eoaAddress(): string {
    return this.#eoaAddress;
  }

  get dynamicWalletId(): string {
    return this.#dynamicWalletId;
  }

  get publicKeyHex(): string {
    return this.#publicKeyHex;
  }

  get keySharesBackedUpToDynamic(): boolean {
    return this.#keySharesBackedUpToDynamic;
  }

  get saAddress(): `0x${string}` | undefined {
    return this.#saAddress;
  }

  get setCodeTransactionHash(): `0x${string}` | undefined {
    return this.#setCodeTransactionHash;
  }

  get ensName(): string | undefined {
    return this.#ensName;
  }

  /** Call after EIP-7702 `signAuthorization` succeeds. */
  markDelegationSigned(): void {
    if (!this.#isEoaCreated) {
      throw new Error("Wallet: markDelegationSigned requires EOA");
    }
    this.#isDelegationSigned = true;
  }

  /** Call after the type-0x04 set-code transaction is mined. */
  recordSetCodeTransaction(hash: `0x${string}`): void {
    if (!this.#isEoaCreated) {
      throw new Error("Wallet: recordSetCodeTransaction requires EOA");
    }
    this.#setCodeTransactionHash = hash;
  }

  /** Call when the MetaMask Stateless7702 smart account is resolved. */
  markSmartAccount(saAddress: `0x${string}`): void {
    if (!this.#isEoaCreated) {
      throw new Error("Wallet: markSmartAccount requires EOA");
    }
    this.#saAddress = saAddress;
    this.#isSaSet = true;
  }

  /** Full ENS name (e.g. `player.axelrodtornament.eth`) when your app assigns it. */
  assignEnsName(name: string): void {
    if (!this.#isEoaCreated) {
      throw new Error("Wallet: assignEnsName requires EOA");
    }
    this.#ensName = name;
    this.#isEnsAssigned = true;
  }

  /** Plain snapshot for `JSON.stringify` / HTTP responses. */
  toJSON(): WalletSnapshot {
    const base: WalletSnapshot = {
      isEoaCreated: this.#isEoaCreated,
      isDelegationSigned: this.#isDelegationSigned,
      isSaSet: this.#isSaSet,
      isEnsAssigned: this.#isEnsAssigned,
      eoaAddress: this.#eoaAddress,
      dynamicWalletId: this.#dynamicWalletId,
      publicKeyHex: this.#publicKeyHex,
      keySharesBackedUpToDynamic: this.#keySharesBackedUpToDynamic,
    };
    if (this.#saAddress !== undefined) {
      base.saAddress = this.#saAddress;
    }
    if (this.#setCodeTransactionHash !== undefined) {
      base.setCodeTransactionHash = this.#setCodeTransactionHash;
    }
    if (this.#ensName !== undefined) {
      base.ensName = this.#ensName;
    }
    return base;
  }
}

/** Serializable shape (no methods). */
export type WalletSnapshot = {
  isEoaCreated: boolean;
  isDelegationSigned: boolean;
  isSaSet: boolean;
  isEnsAssigned: boolean;
  eoaAddress: string;
  dynamicWalletId: string;
  publicKeyHex: string;
  keySharesBackedUpToDynamic: boolean;
  saAddress?: `0x${string}`;
  setCodeTransactionHash?: `0x${string}`;
  ensName?: string;
};
