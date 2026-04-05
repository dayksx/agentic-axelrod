# Join Tournament Implementation Strategy

> Reference: `Join Tournament Design Spec.md` for the full design. This document covers *how* to build it.
>
> Prerequisite: The onchain features (Agent Modal, Transaction Panels) must be built and working first. This strategy extends the existing codebase.

---

## Scope

One feature, split into 5 implementation phases:

1. **Database & types** — create the `users` table, add types, update `.env` files
2. **Server-side API route** — `POST /api/join-tournament` for writing to the users table
3. **Home page layout** — split the bottom section into two columns
4. **Join Tournament form component** — the multi-step form with button state machine
5. **Glue** — balance check utility, cleanup of wallet-test artifacts

---

## Existing Code Reuse Map

Before building, note what already exists and works from the wallet-test spike:

| What | Where | How we use it |
|------|-------|---------------|
| Dynamic context provider | `components/DynamicRootProvider.tsx` | **As-is.** Already wraps root layout. Configured with `EthereumWalletConnectors` (EOA only) + Sepolia preferred chain. |
| Wallet login tab preference | `components/PreferWalletLoginTab.tsx` | **As-is.** Already rendered inside `DynamicRootProvider`. |
| Sepolia network merge | `lib/dynamicSepoliaNetwork.ts` | **As-is.** Already ensures Sepolia is in Dynamic's network list. |
| Chain constants | `lib/chains.ts` | **As-is.** `SEPOLIA_CHAIN_ID` and `SEPOLIA_EIP155`. |
| Wallet service proxy | `app/api/wallet/agents/route.ts` | **As-is.** Proxies `POST /agents` to the wallet HTTP server. Uses `WALLET_SERVICE_URL` env var with default `http://127.0.0.1:3210`. |
| Send ETH pattern | `components/FundPlayerEthButton.tsx` | **Pattern extraction.** The `switchNetwork` → `sendBalance` flow is reused inside the new form component. We do NOT import `FundPlayerEthButton` directly — the logic is inlined into the form's Step 3 handler. |
| Register player route | `app/api/register-player/route.ts` | **Pattern reference.** The server-side Supabase client pattern (createClient with `SUPABASE_SECRET_KEY`) is reused. The route itself is NOT reused — we create a new `/api/join-tournament` route that writes to the `users` table instead of `agents`. |

---

## Phase 1 — Database & Types

**Goal:** The `users` table exists in Supabase. TypeScript types are defined. Environment variables are documented.

### Step 1: Create the `users` Table

Run this SQL in the Supabase SQL editor (or create a migration file in `supabase/migrations/`):

```sql
CREATE TABLE users (
  id              serial        PRIMARY KEY,
  agent_name      varchar(15)   NOT NULL,
  strategy_prompt text          NOT NULL,
  human_wallet    text          NOT NULL,
  agent_wallet    text          NOT NULL,
  tx_hash         text          NOT NULL,
  reserved_date   timestamptz,
  tournament_date timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);
```

No RLS policies needed — the table is accessed exclusively via the service-role key from the server-side API route. The anon key cannot read or write this table.

### Step 2: Add TypeScript Types

**`ui/src/types/database.ts`:**

Add the `users` table inside the `Tables` block of the `Database` interface:

```typescript
users: {
  Row: {
    id: number;
    agent_name: string;
    strategy_prompt: string;
    human_wallet: string;
    agent_wallet: string;
    tx_hash: string;
    reserved_date: string | null;
    tournament_date: string | null;
    created_at: string;
  };
  Insert: {
    id?: number;
    agent_name: string;
    strategy_prompt: string;
    human_wallet: string;
    agent_wallet: string;
    tx_hash: string;
    reserved_date?: string | null;
    tournament_date?: string | null;
    created_at?: string;
  };
  Update: {
    id?: number;
    agent_name?: string;
    strategy_prompt?: string;
    human_wallet?: string;
    agent_wallet?: string;
    tx_hash?: string;
    reserved_date?: string | null;
    tournament_date?: string | null;
    created_at?: string;
  };
};
```

**`ui/src/types/models.ts`:**

Add:

```typescript
export type UserRow = Tables<"users">;
```

This type is used by the API route and the form's success state.

### Step 3: Update `.env.example`

**`ui/.env.example`** — add the server-only variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SEPOLIA_RPC_URL=
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=

# Server-only (not exposed to browser)
SUPABASE_SECRET_KEY=
WALLET_SERVICE_URL=http://127.0.0.1:3210
```

`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is already in use by `DynamicRootProvider` but was not previously in `.env.example`.

---

## Phase 2 — Server-Side API Route

**Goal:** A working `POST /api/join-tournament` endpoint that validates input and inserts a row into the `users` table.

### Step 4: Create `/api/join-tournament/route.ts`

