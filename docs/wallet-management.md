# Wallet management

This document describes how **EVM wallets** are created, persisted, and used in this repo. Authoritative implementation detail and CLI reference live in the **`wallet/`** package — see [`wallet/README.md`](../wallet/README.md).

---

## Role in the hackathon

- **Steps 5–6** ([`hackathon-sequencing.md`](./hackathon-sequencing.md)): on-chain wallets, optional ENS-style names, funding and settlement flows.
- **Database**: `agents.wallet_address` and `agents.ens_name` are populated when the Game Master provisions wallets and writes agent rows (nullable until those steps).
- **Frontend**: does not implement wallet creation or signing; any UI that shows addresses reads them from the DB or from server-provided data.

---

## Stack (what the `wallet` package does)

| Piece | Technology |
| ----- | ----------- |
| Provider | [Dynamic](https://www.dynamic.xyz/) Node EVM client (`@dynamic-labs-wallet/node-evm`) |
| Account creation | MPC-backed EOAs (server API token + environment ID) |
| Smart accounts | ERC-7702 upgrade path (e.g. MetaMask Stateless7702) via `upgradeEoaToSa` |
| Persistence | JSON files on disk (paths overridable by env) |

Architecture is **hexagonal**: CLI / HTTP / `wallet/internal-api` adapters call **use cases**, which use **Dynamic** and **filesystem** adapters. See the diagram in [`wallet/README.md`](../wallet/README.md).

---

## Environment variables

Copy `wallet/.env.example` to `wallet/.env` and set:

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DYNAMIC_AUTH_TOKEN` | Yes | Dynamic server API token |
| `DYNAMIC_ENVIRONMENT_ID` | Yes | Dynamic environment ID |
| `WALLET_PASSWORD` | No | Optional password for wallet operations when supported |
| `RPC_URL` | No | HTTP RPC for chain operations (balances, txs). **ERC-7702 / set-code flows** in this repo are documented against **Base Sepolia** in `.env.example`; use an RPC that matches the chain you pass in code |
| `GAME_MASTER_WALLET_FILE` | No | Path to game master JSON (default: `.game-master-wallet.json` in cwd) |
| `PLAYER_WALLETS_FILE` | No | Path to player wallets JSON (default: `.player-wallets.json` in cwd) |

---

## On-disk state

| File (default) | Contents |
| ---------------- | -------- |
| `.game-master-wallet.json` | Single game master wallet snapshot (idempotent create) |
| `.player-wallets.json` | Map of **normalized player name** → wallet snapshot |

Treat these as **secrets**: they identify accounts that can move funds when combined with your Dynamic credentials.

---

## ENS-style names (in-app)

Constants live in the `wallet` domain layer:

| Role | Name pattern |
| ---- | ------------ |
| Game master | `axelrodtornament.eth` (`GAME_MASTER_ENS_NAME`) |
| Player | `{normalizedName}.axelrodtornament.eth` (suffix `PLAYER_ENS_SUFFIX`) |

These are **assigned on the `Wallet` aggregate** for display and DB (`ens_name`); on-chain ENS registration may be a separate step depending on deployment.

---

## Chains

- The HTTP helper `runCreateWalletsFromHttpBody` supports **`chainId`** values backed by `CHAINS_BY_ID` in the package (**Ethereum Sepolia** and **Base Sepolia**).
- Some use cases (e.g. ERC-7702 upgrade) **default to Base Sepolia** when chain is omitted — always pass **`chain` + `rpcUrl`** consistently for production paths.
- CLI help text refers to Sepolia for balance reporting in places; **set `RPC_URL` to the network you actually use.**

---

## CLI (unified entry)

From `wallet/`:

```bash
pnpm install
cp .env.example .env   # then edit
pnpm run wallet -- help
```

| Command | Purpose |
| ------- | ------- |
| `get-game-master-wallet` | Load or create game master once; persist state |
| `get-player-wallets <names...>` | Load or create **named** player wallets |
| `transfer-funds <from> <to> <amountEth>` | Native ETH transfer (`from`/`to`: player name or `gm` / `game-master`) |
| `collect-tournament-stake <names...>` | Each listed player sends **0.01 ETH** to the game master (sequential txs) |
| `distribute-tournament-rewards <names...>` | Game master sends **0.01 ETH** to each of **1–3** named recipients |

Shortcuts like `pnpm run get-player-wallets -- alice bob` are listed in [`wallet/README.md`](../wallet/README.md).

---

## Library surface

After `pnpm run build` in `wallet/`:

- **Package root** — `getGameMasterWallet`, `getPlayerWallets`, `transferFunds`, tournament use cases, `createEoa`, `upgradeEoaToSa`, delegation helpers, domain types. See [`wallet/README.md`](../wallet/README.md).
- **`wallet/internal-api`** — JSON-friendly **`WalletSnapshot`** returns (`getPlayersWallet`, `getGameMasterWallet`) for other packages.

There is **no HTTP server** in the package; call `runCreateWalletsFromHttpBody` from your own route handler if needed.

---

## Tournament economics (implemented constants)

| Constant | Value |
| -------- | ----- |
| Stake per player (`collect-tournament-stake`) | **0.01 ETH** (`TOURNAMENT_STAKING_PRICE_ETH` / `TOURNAMENT_STAKING_PRICE_WEI`) |
| Reward per recipient (`distribute-tournament-rewards`) | **0.01 ETH** each (same wei as one stake) |
| Max reward recipients | **3** (`MAX_TOURNAMENT_REWARD_RECIPIENTS`) |

---

## Delegation helpers

`delegateFundsToGameMaster`, `transferDelegatedFunds`, `buildAgentDelegation`, and `buildDelegatedTransfer` are **library-only** (not CLI). Use them when implementing **delegation to the game master’s smart wallet** as described in the product track.

---

## Alignment with the database

- **`createAgents`** ([`API requests to DB.md`](./API requests to DB.md)) accepts `wallet_address` and `ens_name`. Typical flow: provision wallets with the `wallet` package, map snapshots to agent rows, then insert.
- **`tournament_transactions`** stores `tx_hash` for `entry_fee`, `elimination`, and `prize`. The **`collect-tournament-stake`** flow corresponds to agents paying **to** the game master (stake); wire `recordTransaction(..., "entry_fee", ...)` to the actual transaction you record.

---

## Related docs

| Doc | Topic |
| --- | ----- |
| [`wallet/README.md`](../wallet/README.md) | Full README: HTTP body shape, exports, scripts |
| [`hackathon-sequencing.md`](./hackathon-sequencing.md) | When wallets / ENS appear in the build plan |
| [`Schema/ENTITY_DIAGRAM.md`](./Schema/ENTITY_DIAGRAM.md) | `agents.wallet_address`, `agents.ens_name` |
| [`API requests to DB.md`](./API requests to DB.md) | GM-only writes including agents and transactions |
