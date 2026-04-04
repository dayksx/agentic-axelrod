# wallet

Server-side EVM wallet creation using [Dynamic](https://www.dynamic.xyz/)’s Node EVM client (`@dynamic-labs-wallet/node-evm`). This package authenticates with your Dynamic environment, runs MPC key generation for new accounts, and prints their addresses (or you can import the helpers from your own code).

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

## CLI: create wallets

The sample CLI creates several EVM wallets (default **6**), using a **2-of-2** threshold scheme and backing up to Dynamic’s client share service when enabled.

```bash
pnpm run create-wallets
```

For a production-style run (compile first, then execute with Node):

```bash
pnpm run create-wallets:build
```

Both scripts load `.env` via `node --env-file` / `tsx --env-file`.

## Library usage

Build so `dist/` is available:

```bash
pnpm run build
```

Other packages (or scripts) can import:

- `createAuthenticatedEvmClient` — builds an authenticated `DynamicEvmWalletClient`
- `createEvmWallets` — creates `count` wallets with options (threshold scheme, password, error handler, backup flags)
- Domain types and `ThresholdScheme` — see `src/domain/`

Entry point: `src/index.ts` (exports mirror `dist/` after build).

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm run build` | TypeScript compile to `dist/` |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run clean` | Remove `dist/` |
| `pnpm run create-wallets` | Run CLI with `tsx` + `.env` |
| `pnpm run create-wallets:build` | Run compiled CLI with `node` + `.env` |

## Layout

- `src/domain/` — shared types, thresholds, defaults
- `src/application/` — `createEvmWallets` orchestration
- `src/adapter/outbound/` — Dynamic authenticated client and related typings
- `src/adapter/inbound/cli/` — `create-wallets` entrypoint