Create `ui/src/app/api/join-tournament/route.ts`:

```typescript
export async function POST(request: Request) { ... }
```

**Implementation details:**

1. Parse JSON body. Expect `{ agentName, strategyPrompt, humanWallet, agentWallet, txHash }`.

2. Validate each field:
   - `agentName`: string, 1–15 chars, `/^[a-zA-Z0-9]+$/`
   - `strategyPrompt`: string, 1–500 chars
   - `humanWallet`: string, `/^0x[a-fA-F0-9]{40}$/`
   - `agentWallet`: string, `/^0x[a-fA-F0-9]{40}$/`
   - `txHash`: string, `/^0x[a-fA-F0-9]{64}$/`

3. Read `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) and `SUPABASE_SECRET_KEY` from `process.env`. If not configured, return `503` with a helpful message.

4. Create a one-off Supabase client: `createClient(url, secretKey)` — same pattern as `register-player/route.ts`.

5. Insert into `users`:
   ```typescript
   const { data, error } = await supabase
     .from("users")
     .insert({
       agent_name: agentName,
       strategy_prompt: strategyPrompt,
       human_wallet: humanWallet,
       agent_wallet: agentWallet,
       tx_hash: txHash,
     })
     .select("id, agent_name, agent_wallet, tx_hash, created_at")
     .single();
   ```

6. Return `{ ok: true, user: data }` on success, or appropriate error responses.

**Error codes:**
- `400` — validation failure
- `500` — database error
- `503` — Supabase not configured

---

## Phase 3 — Home Page Layout

**Goal:** The bottom section of the home page shows two side-by-side panels.

### Step 5: Split the Tournament List Section

In `ui/src/app/page.tsx`, modify the existing tournament list `<section>`:

**Current structure:**

```tsx
<section ref={listRef} className="min-h-screen px-8 py-16 max-w-3xl mx-auto w-full">
  <h2>Tournament Series</h2>
  {/* tournament cards */}
</section>
```

**New structure:**

```tsx
<section ref={listRef} className="min-h-screen px-8 py-16 max-w-6xl mx-auto w-full">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
    {/* Left column — Past Tournaments */}
    <div>
      <h2 className="text-2xl font-semibold mb-8">Past Tournaments</h2>
      {/* existing tournament cards + survivor connectors, unchanged */}
    </div>

    {/* Right column — Join a Tournament */}
    <div>
      <h2 className="text-2xl font-semibold mb-8">Join a Tournament</h2>
      <JoinTournamentForm />
    </div>
  </div>
</section>
```

Key changes:
- `max-w-3xl` → `max-w-6xl` (wider to accommodate two columns)
- CSS Grid with `lg:grid-cols-2` (stacks on small screens, side by side on large)
- "Tournament Series" renamed to "Past Tournaments"
- `JoinTournamentForm` component imported and placed in the right column

The tournament card list and survivor connectors remain untouched — they just move inside the left column `<div>`.

---

## Phase 4 — Join Tournament Form Component

**Goal:** The full multi-step form works end to end.

### Step 6: Create `JoinTournamentForm.tsx`

Create `ui/src/components/JoinTournamentForm.tsx`.

This is the core component. It manages a state machine with four phases.

**State shape:**

```typescript
type FlowStep =
  | { step: "form" }                               // Step 1: fill form + connect wallet
  | { step: "create-wallet" }                       // Step 2: wallet connected, create agent wallet
  | { step: "submit"; agentWallet: string }         // Step 3: agent wallet created, pay + register
  | { step: "success"; user: UserRow }              // Step 4: done
  | { step: "error"; message: string; retry: FlowStep };  // recoverable error at any step
