# Onchain Features Implementation Strategy

> Reference: `Onchain Features Design Spec.md` for the full design. This document covers *how* to build it.
>
> Prerequisite: `Frontend Implementation Strategy.md` (the v1 frontend) must be built and working first. This strategy extends the existing codebase.

---

## Scope

Three features, split into 4 implementation phases:

1. **Data pipeline** — fetch transactions + balances, wire into existing types and stores
2. **Transaction panels** — entry/collection at Step 1, prizes at last step
3. **Agent Modal** — overlay with agent details, triggered from Leaderboard
4. **Glue** — type updates, code updates outside the UI

---

## Phase 1 — Data Pipeline

**Goal:** Transactions and balances are fetched, typed, and available in the component tree. No UI changes yet.

### Step 1: Type Updates

**`ui/src/types/database.ts`:**

Replace `"elimination"` with `"collection"` in all three places (Row, Insert, Update) inside the `tournament_transactions` table type.

**`ui/src/types/models.ts`:**

Add the transaction row type and extend `TournamentData`:

```typescript
export type TournamentTransactionRow = Tables<"tournament_transactions">;

export type TournamentData = {
  // ...existing fields...
  transactions: TournamentTransactionRow[];  // ADD
};
```

### Step 2: Fetch Transactions in `queries.ts`

Add to the parallel `Promise.all` in `fetchTournamentData`:

```typescript
supabase
  .from("tournament_transactions")
  .select("*")
  .eq("tournament_id", tournamentId)
  .order("created_at")
```

Include the result in the returned `TournamentData` object as `transactions`.

### Step 3: Pass Transactions Through `organizeByRound`

