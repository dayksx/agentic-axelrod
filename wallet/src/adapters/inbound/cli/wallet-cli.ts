/**
 * `pnpm run wallet -- create-agents-wallets bob alice robert …`
 * → each wallet gets `ensName` = `bob.axelrodtornament.eth`, etc.
 */
import { sepolia } from "viem/chains";
import { createAgentsWallets } from "../../../use-cases/create-agents-wallets/index.js";
import { ensureGameMasterWallet } from "../../../use-cases/create-game-master-wallet/index.js";
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

function printWalletReport(w: Wallet, titleLine: string): void {
  console.log(hr());
  console.log(`  ${bold(titleLine)}`);
  console.log(hr());

  row("🔑", "EOA", w.eoaAddress);
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

  pnpm run wallet -- create-game-master-wallet
    Creates the game master once (EOA + ENS ${GAME_MASTER_ENS_NAME}), saves
    .game-master-wallet.json in cwd. Re-runs only print saved data.

  pnpm run wallet -- create-agents-wallets [player1 player2 …]
    With player names: one wallet per name, ensName "<name>.axelrodtornament.eth".
    With no names: WALLET_COUNT (default ${DEFAULT_WALLET_COUNT}), no ENS.

  Env: DYNAMIC_AUTH_TOKEN, DYNAMIC_ENVIRONMENT_ID
  Optional: WALLET_PASSWORD, RPC_URL, GAME_MASTER_WALLET_FILE
`);
}

async function cmdCreateGameMasterWallet(): Promise<void> {
  console.log("");
  console.log(hr("═"));
  console.log(`  ${bold("create-game-master-wallet")}  ·  ENS ${GAME_MASTER_ENS_NAME}  ✨`);
  console.log(hr("═"));
  console.log("");

  const authToken = requireEnv("DYNAMIC_AUTH_TOKEN");
  const environmentId = requireEnv("DYNAMIC_ENVIRONMENT_ID");
  const password = optionalEnv("WALLET_PASSWORD");
  const stateFilePath = optionalEnv("GAME_MASTER_WALLET_FILE");

  console.log(
    dim("  Ensuring game master wallet (load from disk or create once)…"),
  );
  console.log("");

  const { wallet, created, stateFilePath: resolvedPath } =
    await ensureGameMasterWallet({
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
  printWalletReport(wallet, titleLine);

  console.log(hr("═"));
  console.log(
    `  ${bold("Done.")}  ${created ? "Game master created." : "Game master unchanged (loaded from disk)."}  🎉`,
  );
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

  smartAccounts.forEach((w, index) => {
    const n = index + 1;
    const playerTag =
      clean[index] !== undefined && w.ensName !== undefined
        ? `${clean[index]} · ${w.ensName}`
        : clean[index] !== undefined
          ? `player: ${clean[index]}`
          : `wallet #${n}`;

    const titleLine = `🎯  Player ${n}  ·  ${playerTag}`;
    printWalletReport(w, titleLine);
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
    case "create-game-master-wallet":
    case "game-master-wallet":
    case "game-master":
      await cmdCreateGameMasterWallet();
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
