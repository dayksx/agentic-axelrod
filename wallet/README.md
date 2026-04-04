# wallet

Server-side EVM wallet creation using [Dynamic](https://www.dynamic.xyz/)’s Node EVM client (`@dynamic-labs-wallet/node-evm`). This package authenticates with your Dynamic environment, runs MPC key generation for new accounts, upgrades EOAs to ERC-7702 smart accounts (MetaMask Stateless7702), and exposes the result as domain snapshots (or you can import the helpers from your own code).

## Requirements

- Node.js 20+ (recommended)
- [pnpm](https://pnpm.io/) (see `packageManager` in `package.json`)

## Setup

1. From the repo root, install dependencies for this package:

   ```bash
   cd wallet && pnpm install
   ```

2. Copy the example env file and fill in values from the [Dynamic API / developer settings](https://app.dynamic.xyz/dashboard/developer/api):

   ```bash
   cp .env.example .env
   ```

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `DYNAMIC_AUTH_TOKEN` | Yes | Server API token for Dynamic |
   | `DYNAMIC_ENVIRONMENT_ID` | Yes | Your Dynamic environment ID |
   | `WALLET_PASSWORD` | No | Optional password passed to wallet creation when supported |

## Architecture

The package follows **hexagonal-style** layering: **inbound adapters** call **use cases**, which orchestrate **outbound adapters** and the **domain** model.

```mermaid
flowchart TB
  subgraph inbound["Inbound adapters"]
    CLI["CLI\nadapters/inbound/cli"]
    HTTP["HTTP helper\nadapters/inbound/http"]
    SDK["SDK barrel\nadapters/inbound/sdk"]
  end
  subgraph usecase["Use cases"]
    subgraph de["dynamic-eoa/"]
      CE["create-eoa.ts"]
      UP["upgrade-eoa-to-sa.ts"]
    end
    GPW["get-player-wallets/\ngetPlayerWallets"]
  end
  subgraph outbound["Outbound adapters"]
    DYN["Dynamic authenticated client\nadapters/outbound/dynamic"]
  end
  subgraph domain["Domain"]
    TYPES["Types: CreatedEvmWallet, options…"]
    WALLET["Wallet aggregate"]
  end
  CLI --> GPW
  HTTP --> GPW
  HTTP --> CE
  SDK --> usecase
  GPW --> CE
  CE --> UP
  CE --> DYN
  UP --> DYN
  CE --> TYPES
  UP --> WALLET
  UP --> TYPES
```

### Layers (what lives where)

| Layer | Path | Role |
|-------|------|------|
| **Inbound adapters** | `src/adapters/inbound/` | **CLI**, **HTTP** (`runCreateWalletsFromHttpBody`), and a small **SDK** re-export (`internal-api`) so other packages can import a stable surface. They parse env/JSON and call the same use case. |
| **Use cases** | `src/use-cases/` | **`get-player-wallets/`** — `getPlayerWallets` (load or create by name, persisted). **`dynamic-eoa/`** — `createEoa` and `upgradeEoaToSa` (Dynamic primitives). Barrel **`use-cases/index.ts`** re-exports. |
| **Outbound adapters** | `src/adapters/outbound/` | **`createAuthenticatedEvmClient`** and typings for Dynamic’s Node EVM client — how we talk to Dynamic, not business rules. |
| **Domain** | `src/domain/` | **Types** (`CreatedEvmWallet`, options, thresholds) and the **`Wallet`** aggregate: lifecycle flags and `toJSON()` for responses. |

### Why `createEoa` does not return a full `Wallet` yet

The **`Wallet`** class models **lifecycle after** an EOA exists: delegation signed, set-code tx, smart-account address, optional ENS. Dynamic returns a plain **`CreatedEvmWallet`** row from `createWalletAccount`; there is no `Wallet` instance until the ERC-7702 path starts.

So:

- **`createEoa`** returns **`CreatedEvmWallet[]`** (Dynamic’s shape).
- **`upgradeEoaToSa`** builds **`Wallet.fromDynamicCreated`**, then calls **`markDelegationSigned`**, **`recordSetCodeTransaction`**, and **`markSmartAccount`** as each step succeeds — that is where the aggregate is manipulated.

Use **`getPlayerWallets`** when you need names + persistence; it wraps **`createEoa`** and builds **`Wallet`** snapshots for storage.

## CLI

Unified entry: **`wallet-cli.ts`**. All scripts load `.env` via `node --env-file` / `tsx --env-file`.

```bash
# List commands and env vars
pnpm run wallet -- help
```

| Command | Purpose |
|--------|---------|
| `get-player-wallets` | Load or create player wallets by name (persists `.player-wallets.json`). |
| `create-game-master-wallet` | Placeholder: provision a game master EOA. Alias: `game-master`. |
| `delegate-funds-to-game-master` | Placeholder: agent → game master delegation. Alias: `delegate-funds`. |
| `transfer-delegated-funds` | Placeholder: game master → any address. Alias: `transfer-delegated`. |

Examples:

```bash
pnpm run wallet -- get-player-wallets alice bob
pnpm run wallet -- create-game-master-wallet
pnpm run wallet -- delegate-funds-to-game-master
pnpm run wallet -- transfer-delegated-funds
```

Shortcuts:

```bash
pnpm run get-player-wallets
pnpm run create-game-master-wallet
pnpm run create-game-master-wallet:build
```

Compiled binary for any subcommand:

```bash
pnpm run wallet:build -- get-player-wallets alice
```

## Library usage

Build so `dist/` is available:

```bash
pnpm run build
```

Other packages (or scripts) can import from the package root or from `wallet/internal-api` (see `package.json` `exports`):

- **`getPlayerWallets`** — load or create by player name (persisted state file)
- **`createEoa`** / **`upgradeEoaToSa`** — Dynamic primitives (`src/use-cases/dynamic-eoa/`)
- **`createAuthenticatedEvmClient`** — authenticated `DynamicEvmWalletClient`
- Domain **`Wallet`**, types, **`ThresholdScheme`** — see `src/domain/`

Entry point: `src/index.ts` (exports mirror `dist/` after build).

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm run build` | TypeScript compile to `dist/` |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run clean` | Remove `dist/` |
| `pnpm run wallet` | Unified CLI (`tsx` + `.env`); pass `-- help` or a subcommand |
| `pnpm run wallet:build` | Compiled unified CLI (`node` + `.env`) |
| `pnpm run get-player-wallets` | `tsx` CLI: `get-player-wallets` (pass player names after the script) |
| `pnpm run create-game-master-wallet` | Same as `wallet -- create-game-master-wallet` |
| `pnpm run create-game-master-wallet:build` | Compiled `create-game-master-wallet` only |