```

Additionally, track:
- `agentName: string` — controlled input
- `agentWallet: string | null` — set after wallet API response
- `humanBalance: string | null` — user's Sepolia ETH balance
- `loading: boolean` — for button loading states
- `txHash: string | null` — set after payment

**Component outline:**

```
JoinTournamentForm
├── Form fields (Agent Name input + Strategy Prompt textarea)
├── Entry fee notice text
├── User balance display (after wallet connected)
├── Action button (changes per step)
├── Error display
└── Success panel (replaces everything on completion)
```

### Step 7: Form Fields

Two controlled inputs at the top of the form. These are always visible (except in success state) and always editable (except during loading).

**Agent Name:**
- `<input type="text" maxLength={15} />`
- `onChange` strips non-alphanumeric characters: `value.replace(/[^a-zA-Z0-9]/g, "")`
- Character counter: `{n}/15`

**Strategy Prompt:**
- `<textarea rows={4} maxLength={500} />`
- Character counter: `{n}/500`

**Entry fee notice:**
- Static text: "Entry fee is 0.001 Sepolia ETH"
- Styled as muted/secondary text below the textarea

### Step 8: Button Logic — Connect Wallet

When `step === "form"`:

Read `primaryWallet` from `useDynamicContext()`. If `primaryWallet` is null (not connected):
- Button label: "Connect Wallet"
- Button color: `bg-accent`
- Disabled if form validation fails (`agentName` empty or invalid, `strategyPrompt` empty)
- On click: call `setShowAuthFlow(true)` from `useDynamicContext()` to open the Dynamic modal

Use a `useEffect` to watch `primaryWallet`. When it transitions from null to truthy:
- Advance to `{ step: "create-wallet" }`
- Record `primaryWallet.address` as the `humanWallet`
- Trigger balance fetch (Step 9)

### Step 9: Balance Check

When the user connects their wallet (entering the `"create-wallet"` step):

1. Fetch the user's Sepolia ETH balance via JSON-RPC:
   ```
   POST {NEXT_PUBLIC_SEPOLIA_RPC_URL}
   { "jsonrpc": "2.0", "method": "eth_getBalance", "params": ["{address}", "latest"], "id": 1 }
   ```

2. Parse the hex result → convert to ETH (divide by 10^18). Store as `humanBalance`.

3. Display below the entry fee notice: "Your balance: {balance} ETH"

4. If balance < 0.001 ETH → button is disabled/faded with helper text "Insufficient Sepolia ETH"

Use the existing `NEXT_PUBLIC_SEPOLIA_RPC_URL` env var and the same raw `fetch()` pattern from `lib/balance.ts`.

Create a small utility function (can live in `lib/balance.ts` or inline):

```typescript
async function fetchWalletBalance(address: string): Promise<string | null>
```

Returns the balance in ETH as a string (e.g. `"0.0500"`) or `null` on failure.

### Step 10: Button Logic — Create Agent Wallet

When `step === "create-wallet"`:

- Button label: "Create Agent Wallet"
- Button color: `bg-accent`
- Disabled if `humanBalance` is null (still loading) or < 0.001
- On click:
  1. Set `loading: true`, button shows "Creating…"
  2. Call `POST /api/wallet/agents` with `{ "names": [agentName] }`
  3. On success: extract `eoaAddress` from `response.wallets[0].eoaAddress`
  4. Store as `agentWallet`
  5. Advance to `{ step: "submit", agentWallet }`
  6. On error: show error message, button returns to clickable

### Step 11: Button Logic — Submit and Pay

When `step === "submit"`:

- Button label: "Submit and Pay"
- Button color: `bg-cooperate` (green — visually distinct as the final action)
- Always enabled (balance was already verified)
- On click:

**Sub-step A: Send ETH**

```typescript
await primaryWallet.switchNetwork(SEPOLIA_CHAIN_ID);
const hash = await primaryWallet.sendBalance({
  amount: "0.001",
  toAddress: agentWallet as `0x${string}`,
});
```

Button shows "Confirm in wallet…" during this step.

If the user rejects or the tx fails → show error, button returns to clickable.

Store `hash` as `txHash`.

**Sub-step B: Insert DB row**

```typescript
const res = await fetch("/api/join-tournament", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentName,
    strategyPrompt,
    humanWallet: primaryWallet.address,
    agentWallet,
    txHash: hash,
  }),
});
```

Button shows "Submitting…" during this step.

On success → advance to `{ step: "success", user: data.user }`.

On error → show error message. **Important:** the ETH has already been sent. Display the tx hash so the user has a record. The error message should say something like "Payment sent (tx: 0x...) but registration failed. Please contact support."

### Step 12: Success State

When `step === "success"`:

Replace the entire form with a success panel:

```
┌──────────────────────────────────────────────┐
│                                              │
│   ✓  Agent registered!                       │
│                                              │
│   Agent Name      alice                      │
│   Strategy        Always cooperate unless... │
│   Agent Wallet    0xA1b2...f6A1  ↗           │
│   Entry Fee tx    0x7a8b...3c2d  ↗           │
│                                              │
└──────────────────────────────────────────────┘
```

- Agent Wallet links to `https://sepolia.etherscan.io/address/{agent_wallet}` (new tab)
- Entry Fee tx links to `https://sepolia.etherscan.io/tx/{tx_hash}` (new tab)
- Strategy prompt is truncated to ~80 chars with ellipsis
- No "reset" or "register another" button — this is a completed state

---

## Phase 5 — Glue

### Step 13: Update `.env.example`

Add the three new variables as described in Phase 1, Step 3. This is a documentation-only change.

### Step 14: Form Input Locking

During loading states (wallet creation, payment, DB insert), disable the Agent Name and Strategy Prompt inputs to prevent the user from changing values mid-flow. The inputs become editable again if an error occurs and the user needs to retry.

After `step === "create-wallet"` is reached, the Agent Name should be **locked** (not just disabled during loading — permanently locked for this session) because the wallet was created with that name. Changing the name after wallet creation would create a mismatch.

