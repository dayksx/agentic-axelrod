import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type { WalletSnapshot } from "../../../domain/index.js";
import { getWalletPackageRoot } from "../../../wallet-package-root.js";

const FILE_VERSION = 1;

export type PersistedGameMasterWalletFile = {
  version: typeof FILE_VERSION;
  wallet: WalletSnapshot;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function assertWalletSnapshot(o: unknown, ctx: string): WalletSnapshot {
  if (!isRecord(o)) {
    throw new Error(`${ctx}: wallet must be an object`);
  }
  const need = [
    "isEoaCreated",
    "isDelegationSigned",
    "isSaSet",
    "isEnsAssigned",
    "eoaAddress",
    "dynamicWalletId",
    "publicKeyHex",
    "keySharesBackedUpToDynamic",
  ] as const;
  for (const k of need) {
    if (!(k in o)) {
      throw new Error(`${ctx}: missing wallet.${k}`);
    }
  }
  return o as unknown as WalletSnapshot;
}

/** Resolve path relative to the wallet package root when not absolute. */
export function resolveGameMasterWalletPath(
  filePath: string,
  cwd = getWalletPackageRoot(),
): string {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath);
}

/**
 * Read persisted game master wallet, or `null` if the file does not exist.
 * @throws If the file exists but is invalid JSON or schema.
 */
export function readGameMasterWalletFile(
  absolutePath: string,
): WalletSnapshot | null {
  try {
    const raw = readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      throw new Error("root must be an object");
    }
    if (parsed.version !== FILE_VERSION) {
      throw new Error(`unsupported version: ${String(parsed.version)}`);
    }
    if (!("wallet" in parsed) || !isRecord(parsed.wallet)) {
      throw new Error("persisted file: missing wallet object");
    }
    return assertWalletSnapshot(parsed.wallet, "persisted file");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw e instanceof Error
      ? e
      : new Error(String(e));
  }
}

export function writeGameMasterWalletFile(
  absolutePath: string,
  wallet: WalletSnapshot,
): void {
  const body: PersistedGameMasterWalletFile = {
    version: FILE_VERSION,
    wallet,
  };
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
}
