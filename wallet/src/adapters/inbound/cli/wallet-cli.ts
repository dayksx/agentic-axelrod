/**
 * `pnpm run wallet -- create-agents-wallets bob alice robert …`
 * → each wallet gets `ensName` = `bob.axelrodtornament.eth`, etc.
 */
import { createPublicClient, formatEther, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { createAgentsWallets } from "../../../use-cases/create-agents-wallets/index.js";
import { getGameMasterWallet } from "../../../use-cases/create-game-master-wallet/index.js";
import { getPlayerWallets } from "../../../use-cases/player-wallets/index.js";
import { normalizePlayerName } from "../../../adapters/outbound/fs/player-wallets-file.js";
import { transferFunds } from "../../../use-cases/transfer-funds/index.js";
import {
  DEFAULT_WALLET_COUNT,
  GAME_MASTER_ENS_NAME,
  ThresholdScheme,
  type Wallet,
} from "../../../domain/index.js";

function userArgs(): string[] {
  const argv = process.argv;
  const scriptRe = /wallet-cli\.(t|j)s$/;
  const idx = argv.findIndex((a) => scriptRe.test(a));
  let out = idx >= 0 ? argv.slice(idx + 1) : argv.slice(2);
  if (out[0] === "--") {
    out = out.slice(1);
  }
  return out;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v.trim() === "" ? undefined : v.trim();
}

const REPORT_WIDTH = 64;

/** Respect https://no-color.org/ — disable ANSI when NO_COLOR is set and non-empty. */
function noColor(): boolean {
  const v = process.env.NO_COLOR;
  return v !== undefined && v !== "";
}

function bold(s: string): string {
  if (noColor()) {
    return s;
  }
  return `\x1b[1m${s}\x1b[0m`;
}

function dim(s: string): string {
  if (noColor()) {
    return s;
  }
  return `\x1b[2m${s}\x1b[0m`;
}

/** Text in parentheses, styled as light gray (secondary detail). */
function parenNote(inner: string): string {
  return dim(`(${inner})`);
}

function hr(ch = "─"): string {
  return ch.repeat(REPORT_WIDTH);
}

/** Shorten long hex for terminal readability (full value still reconstructable from tooling if needed). */
function abbreviateHex(hex: string, head = 12, tail = 8): string {
  if (hex.length <= head + tail + 1) {
    return hex;
  }
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

function yesNo(v: boolean): string {
  return v ? "yes ✅" : "no ⚠️";
}

function statusChip(label: string, ok: boolean, pendingLabel = "pending"): string {
  return ok ? `${label}: ✅` : `${label}: ⏳ ${pendingLabel}`;
}

function row(icon: string, name: string, value: string): void {
  const pad = 16;
  const left = name.length >= pad ? `${name} ` : `${name.padEnd(pad)}`;
  console.log(`  ${icon}  ${left}${value}`);
}

/** Native balance on `chain` (default Sepolia) for the EOA backing this wallet. */
async function fetchEoaEthBalanceLine(
  rpcUrl: string,
  eoaAddress: string,
): Promise<string> {
  try {
    const client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const wei = await client.getBalance({
      address: eoaAddress as `0x${string}`,
    });
    return `${formatEther(wei)} ETH`;
  } catch {
    return `— ${parenNote("balance unavailable")}`;
  }
}

function printWalletReport(
  w: Wallet,
  titleLine: string,
  eoaEthBalanceLine?: string,
): void {
  console.log(hr());
  console.log(`  ${bold(titleLine)}`);
  console.log(hr());

  row("🔑", "EOA", w.eoaAddress);
  if (eoaEthBalanceLine !== undefined) {
    row("💰", "ETH (EOA)", eoaEthBalanceLine);
  }
  row(
    "⚡",
    "Smart account",
    w.saAddress ?? parenNote("pending — EIP-7702 upgrade not run yet"),
  );
  if (w.ensName !== undefined) {
    row("🌐", "ENS", w.ensName);
  }
  row("🧩", "Dynamic wallet", w.dynamicWalletId);

  console.log("");
  row(
    "📊",
    "Pipeline",
    [
      statusChip("EOA", w.isEoaCreated),
      w.isDelegationSigned
        ? "delegation: ✅"
        : "delegation: ⏳ pending",
      statusChip("SA", w.isSaSet),
      statusChip("ENS", w.isEnsAssigned, "unassigned"),
    ].join("  ·  "),
  );
  row("🔐", "Key share backup", yesNo(w.keySharesBackedUpToDynamic));
  row(
    "📝",
    "Set-code tx",
    w.setCodeTransactionHash ?? `— ${parenNote("none yet")}`,
  );
  row("🔏", "Public key", abbreviateHex(w.publicKeyHex));
  console.log("");
}

function usage(): void {
  console.log(`wallet CLI

  pnpm run wallet -- get-game-master-wallet
  pnpm run wallet -- create-game-master-wallet
    Load or create the game master once (EOA + ENS ${GAME_MASTER_ENS_NAME}), saves
    .game-master-wallet.json in cwd. Re-runs only print saved data.

  pnpm run wallet -- get-player-wallets <player1> [player2 …]
    Load or create wallets keyed by player name; persists .player-wallets.json.

  pnpm run wallet -- transfer-funds <from> <to> <amountEth>
    Native ETH transfer. <from> and <to> are either a player name or
    "gm" / "game-master" for the game master wallet.

  pnpm run wallet -- create-agents-wallets [player1 player2 …]
    Lower-level: mint EOAs without the player-wallets store (or use names + ENS only).
    With no names: WALLET_COUNT (default ${DEFAULT_WALLET_COUNT}), no ENS.

  Env: DYNAMIC_AUTH_TOKEN, DYNAMIC_ENVIRONMENT_ID
  Optional: WALLET_PASSWORD, RPC_URL (Sepolia; ETH balances in reports), GAME_MASTER_WALLET_FILE, PLAYER_WALLETS_FILE
`);
}

type WalletEndpoint =
  | { kind: "gm" }
  | { kind: "player"; name: string };

function parseWalletEndpoint(s: string): WalletEndpoint {
  const t = s.trim();
  const low = t.toLowerCase();
  if (low === "gm" || low === "game-master" || low === "gamemaster") {
    return { kind: "gm" };
  }
  if (t === "") {
    throw new Error(
      "wallet endpoint must be non-empty (player name or gm / game-master)",
    );
  }
  return { kind: "player", name: t };
}

async function cmdGameMasterWallet(invokedAs: string): Promise<void> {
  console.log("");
  console.log(hr("═"));
  console.log(`  ${bold(invokedAs)}  ·  ENS ${GAME_MASTER_ENS_NAME}  ✨`);
  console.log(hr("═"));
  console.log("");

  const authToken = requireEnv("DYNAMIC_AUTH_TOKEN");
  const environmentId = requireEnv("DYNAMIC_ENVIRONMENT_ID");
  const password = optionalEnv("WALLET_PASSWORD");
  const stateFilePath = optionalEnv("GAME_MASTER_WALLET_FILE");
  const rpcUrl = optionalEnv("RPC_URL") ?? sepolia.rpcUrls.default.http[0];

  console.log(
    dim("  Ensuring game master wallet (load from disk or create once)…"),
  );
  console.log("");

  const { wallet, created, stateFilePath: resolvedPath } =
    await getGameMasterWallet({
      auth: { authToken, environmentId },
      createOptions: {
        password,
        thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
        backUpToClientShareService: true,
      },
      ...(stateFilePath !== undefined ? { stateFilePath } : {}),
    });

  console.log(
    created
      ? dim(`  Created new wallet and saved: ${resolvedPath}`)
      : dim(`  Using existing wallet from: ${resolvedPath}`),
  );
  console.log("");

  const titleLine = `👑  Game master  ·  ${wallet.ensName ?? GAME_MASTER_ENS_NAME}`;
  const gmEthLine = await fetchEoaEthBalanceLine(rpcUrl, wallet.eoaAddress);
  printWalletReport(wallet, titleLine, gmEthLine);

  console.log(hr("═"));
  console.log(
    `  ${bold("Done.")}  ${created ? "Game master created." : "Game master unchanged (loaded from disk)."}  🎉`,
  );
  console.log(hr("═"));
  console.log("");
}

async function cmdGetPlayerWallets(labels: string[]): Promise<void> {
  const clean = labels.filter((s) => s.length > 0 && s !== "--");
  if (clean.length === 0) {
    throw new Error(
      "get-player-wallets requires at least one player name, e.g. pnpm run wallet -- get-player-wallets alice bob",
    );
  }

  console.log("");
  console.log(hr("═"));
  console.log(
    `  ${bold("get-player-wallets")}  ·  ${clean.length} player${clean.length === 1 ? "" : "s"}  ✨`,
  );
  console.log(hr("═"));
  console.log("");

  const authToken = requireEnv("DYNAMIC_AUTH_TOKEN");
  const environmentId = requireEnv("DYNAMIC_ENVIRONMENT_ID");
  const password = optionalEnv("WALLET_PASSWORD");
  const rpcUrl = optionalEnv("RPC_URL") ?? sepolia.rpcUrls.default.http[0];
  const playerStateFile = optionalEnv("PLAYER_WALLETS_FILE");

  console.log(dim("  Loading or creating player wallets (persisted by name)…"));
  console.log("");

  const { wallets, created, stateFilePath: resolvedPlayers } =
    await getPlayerWallets({
      auth: { authToken, environmentId },
      playerNames: clean,
      createOptions: {
        password,
        thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
        backUpToClientShareService: true,
      },
      rpcUrl,
      chain: sepolia,
      ...(playerStateFile !== undefined ? { stateFilePath: playerStateFile } : {}),
    });

  console.log(dim(`  State file: ${resolvedPlayers}`));
  console.log("");

  const playerEthLines = await Promise.all(
    wallets.map((w) => fetchEoaEthBalanceLine(rpcUrl, w.eoaAddress)),
  );

  wallets.forEach((w, index) => {
    const label = clean[index] ?? `#${index + 1}`;
    const tag = created[index] ? `${label} · new` : `${label} · loaded`;
    const titleLine = `🎯  ${tag}  ·  ${w.ensName ?? label}`;
    printWalletReport(w, titleLine, playerEthLines[index]!);
  });

  console.log(hr("═"));
  console.log(
    `  ${bold("Done.")}  ${wallets.length} wallet${wallets.length === 1 ? "" : "s"} ready.  🎉`,
  );
  console.log(hr("═"));
  console.log("");
}

async function cmdTransferFunds(args: string[]): Promise<void> {
  const clean = args.filter((s) => s.length > 0 && s !== "--");
  if (clean.length !== 3) {
    throw new Error(
      "transfer-funds requires exactly three arguments: <from> <to> <amountEth>  (e.g. gm alice 0.01)",
    );
  }

  const [fromS, toS, amountEth] = clean as [string, string, string];
  const fromRef = parseWalletEndpoint(fromS);
  const toRef = parseWalletEndpoint(toS);
  let valueWei: bigint;
  try {
    valueWei = parseEther(amountEth);
  } catch {
    throw new Error(
      `Invalid amount: ${amountEth} (use a decimal ETH string, e.g. 0.1)`,
    );
  }

  console.log("");
  console.log(hr("═"));
  console.log(`  ${bold("transfer-funds")}  ·  ${amountEth} ETH  ✨`);
  console.log(hr("═"));
  console.log("");

  const authToken = requireEnv("DYNAMIC_AUTH_TOKEN");
  const environmentId = requireEnv("DYNAMIC_ENVIRONMENT_ID");
  const password = optionalEnv("WALLET_PASSWORD");
  const rpcUrl = optionalEnv("RPC_URL") ?? sepolia.rpcUrls.default.http[0];
  const gmFile = optionalEnv("GAME_MASTER_WALLET_FILE");
  const playerStateFile = optionalEnv("PLAYER_WALLETS_FILE");

  const auth = { authToken, environmentId };
  const createOpts = {
    password,
    thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
    backUpToClientShareService: true,
  };

  const needGm = fromRef.kind === "gm" || toRef.kind === "gm";
  const playerNamesSet = new Set<string>();
  if (fromRef.kind === "player") {
    playerNamesSet.add(fromRef.name);
  }
  if (toRef.kind === "player") {
    playerNamesSet.add(toRef.name);
  }
  const playerNames = [...playerNamesSet];

  let gmWallet: Wallet | undefined;
  if (needGm) {
    const r = await getGameMasterWallet({
      auth,
      createOptions: createOpts,
      ...(gmFile !== undefined ? { stateFilePath: gmFile } : {}),
    });
    gmWallet = r.wallet;
  }

  const playerMap = new Map<string, Wallet>();
  if (playerNames.length > 0) {
    const { wallets } = await getPlayerWallets({
      auth,
      playerNames,
      createOptions: createOpts,
      rpcUrl,
      chain: sepolia,
      ...(playerStateFile !== undefined ? { stateFilePath: playerStateFile } : {}),
    });
    playerNames.forEach((name, i) => {
      const n = normalizePlayerName(name);
      const w = wallets[i];
      if (w === undefined) {
        throw new Error(`transfer-funds: missing wallet for ${name}`);
      }
      playerMap.set(n, w);
    });
  }

  function walletFor(ref: WalletEndpoint): Wallet {
    if (ref.kind === "gm") {
      if (gmWallet === undefined) {
        throw new Error("transfer-funds: internal error (game master not loaded)");
      }
      return gmWallet;
    }
    const w = playerMap.get(normalizePlayerName(ref.name));
    if (w === undefined) {
      throw new Error(`transfer-funds: missing wallet for player "${ref.name}"`);
    }
    return w;
  }

  const fromW = walletFor(fromRef);
  const toW = walletFor(toRef);

  console.log(
    dim(
      `  From ${fromRef.kind === "gm" ? "game master" : fromRef.name} → ${toRef.kind === "gm" ? "game master" : toRef.name}`,
    ),
  );
  console.log(dim(`  RPC ${rpcUrl}`));
  console.log("");

  const { transactionHash } = await transferFunds({
    auth,
    from: fromW.toJSON(),
    to: toW.toJSON(),
    valueWei,
    chain: sepolia,
    rpcUrl,
    ...(password !== undefined ? { password } : {}),
  });

  console.log(hr("═"));
  console.log(`  ${bold("Submitted.")}  tx ${transactionHash}`);
  console.log(hr("═"));
  console.log("");
}

async function cmdCreateAgentsWallets(labels: string[]): Promise<void> {
  /** `pnpm`/npm `--` separator must not be counted as a player name. */
  const clean = labels.filter((s) => s.length > 0 && s !== "--");
  const summary =
    clean.length > 0
      ? `${clean.length} player${clean.length === 1 ? "" : "s"}`
      : `default count from env (${DEFAULT_WALLET_COUNT})`;
  console.log("");
  console.log(hr("═"));
  console.log(`  ${bold("create-agents-wallets")}  ·  ${summary}  ✨`);
  console.log(hr("═"));
  console.log("");

  const authToken = requireEnv("DYNAMIC_AUTH_TOKEN");
  const environmentId = requireEnv("DYNAMIC_ENVIRONMENT_ID");
  const password = optionalEnv("WALLET_PASSWORD");
  const rpcUrl = optionalEnv("RPC_URL") ?? sepolia.rpcUrls.default.http[0];

  const count =
    clean.length > 0
      ? clean.length
      : (() => {
          const c = optionalEnv("WALLET_COUNT");
          return c !== undefined
            ? Number.parseInt(c, 10)
            : DEFAULT_WALLET_COUNT;
        })();

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("WALLET_COUNT must be a positive integer");
  }

  console.log(
    dim("  Creating wallets with Dynamic… (may take a minute)"),
  );
  console.log("");

  const smartAccounts = await createAgentsWallets({
    auth: { authToken, environmentId },
    count,
    createOptions: {
      password,
      thresholdSignatureScheme: ThresholdScheme.TWO_OF_TWO,
      backUpToClientShareService: true,
    },
    rpcUrl,
    chain: sepolia,
    ...(clean.length > 0 ? { playerEnsLabels: clean } : {}),
  });

  const agentsEthLines = await Promise.all(
    smartAccounts.map((w) => fetchEoaEthBalanceLine(rpcUrl, w.eoaAddress)),
  );

  smartAccounts.forEach((w, index) => {
    const n = index + 1;
    const playerTag =
      clean[index] !== undefined && w.ensName !== undefined
        ? `${clean[index]} · ${w.ensName}`
        : clean[index] !== undefined
          ? `player: ${clean[index]}`
          : `wallet #${n}`;

    const titleLine = `🎯  Player ${n}  ·  ${playerTag}`;
    printWalletReport(w, titleLine, agentsEthLines[index]!);
  });

  console.log(hr("═"));
  console.log(
    `  ${bold("Done.")}  ${smartAccounts.length} wallet${smartAccounts.length === 1 ? "" : "s"} ready.  🎉`,
  );
  console.log(
    dim(
      "  Tip: fund EOAs on Sepolia before smart-account / set-code steps in your demo.",
    ),
  );
  console.log(hr("═"));
  console.log("");
}

async function main(): Promise<void> {
  const parts = userArgs();
  const cmd = parts[0] ?? "help";

  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      usage();
      return;
    case "get-game-master-wallet":
    case "create-game-master-wallet":
    case "game-master-wallet":
    case "game-master":
      await cmdGameMasterWallet(cmd);
      return;
    case "get-player-wallets":
    case "player-wallets":
      await cmdGetPlayerWallets(parts.slice(1));
      return;
    case "transfer-funds":
      await cmdTransferFunds(parts.slice(1));
      return;
    case "create-agents-wallets":
    case "agents-wallets":
      await cmdCreateAgentsWallets(parts.slice(1));
      return;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      usage();
      process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
