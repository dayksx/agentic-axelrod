import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type { WalletSnapshot } from "../../../domain/index.js";
import { getWalletPackageRoot } from "../../../wallet-package-root.js";

const FILE_VERSION = 1;

export type PersistedPlayerWalletsFile = {
  version: typeof FILE_VERSION;
  /** Keys are normalized player names (trimmed, lowercased). */
  players: Record<string, WalletSnapshot>;
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

/** Trim + lowercase so `"Alice"` and `"alice"` map to the same persisted wallet. */
export function normalizePlayerName(name: string): string {
  const t = name.trim();
  if (t === "") {
    throw new Error("player name must be non-empty");
  }
  return t.toLowerCase();
}

/** Resolve path relative to the wallet package root when not absolute. */
export function resolvePlayerWalletsPath(
  filePath: string,
  cwd = getWalletPackageRoot(),
): string {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath);
}

/**
 * Read persisted player wallets, or `null` if the file does not exist.
 * @throws If the file exists but is invalid JSON or schema.
 */
export function readPlayerWalletsFile(
  absolutePath: string,
): Record<string, WalletSnapshot> | null {
  try {
    const raw = readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      throw new Error("root must be an object");
    }
    if (parsed.version !== FILE_VERSION) {
      throw new Error(`unsupported version: ${String(parsed.version)}`);
    }
    if (!("players" in parsed) || !isRecord(parsed.players)) {
      throw new Error("persisted file: missing players object");
    }
    const out: Record<string, WalletSnapshot> = {};
    for (const [k, v] of Object.entries(parsed.players)) {
      out[k] = assertWalletSnapshot(v, `players.${k}`);
    }
    return out;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export function writePlayerWalletsFile(
  absolutePath: string,
  players: Record<string, WalletSnapshot>,
): void {
  const body: PersistedPlayerWalletsFile = {
    version: FILE_VERSION,
    players,
  };
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
}