### Step 15: Cleanup (Optional)

The wallet-test page (`ui/src/app/wallet-test/page.tsx`) and its associated components (`PlayerPromptForm.tsx`, `FundPlayerEthButton.tsx`) can remain in the codebase as development/testing tools, or be removed if desired. They are not referenced from the production pages.

The existing `/api/register-player/route.ts` writes to the `agents` table. It is not used by the new flow (which writes to `users`). It can remain for now — it doesn't conflict.

---

## Implementation Order (Critical Path)

```
Create users table in Supabase (Step 1)
    ↓
Add TypeScript types (Step 2)
    ↓
Update .env.example (Step 3)          ← can be done anytime
    ↓
API route: /api/join-tournament (Step 4)
    ↓
Home page layout change (Step 5)      ← first visible change
    ↓
JoinTournamentForm component shell (Step 6)
    ↓
Form fields + validation (Step 7)
    ↓
Connect Wallet button (Step 8)        ← first interactive proof of life
    ↓
Balance check (Step 9)
    ↓
Create Agent Wallet button (Step 10)
    ↓
Submit and Pay button (Step 11)       ← full flow works end to end
    ↓
Success state (Step 12)
    ↓
Input locking (Step 14)
    ↓
Cleanup (Step 15)                     ← optional
```

**Steps 1–4** are the data foundation — no UI changes visible yet.

**Step 5** produces the first visible change: two-column layout.

**Steps 6–12** are the core form, built incrementally. Each step produces a testable intermediate state.

**Steps 13–15** are polish and documentation.

---

## Testing Strategy

### Smoke test the API route (after Step 4)

Use `curl` or a REST client to call `POST /api/join-tournament` directly:

```bash
curl -X POST http://localhost:3000/api/join-tournament \
  -H 'Content-Type: application/json' \
  -d '{
    "agentName": "testbot",
    "strategyPrompt": "Always cooperate",
    "humanWallet": "0x0000000000000000000000000000000000000001",
    "agentWallet": "0x0000000000000000000000000000000000000002",
    "txHash": "0x0000000000000000000000000000000000000000000000000000000000000001"
  }'
```

Verify: row appears in Supabase `users` table. Test validation errors (empty name, name > 15 chars, non-alphanumeric name, invalid addresses).

### Verify layout change (after Step 5)

- Home page shows two columns on desktop (viewport ≥ 1024px)
- Past Tournaments column shows existing tournament cards with survivor connectors
- Join a Tournament column shows the form placeholder
- On narrow viewports, columns stack vertically

### Verify Connect Wallet (after Step 8)

- With invalid form (empty fields): button is disabled
- With valid form: button is enabled, clicking opens Dynamic modal
- After connecting wallet in the modal: button changes to "Create Agent Wallet"
- Balance is displayed below entry fee notice

### Verify Create Agent Wallet (after Step 10)

- Prerequisite: wallet service running at `WALLET_SERVICE_URL`
- With insufficient balance: button is faded/disabled
- With sufficient balance: click creates the wallet, button changes to "Submit and Pay" (green)
- On wallet service error: error message shown, button remains clickable

### Verify full flow (after Step 12)

- Complete the entire flow: fill form → connect wallet → create agent wallet → submit and pay
- Verify: MetaMask (or other wallet) prompts for the 0.001 ETH transaction
- Verify: after tx confirmation, DB insert happens
- Verify: success panel shows with correct agent name, wallet address (Etherscan link), and tx hash (Etherscan link)
- Verify: row exists in Supabase `users` table with all fields populated
- Verify: `reserved_date` and `tournament_date` are null

### Edge cases

- User disconnects wallet mid-flow → `primaryWallet` becomes null, revert to Step 1
- User rejects MetaMask transaction → error shown, button returns to "Submit and Pay"
- Wallet service unreachable → error shown at "Create Agent Wallet" step
- Supabase not configured → 503 from API route, error shown after payment (tx hash preserved in error message)
- Agent name with special characters → stripped by input handler, never reaches the API
- Multiple rapid form submissions → `loading` flag prevents double-submit

---

## What to Defer

Out of scope for this implementation:

- **Duplicate name prevention** — no uniqueness checks against the `agents` table or within the `users` table itself
- **Refund mechanism** — if the DB insert fails after payment, the ETH is not automatically returned
- **Real-time balance updates** — balance is fetched once when the wallet connects, not polled
- **Mobile layout** — desktop only, consistent with the rest of the app
- **Wallet disconnection recovery** — if the user disconnects mid-flow, form state resets (no persistence)
- **Rate limiting** — no rate limiting on the API routes
- **Transaction confirmation waiting** — we use the tx hash returned by `sendBalance`, we don't wait for N confirmations
- **Email/notification** — no confirmation email or notification after registration
