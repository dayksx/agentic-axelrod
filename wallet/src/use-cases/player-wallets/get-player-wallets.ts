import type { Chain } from "viem";
import {
  normalizePlayerName,
  readPlayerWalletsFile,
  resolvePlayerWalletsPath,
  writePlayerWalletsFile,
} from "../../adapters/outbound/fs/player-wallets-file.js";
import { createAuthenticatedEvmClient } from "../../adapters/outbound/dynamic/authenticated-client.js";
import {
  Wallet,
  type AuthenticatedEvmClientParams,
  type CreateEvmWalletsOptions,
  type WalletSnapshot,
} from "../../domain/index.js";
import { createEoa } from "../create-agents-wallets/create-eoa.js";
import { PLAYER_ENS_SUFFIX } from "../create-agents-wallets/index.js";

export type GetPlayerWalletsParams = {
  auth: AuthenticatedEvmClientParams;
  /** One entry per player; duplicates reuse the same persisted wallet. */
  playerNames: string[];
  createOptions?: CreateEvmWalletsOptions;
  rpcUrl: string;
  chain?: Chain;
  /**
   * JSON file for all player wallets. Default: `.player-wallets.json` under cwd.
   */
  stateFilePath?: string;
};

export type GetPlayerWalletsResult = {
  /** Same order and length as {@link GetPlayerWalletsParams.playerNames}. */
  wallets: Wallet[];
  /** Whether that row was created on this call (not loaded from disk). */
  created: boolean[];
  stateFilePath: string;
};

const DEFAULT_PLAYERS_FILE = ".player-wallets.json";

/**
 * Returns one wallet per requested name, creating missing EOAs via Dynamic and persisting by player name.
 */
export async function getPlayerWallets(
  params: GetPlayerWalletsParams,
): Promise<GetPlayerWalletsResult> {
  const { auth, playerNames, createOptions, rpcUrl, chain } = params;
  void rpcUrl;
  void chain;

  if (playerNames.length === 0) {
    return {
      wallets: [],
      created: [],
      stateFilePath: resolvePlayerWalletsPath(
        params.stateFilePath ?? DEFAULT_PLAYERS_FILE,
      ),
    };
  }

  const stateFilePath = resolvePlayerWalletsPath(
    params.stateFilePath ?? DEFAULT_PLAYERS_FILE,
  );

  const existing: Record<string, WalletSnapshot> =
    readPlayerWalletsFile(stateFilePath) ?? {};

  const normalized = playerNames.map((n) => normalizePlayerName(n));
  const uniqueNames = [...new Set(normalized)];

  const missing = uniqueNames.filter((n) => existing[n] === undefined);
  const newlyCreated = new Set<string>();

  if (missing.length > 0) {
    const client = await createAuthenticatedEvmClient(auth);
    const createdRows = await createEoa(client, missing.length, {
      password: undefined,
      ...createOptions,
    });
    if (createdRows.length !== missing.length) {
      throw new Error("getPlayerWallets: createEoa count mismatch");
    }
    for (let i = 0; i < missing.length; i++) {
      const name = missing[i]!;
      const row = createdRows[i]!;
      const w = Wallet.fromDynamicCreated(row);
      w.assignEnsName(`${name}${PLAYER_ENS_SUFFIX}`);
      const snap = w.toJSON();
      existing[name] = snap;
      newlyCreated.add(name);
    }
    writePlayerWalletsFile(stateFilePath, existing);
  }

  const wallets = normalized.map((name) => {
    const snap = existing[name];
    if (snap === undefined) {
      throw new Error(`getPlayerWallets: missing wallet for player "${name}"`);
    }
    return Wallet.fromSnapshot(snap);
  });

  const created = normalized.map((n) => newlyCreated.has(n));

  return { wallets, created, stateFilePath };
}
