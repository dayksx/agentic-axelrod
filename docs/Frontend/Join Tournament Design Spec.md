# Join Tournament Design Spec

> Covers the "Join a Tournament" feature: a form on the home page where a user enters an agent name and strategy prompt, connects their wallet, creates an agent wallet, pays the entry fee, and gets registered in the database.

---

## Overview

One new user-facing flow, composed of:

1. **Home page layout change** — the bottom section splits into two side-by-side panels: "Past Tournaments" (left) and "Join a Tournament" (right)
2. **Join form** — agent name, strategy prompt, entry fee notice, and a single multi-step button
3. **Multi-step button** — progresses through three states: Connect Wallet → Create Agent Wallet → Submit and Pay
4. **Database registration** — a new `users` table stores each submission

---

## 1. Home Page Layout Change

### Current

The lower section has a single centered column titled "Tournament Series" containing the tournament card list.

### New

Two panels side by side, each taking half the width:

```
┌─────────────────────────────────┬─────────────────────────────────┐
│                                 │                                 │
│       Past Tournaments          │      Join a Tournament          │
│                                 │                                 │
│  ┌───────────────────────┐      │   Agent Name   [___________]   │
│  │  Tournament #0        │      │                                 │
│  │  TitForTat wins       │      │   Strategy     [             ]  │
│  └───────────────────────┘      │   Prompt       [             ]  │
│         │ survivors             │                [_____________]  │
│  ┌───────────────────────┐      │                                 │
│  │  Tournament #1        │      │   Entry fee is 0.001            │
│  │  Deceiver wins        │      │   Sepolia ETH                   │
│  └───────────────────────┘      │                                 │
│         │ survivors             │   [ Connect Wallet ]            │
│  ┌───────────────────────┐      │                                 │
│  │  Tournament #2        │      │                                 │
│  └───────────────────────┘      │                                 │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

The "Past Tournaments" panel is the existing tournament card list with its survivor connectors, unchanged. "Tournament Series" is renamed to "Past Tournaments".

---

## 2. Join a Tournament Form

### Fields

| Field | Type | Constraints | Display |
|-------|------|-------------|---------|
| **Agent Name** | Single-line text input | Max 15 chars. Alphanumeric only (`a-z`, `A-Z`, `0-9`). No spaces, accents, or special characters. | Input with character counter `{n}/15` |
| **Strategy Prompt** | Multi-line textarea | Max 500 chars. Any characters allowed. | Textarea (4 rows) with character counter `{n}/500` |
| **Entry fee notice** | Static text | — | "Entry fee is 0.001 Sepolia ETH" |
| **Action button** | Button | Disabled when form is invalid | Changes text/color through the multi-step flow |

### Validation

- Agent Name: required, 1–15 chars, regex `/^[a-zA-Z0-9]+$/`
- Strategy Prompt: required, 1–500 chars
- The action button is disabled whenever either field fails validation
- Client-side validation only — the server route performs its own checks

---

## 3. Multi-Step Button Flow

The form has a single button whose label, behavior, and color change as the user progresses through the registration flow. The button stays in the same position and retains the same dimensions throughout.

### State Machine

```
                        ┌──────────────┐
                        │   CONNECT    │
                        │   WALLET     │
                        └──────┬───────┘
                               │ user authenticates via Dynamic
                               ▼
                        ┌──────────────┐
                        │ CREATE AGENT │  ← faded if balance < 0.001 ETH
                        │   WALLET     │
                        └──────┬───────┘
                               │ wallet API returns eoaAddress
                               ▼
                        ┌──────────────┐
                        │  SUBMIT AND  │  ← different color (green/cooperate)
                        │     PAY      │
                        └──────┬───────┘
                               │ tx receipt + DB insert
                               ▼
                        ┌──────────────┐
                        │   SUCCESS    │  completed state
                        └──────────────┘
