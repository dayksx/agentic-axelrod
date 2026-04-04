# Onchain Features Design Spec

> Addendum to `Frontend Design Spec.md`. Covers three new features: Agent Modal, transaction display in the tournament timeline, and on-chain wallet balance.

---

## Overview

Three additions to the existing tournament viewer:

1. **Agent Modal** — clicking an agent name in the Leaderboard opens a modal with agent details (name, ENS subdomain link, wallet balance, transaction history)
2. **Transaction Display** — entry_fee + collection txs shown at Step 1, prize txs shown at the last step of the tournament timeline
3. **Wallet Balance** — each agent's live Sepolia ETH balance, fetched once on tournament load

---

## 1. Agent Modal

### Trigger

Leaderboard entries become clickable. Clicking an agent name opens a centered modal overlay.

Only accessible from the Leaderboard — agent names in ArenaCards, ChatBubbles, and DecisionCards are NOT clickable.

### Modal Content

```
┌──────────────────────────────────────────────┐
│                    ✕ close                    │
│                                              │
│          [Agent Avatar]                      │
│          Agent Name (title)                  │
│                                              │
│   ENS   tit-for-tat.axelrodtournament.eth ↗ │
│                                              │
│   Balance   0.0042 ETH                       │
│   Address   0xA1b2...f6A1 ↗                  │
│                                              │
│   ─── Transactions ───                       │
│                                              │
│   Entry tx      0x1a2b...1a ↗               │
│   Collection tx 0x7a8b...7a ↗               │
│   Prize tx      0x0d1e...0d ↗               │
│                                              │
└──────────────────────────────────────────────┘
```

### Field Details

| Field | Source | Display | Link |
|-------|--------|---------|------|
| **Agent Avatar** | Same shared avatar image used elsewhere | Image | — |
| **Agent Name** | `agents.name` | Plain text, title-styled | — |
| **ENS subdomain** | `agents.ens_name` | e.g. `tit-for-tat.axelrodtournament.eth` | `https://app.ens.domains/{ens_name}` (opens new tab) |
| **Balance** | On-chain ETH balance for `agents.wallet_address` on Sepolia | e.g. `0.0042 ETH` | — |
| **Address** | `agents.wallet_address` | Truncated: `0xA1b2...f6A1` (first 6 + last 4 chars) | `https://sepolia.etherscan.io/address/{wallet_address}` (opens new tab) |
| **Entry tx** | `tournament_transactions` WHERE `agent_id = X AND type = 'entry_fee'` for this tournament | Label "Entry tx" + truncated hash | `https://sepolia.etherscan.io/tx/{tx_hash}` (opens new tab) |
| **Collection tx** | `tournament_transactions` WHERE `agent_id = X AND type = 'collection'` for this tournament | Label "Collection tx" + truncated hash | `https://sepolia.etherscan.io/tx/{tx_hash}` (opens new tab) |
| **Prize tx** | `tournament_transactions` WHERE `agent_id = X AND type = 'prize'` for this tournament | Label "Prize tx" + truncated hash (or "—" if no prize yet) | `https://sepolia.etherscan.io/tx/{tx_hash}` (opens new tab) |

### Behavior

- Click outside the modal or click ✕ to close
- Playback continues running while modal is open (does not pause)
- If the agent has no `wallet_address` (null), show "No wallet" in place of balance and address
- If the agent has no `ens_name` (null), show "No ENS" in place of the subdomain
- If a transaction type doesn't exist for this agent in this tournament (e.g., a survivor has no entry_fee/collection in T1+), show "—" for that row
- Balance shows a loading spinner while fetching, then resolves to the value

---

## 2. Transaction Display in Timeline

Transactions are displayed below the arenas grid at two specific moments in the tournament timeline: Step 1 (first step) and the last step.

### Step 1 — Entry Fees + Collection

When `currentStep === 0`, a transaction panel appears below the arenas grid:

```
┌─────────────────────────────────────────────────────┐
│  Arenas Grid (3 arena cards, Round 1, Chat step 0)  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ── Tournament Transactions ──                      │
│                                                     │
│  TitForTat       Entry tx ↗    Collection tx ↗     │
│  Deceiver        Entry tx ↗    Collection tx ↗     │
│  Grudger         Entry tx ↗    Collection tx ↗     │
│  Pavlov          Entry tx ↗    Collection tx ↗     │
│  Detective       Entry tx ↗    Collection tx ↗     │
│  AlwaysCooperate Entry tx ↗    Collection tx ↗     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each row shows:
- Agent name (with avatar)
- "Entry tx" linking to `https://sepolia.etherscan.io/tx/{entry_fee_tx_hash}`
- "Collection tx" linking to `https://sepolia.etherscan.io/tx/{collection_tx_hash}`