The existing `OrganizedTournament` type needs the raw transactions (they're per-tournament, not per-round):

```typescript
export type OrganizedTournament = {
  tournament: TournamentRow;
  agents: AgentRow[];
  rounds: Round[];
  totalSteps: number;
  transactions: TournamentTransactionRow[];  // ADD
};
```

In `organizeByRound()`, pass `data.transactions` straight through to the output. No reorganization needed — transactions are just a flat list filtered at render time.

### Step 4: Balance Fetching Utility

Create `ui/src/lib/balance.ts`:

```typescript
export async function fetchAgentBalances(
  agents: AgentRow[]
): Promise<Map<number, string>>
```

- Takes the 6 agents, filters to those with non-null `wallet_address`
- Fires 6 parallel `fetch()` calls to `NEXT_PUBLIC_SEPOLIA_RPC_URL` using `eth_getBalance`
- Returns a `Map<agentId, balanceInEth>` (formatted to 4 decimal places)
- Handles errors gracefully: if a call fails, the map entry is `"unavailable"`

No ethers.js or viem dependency — raw JSON-RPC via `fetch()`.

### Step 5: Wire Balance into Tournament Layout

In `tournament/[id]/layout.tsx`, after `fetchTournamentData` resolves:

1. Call `fetchAgentBalances(raw.agents)` (can run in parallel with `organizeByRound`)
2. Store the resulting `Map<number, string>` in React state (e.g. `balances`)
3. Pass balances down via React Context or a Zustand slice — the Agent Modal needs access

**Alternative:** Store balances in the Zustand time store alongside the tournament data. Add:

```typescript
// In timeStore
balances: Map<number, string> | null;
loadBalances(balances: Map<number, string>): void;
```

This keeps all tournament-scoped data in one place.

---

## Phase 2 — Transaction Panels

**Goal:** Entry/collection txs visible at Step 1. Prize txs visible at last step. Both below the arenas grid.

### Step 6: Transaction Panel Component

Create `ui/src/components/TransactionPanel.tsx`:

Two variants, controlled by props:

**Entry/Collection variant** (Step 1):

```typescript
type EntryTransactionPanelProps = {
  transactions: TournamentTransactionRow[];
  agents: AgentRow[];
};
```

- Filter transactions to `type === 'entry_fee'` and `type === 'collection'`
- Group by `agent_id`: each agent gets a row with their entry tx + collection tx side by side
- Only show agents that HAVE an entry_fee tx (survivors in T1+ will have none)
- Each tx hash links to `https://sepolia.etherscan.io/tx/{tx_hash}` (new tab)
- Display tx hash truncated: first 6 + last 4 chars

**Prize variant** (last step):

```typescript
type PrizeTransactionPanelProps = {
  transactions: TournamentTransactionRow[];
  agents: AgentRow[];
  leaderboard: LeaderboardEntry[];
};
```

- Filter transactions to `type === 'prize'`
- Join with leaderboard to show rank + agent name
- Order by rank (1st, 2nd, 3rd)
- Only render if tournament status is `completed` AND prize txs exist

### Step 7: Integrate into Tournament Page

In `tournament/[id]/page.tsx`, read transactions from the time store and conditionally render:

```
if (currentStep === 0) → render EntryTransactionPanel below arenas grid
if (currentStep === totalSteps - 1 && tournament.status === 'completed') → render PrizeTransactionPanel below arenas grid
```

The `currentStep` and `totalSteps` are already in the Zustand store. The `transactions` come from the new field on `OrganizedTournament`.

---

## Phase 3 — Agent Modal

**Goal:** Clicking a leaderboard entry opens a modal with agent details.

### Step 8: Agent Modal Component

Create `ui/src/components/AgentModal.tsx`:

Props:

```typescript
type AgentModalProps = {
  agent: AgentRow;
  transactions: TournamentTransactionRow[];
  balance: string | null;  // e.g. "0.0042" or null if unavailable
  onClose: () => void;
};
```

Renders:
- Backdrop overlay (semi-transparent, click to close)
- Centered card with:
  - Close button (✕)
  - Agent avatar + name
  - ENS subdomain (linked to `https://app.ens.domains/{ens_name}`)
  - Wallet balance + truncated address (linked to Etherscan)
  - Transaction section: entry tx, collection tx, prize tx (each linked to Etherscan)
- All external links open in new tabs
- Handles null cases gracefully ("No wallet", "No ENS", "—" for missing txs)

### Step 9: Make Leaderboard Entries Clickable

In `Leaderboard.tsx`:

- Add state: `selectedAgent: AgentRow | null`
- Wrap each leaderboard entry `<div>` in an `onClick` handler that looks up the `AgentRow` from the tournament agents and sets it as selected
- When `selectedAgent` is non-null, render `<AgentModal>` with the appropriate props
- The Leaderboard component needs access to: `agents: AgentRow[]`, `transactions: TournamentTransactionRow[]`, `balances: Map<number, string>`

This means the Leaderboard's props expand. Currently it only takes `entries: LeaderboardEntry[]`. It now needs additional context. Two approaches:

**Option A (recommended):** Read from Zustand store directly inside the Leaderboard component. The component is already `"use client"`. Add `useTimeStore` reads for `agents`, `transactions`, and `balances`.

**Option B:** Expand the props interface. This is more explicit but requires threading data through the layout.

Go with **Option A** — it's consistent with how `useTimeStore` is already used in components.

### Step 10: Leaderboard → Agent Lookup

The leaderboard entries only contain `agentName` (string). To open the modal, we need the full `AgentRow`. The lookup:

```typescript
const agent = agents.find(a => a.name === entry.agentName);
```

This is safe because agent names are unique. The `agents` array is already in the time store as part of `OrganizedTournament`.

---

## Phase 4 — Glue (Non-UI Code Updates)

These changes sit outside the UI codebase but are required for correctness.

### Step 11: Update `game/src/adapter/db/supabase-writes.ts`

The `recordTransaction` function has the type literal `"entry_fee" | "elimination" | "prize"`. Change `"elimination"` to `"collection"`.

### Step 12: Update Schema Documentation

Update the following docs to reflect the rename:

- `docs/Schema/ENTITY_DIAGRAM.md` — update the `tournament_transactions` description and the relationship note
- `docs/Schema/EXAMPLE_DATA.md` — update the `tournament_transactions` example table and description text
- `docs/API requests to DB.md` — if it references `elimination`, update to `collection`

---

## Implementation Order (Critical Path)

```
Type Updates (Step 1)
    ↓
Fetch Transactions (Step 2)
    ↓
Pass Through organize (Step 3)
    ↓
Balance Utility (Step 4)   ← can be done in parallel with Steps 2-3
    ↓
Wire Balance into Layout (Step 5)
    ↓
Transaction Panel Component (Step 6)
    ↓
Integrate into Tournament Page (Step 7)  ← First visible proof of life
    ↓
Agent Modal Component (Step 8)
    ↓
Clickable Leaderboard (Step 9)
    ↓
Agent Lookup (Step 10)
    ↓
Glue: game code + docs (Steps 11-12)  ← can be done anytime
```

**Steps 1-5** are the data foundation — no UI changes visible yet, but everything is wired.

**Steps 6-7** produce the first visible result: transaction links at Step 1 and last step.

**Steps 8-10** produce the second visible result: the Agent Modal.

**Steps 11-12** are housekeeping — can be done at any point.

---

## Testing Strategy

### Smoke test the data pipeline (after Step 5)

Open the browser console on a tournament page. Verify:
- `transactions` array is populated in the store (check via Zustand devtools or a `console.log`)
- `balances` map has entries for agents with wallets
- Balance values are reasonable (non-zero for seeded wallets on Sepolia, or "unavailable" if the wallets are fake/unfunded)

### Verify transaction panels (after Step 7)

- Navigate to `/tournament/0`. At Step 1/100, the entry/collection panel should appear with 6 rows (T0 has 6 agents)
- Navigate to `/tournament/1`. At Step 1, the panel should show 3 rows (only new agents)
- Navigate to `/tournament/0`. Go to Step 100/100. The prize panel should appear with 3 rows
- Navigate to `/tournament/2` (running). At the last step, NO prize panel should appear

### Verify Agent Modal (after Step 10)

- Click any agent name in the Leaderboard → modal opens
- Verify: name, ENS link, balance, address link, transaction links
- Click outside → modal closes
- Verify playback continues behind the modal
- Verify agents with no transactions in this tournament show "—"

### Edge cases

- Agent with null `wallet_address` → "No wallet" in modal
- Agent with null `ens_name` → "No ENS" in modal
- RPC endpoint unreachable → "Balance unavailable"
- Survivor agent in T1+ → no entry/collection txs in transaction panel or modal for that tournament

---

## What to Defer

Out of scope for this implementation:

- **Transaction confirmations / status** — we assume all seeded tx hashes are valid
- **Token balances** — only ETH balance, no ERC-20
- **Transaction history timeline** — txs are shown at fixed steps, not integrated into the per-round timeline
- **Agent profile page** — the modal is the profile for now; a full page is a future feature
- **ENS avatar resolution** — we use the shared hardcoded avatar, not on-chain ENS avatars
- **Mobile view** — desktop only