```

### Step 1: Connect Wallet

| Property | Value |
|----------|-------|
| **Label** | "Connect Wallet" |
| **Style** | Default accent color (`bg-accent`) |
| **Enabled when** | Agent Name and Strategy Prompt both pass validation |
| **On click** | Opens the Dynamic.xyz login modal (`setShowAuthFlow(true)`) |
| **Transition** | When `primaryWallet` becomes truthy (user authenticated), advance to Step 2 |

The Dynamic modal shows **only EOA wallet options** (MetaMask, etc.). No social login, no email. This is configured via the `walletConnectors: [EthereumWalletConnectors]` setting in `DynamicRootProvider`, plus disabling social/email in the Dynamic dashboard.

### Step 2: Create Agent Wallet

| Property | Value |
|----------|-------|
| **Label** | "Create Agent Wallet" |
| **Style** | Default accent color (`bg-accent`) |
| **Enabled when** | User's connected wallet balance ≥ 0.001 Sepolia ETH |
| **Faded when** | Balance < 0.001 ETH (show tooltip or helper text: "Insufficient Sepolia ETH") |
| **On click** | Calls `POST /api/wallet/agents` with `{ "names": [agentName] }` |
| **Loading state** | Button shows "Creating…" and is disabled |
| **Transition** | On success response (wallet `eoaAddress` received), advance to Step 3 |
| **Error** | If the wallet service is unreachable or returns an error, show error text below the button. Button returns to clickable state. |

**Balance check:** After the user connects, fetch their Sepolia ETH balance via JSON-RPC `eth_getBalance` against `NEXT_PUBLIC_SEPOLIA_RPC_URL` using `primaryWallet.address`. Display the balance near the entry fee notice for transparency (e.g. "Your balance: 0.05 ETH"). If below 0.001, the button is faded/disabled.

### Step 3: Submit and Pay

| Property | Value |
|----------|-------|
| **Label** | "Submit and Pay" |
| **Style** | Green/cooperate color (`bg-cooperate`) — visually distinct as the final action |
| **Enabled when** | Always (we already verified balance in Step 2) |
| **On click** | Two sequential operations (see below) |
| **Loading state** | "Confirm in wallet…" while awaiting user signature, then "Submitting…" while DB insert runs |

**On click, two sequential operations:**

1. **Send 0.001 Sepolia ETH** from the user's connected wallet to the agent wallet address (the `eoaAddress` returned in Step 2). Uses `primaryWallet.switchNetwork(SEPOLIA_CHAIN_ID)` then `primaryWallet.sendBalance({ amount: "0.001", toAddress })`. Wait for the tx hash.

2. **Insert user row** by calling `POST /api/join-tournament` with:
   ```json
   {
     "agentName": "alice",
     "strategyPrompt": "Always cooperate unless betrayed twice",
     "humanWallet": "0xUserAddress...",
     "agentWallet": "0xAgentEoaAddress...",
     "txHash": "0xTransactionHash..."
   }
   ```
   The API route creates a server-side Supabase client (using `SUPABASE_SECRET_KEY`) and inserts into the `users` table.

**Error handling:**
- If the user rejects the transaction in their wallet → show "Transaction cancelled", button returns to clickable
- If the transaction fails on-chain → show error, button returns to clickable
- If the DB insert fails → show error (the ETH has already been sent; display the tx hash so it's not lost)

### Step 4: Success

| Property | Value |
|----------|-------|
| **Display** | Success message replaces the form (completed state) |
| **Content** | "Your agent **{agentName}** has been registered!" with a summary showing agent name, strategy prompt (truncated), agent wallet address (truncated + Etherscan link), and tx hash (truncated + Etherscan link) |
| **Form state** | Completed — form inputs and button are replaced by the success panel. No reset. |

---

## 4. Users Table

A standalone table, **not connected** to other tables via foreign keys.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Auto-incrementing ID |
| `agent_name` | `varchar(15)` | NOT NULL | Agent name entered by the user |
| `strategy_prompt` | `text` | NOT NULL | Strategy prompt entered by the user |
| `human_wallet` | `text` | NOT NULL | The user's connected EOA address |
| `agent_wallet` | `text` | NOT NULL | The agent EOA address from the wallet API |
| `tx_hash` | `text` | NOT NULL | Entry fee payment transaction hash |
| `reserved_date` | `timestamptz` | NULLABLE | Set later by colleague's backend process |
| `tournament_date` | `timestamptz` | NULLABLE | Set later by colleague's backend process |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Row creation timestamp |

**Notes:**
- No unique constraint on `agent_name` — multiple users can register the same name (your colleague's process handles deduplication/scheduling)
- No foreign key to `agents` table — the `users` table is a standalone intake form; the colleague's process reads from it later
- `reserved_date` and `tournament_date` are null on insert; updated by downstream processes

### SQL

```sql
CREATE TABLE users (
  id            serial        PRIMARY KEY,
  agent_name    varchar(15)   NOT NULL,
  strategy_prompt text        NOT NULL,
  human_wallet  text          NOT NULL,
  agent_wallet  text          NOT NULL,
  tx_hash       text          NOT NULL,
  reserved_date timestamptz,
  tournament_date timestamptz,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
```

---

## 5. API Routes

### `POST /api/wallet/agents` (existing)

Proxies to the wallet service at `WALLET_SERVICE_URL` (default `http://127.0.0.1:3210`). Already built and working at `ui/src/app/api/wallet/agents/route.ts`.

**Request:** `{ "names": ["alice"] }`
**Response:** `{ "wallets": [{ "eoaAddress": "0x...", "ensName": "alice.axelrodtornament.eth", ... }], "created": [true], "stateFilePath": "..." }`

### `POST /api/join-tournament` (new)

Server-side route that inserts a row into the `users` table using the Supabase service-role key.

**Request:**
```json
{
  "agentName": "alice",
  "strategyPrompt": "Always cooperate unless betrayed twice",
  "humanWallet": "0x1234...abcd",
  "agentWallet": "0x5678...efgh",
  "txHash": "0xabcd...1234"
}
```

**Validation:**
- `agentName`: required, 1–15 chars, alphanumeric only
- `strategyPrompt`: required, 1–500 chars
- `humanWallet`: required, valid Ethereum address format (`/^0x[a-fA-F0-9]{40}$/`)
- `agentWallet`: required, valid Ethereum address format
- `txHash`: required, valid tx hash format (`/^0x[a-fA-F0-9]{64}$/`)

**Success response:** `{ "ok": true, "user": { id, agent_name, ... } }`
**Error responses:** 400 (validation), 500 (DB error), 503 (Supabase not configured)

---

## 6. Environment Variables

### New (ui/.env)

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | Client | Dynamic SDK environment (already in use by `DynamicRootProvider`) |
| `WALLET_SERVICE_URL` | Server | Wallet HTTP server URL (already in use by `/api/wallet/agents`). Default: `http://127.0.0.1:3210` |
| `SUPABASE_SECRET_KEY` | Server | Supabase service-role key for write access |

### Already present (no changes)

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase anon key (read-only) |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Client | Sepolia RPC for balance checks |

---

## 7. Existing Infrastructure (Already Built)

These components/routes exist from the wallet-test work and are reused as-is or with minor adaptation:

| Piece | Path | Reuse |
|-------|------|-------|
| `DynamicRootProvider` | `ui/src/components/DynamicRootProvider.tsx` | As-is — already wraps root layout, configured for EOA-only + Sepolia |
| `PreferWalletLoginTab` | `ui/src/components/PreferWalletLoginTab.tsx` | As-is — forces wallet login tab over email |
| `dynamicSepoliaNetwork` | `ui/src/lib/dynamicSepoliaNetwork.ts` | As-is — ensures Sepolia in Dynamic's network list |
| `chains` | `ui/src/lib/chains.ts` | As-is — `SEPOLIA_CHAIN_ID` constant |
| Wallet proxy route | `ui/src/app/api/wallet/agents/route.ts` | As-is — proxies to wallet service |
| `FundPlayerEthButton` | `ui/src/components/FundPlayerEthButton.tsx` | Pattern reuse — `sendBalance` + `switchNetwork` logic is extracted into the new form |

---

## 8. Constraints

- **Desktop only.** No mobile responsive layout (consistent with existing spec).
- **Sepolia only.** All transactions, balance checks, and Etherscan links target Sepolia testnet.
- **No duplicate checks against `agents` table.** A user can register an agent name that already exists in the game's `agents` table.
- **No authentication persistence.** If the user refreshes the page mid-flow, they restart from Step 1 (Connect Wallet). The Dynamic session may persist depending on SDK config, but our form state resets.
- **Single agent per submission.** The form registers one agent at a time. A user can submit multiple times.
- **Entry fee is 0.001 Sepolia ETH.** This is distinct from the tournament staking price (0.01 ETH) documented in `wallet-management.md`.
- **Agent wallet is server-managed.** The agent wallet is an MPC EOA created by the wallet service via Dynamic's server SDK. The user never holds keys to this wallet.
- **No refunds.** Once the entry fee is sent, there is no undo. The success screen shows the tx hash for the user's records.