**For T0:** 6 rows (all agents are new).
**For T1+:** 3 rows (only the new agents who have entry_fee + collection txs). Survivors have no entry/collection txs and are omitted from this panel.

### Last Step — Prizes

When `currentStep === totalSteps - 1`, a transaction panel appears below the arenas grid:

```
┌─────────────────────────────────────────────────────┐
│  Arenas Grid (3 arena cards, last round, last phase)│
├─────────────────────────────────────────────────────┤
│                                                     │
│  ── Prize Transactions ──                           │
│                                                     │
│  Deceiver (1st)    Prize tx ↗                      │
│  Detective (2nd)   Prize tx ↗                      │
│  TitForTat (3rd)   Prize tx ↗                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each row shows:
- Agent name + rank
- "Prize tx" linking to `https://sepolia.etherscan.io/tx/{prize_tx_hash}`

Always 3 rows (top 3 agents by final score).

**Exception:** If the tournament status is `running` (no prizes issued yet), the prize panel does NOT appear at the last step.

### Layout Integration

The transaction panels are rendered inside the tournament page component (the arenas grid page), NOT in the shared layout. They sit below the `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">` that holds the ArenaCards.

---

## 3. Wallet Balance

### Data Source

Each agent's `wallet_address` is used to query the Sepolia ETH balance via the `NEXT_PUBLIC_SEPOLIA_RPC_URL` environment variable.

### Fetching Strategy

- Fetch **once** when the tournament page loads (alongside the Supabase data fetch)
- For all 6 agents in the tournament, call `eth_getBalance` with their `wallet_address`
- Results are cached in the Zustand time store or a parallel React state — not re-fetched during playback
- Use a raw `fetch()` call to the JSON-RPC endpoint (no ethers.js/viem dependency needed):

```
POST {NEXT_PUBLIC_SEPOLIA_RPC_URL}
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": ["{wallet_address}", "latest"],
  "id": 1
}
```

- Parse the hex response → convert to ETH (divide by 10^18)
- Display with 4 decimal places (e.g., `0.0042 ETH`)

### Where Displayed

Wallet balance appears **only** in the Agent Modal (Section 1 above).

### Error Handling

- If the RPC call fails, show "Balance unavailable" in the modal
- If `wallet_address` is null, show "No wallet"
- If `NEXT_PUBLIC_SEPOLIA_RPC_URL` is not configured, show "RPC not configured"

---

## Data Loading Changes

### Current `fetchTournamentData`

Fetches: tournaments, tournament_agents, matches, scores, announcements, agents, chat_messages.

### New Additions

Add to the parallel fetch in `fetchTournamentData`:

```
supabase
  .from("tournament_transactions")
  .select("*")
  .eq("tournament_id", tournamentId)
  .order("created_at")
```

This returns all entry_fee, collection, and prize transactions for the tournament.

### Balance Fetch (separate)

After `fetchTournamentData` resolves, initiate balance fetches for all 6 agents (in parallel). This is a separate async operation that resolves into a `Map<number, string>` (agent_id → balance in ETH).

---

## Type Changes

### `database.ts`

Update the `tournament_transactions` type:

```typescript
type: "entry_fee" | "collection" | "prize"  // was: "entry_fee" | "elimination" | "prize"
```

### `models.ts`

Add new row type:

```typescript
export type TournamentTransactionRow = Tables<"tournament_transactions">;
```

Extend `TournamentData`:

```typescript
export type TournamentData = {
  tournament: TournamentRow;
  agents: AgentRow[];
  tournamentAgents: TournamentAgentRow[];
  matches: MatchRow[];
  chatMessages: ChatMessageRow[];
  scores: ScoreRow[];
  announcements: AnnouncementRow[];
  transactions: TournamentTransactionRow[];  // NEW
};
```

---

## Assets

No new image assets required. The Agent Modal uses the same shared agent avatar image.

---

## Constraints

- **Desktop only.** No mobile view (consistent with existing spec).
- **No real-time balance updates.** Fetched once per page load.
- **No ENS resolution.** We use the `ens_name` stored in the database, not on-chain ENS resolution.
- **Sepolia only.** All Etherscan links and RPC calls target Sepolia testnet.
