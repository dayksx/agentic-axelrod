# Hackathon Build Sequencing — ETHGlobal Cannes 2026

> Strategy: Tasks are in series. Scope is gated — each step is a shippable result. Don't start the next until the previous is solid.

---

## Core Track (in order)

### Step 1 — Database Schema

Set up the database with the full end-product schema. Fields can be nullable so the schema doesn't need to change as we layer in features. This is the foundation — everything else writes to it.

### Step 2 — 1-to-1 Agent Chat (Basic)

Two agents talk to each other, passing messages through a Node.js intermediary function that enforces a 3-message limit per agent. This proves the basic agent ↔ runtime ↔ agent loop works before adding any game logic.

### Step 3 — Tournament v1 (No Data Propagation, No DB)

A full tournament loop, but stripped down:

- **Game Master runtime** spins up **6 agent runtimes**, each with a LangGraph-based workflow
- Phases per round:
  - **Chat phase**: agents talk to each other (max 3 messages each), always routed through the Game Master — agents never communicate directly
  - **Decision phase**: agents submit decisions, again always via Game Master
  - **Reveal phase**: agents are shown key round data
- Rounds repeat until tournament end, then scores are printed
- No Announcements, no Gossip, no Graffiti
- No DB writes — everything lives in memory

> **If we ship this at the hackathon, that's a good result.**

### Step 4 — Tournament v2 (Announcements + DB)

Add the **Announcements phase**: a string broadcast available to all players, sent after each round. Store tournament data to the database.

### Step 5 — Tournament v3 (On-chain Wallets + Settlement)

Add **dynamic wallets** for agents, funded by the Game Master on **Ethereum Sepolia**:

- Game Master gets a **smart wallet**
- Each agent gets a wallet, with **delegation to the Game Master's smart wallet**
- At tournament end: bottom 3 losers' funds are swept to top 3 winners via the Game Master

### Step 6 — Tournament v4 (ENS Subdomains)

Each player gets an **ENS subdomain** (e.g. `c3po.axelrodtournament.eth`).

### Step 7 — Series v1 (Multi-Tournament + Survivor Logic)

Tournaments now run in a series:

- **Tournament 1**: provide JSON via CLI with 6 strategy prompts + player names
- **Tournaments 2+**: provide JSON via CLI with 3 new strategy prompts + player names — top 3 survivors from the previous tournament carry forward
- Smart wallet creation, ENS subdomain assignment, and funding logic becomes conditional on whether it's tournament 1 or a continuation

---

## Frontend (Parallel Track)

Implemented up to Step 7, but without onchain features (wallets, transactions, ENS subdomains)

---

## Additional Options (Stretch / Future)

These are not fully scoped yet — pick up only if core track is ahead of schedule.

- ✅ **Hedera testnet** — alternative chain to Sepolia
- ❌ **ENS metadata** — write Strategy Prompt to the metadata of `c3po.axelrodtournament.eth`
- ❌ **Hedera Announcements on-chain** — Game Master creates a Hedera topic (state ID, sequence number, whitelisted writers); players post and read Announcements on-chain
- ❌ **Gossip** — after each round, each agent can send a private string DM to their previous opponent
- ❌ **Graffiti** — agents can append a string to the arena, visible to all players who enter after it was written
- ❌ **Scale up** — more players per tournament, more ping-pong rounds in the chat phase
- ❌ **ENS upgradability** — introduce `v2.c3po.axelrodtournament.eth` to reflect strategy evolution over time
- ❌ **Observer Agent** — a meta-agent that sees everything and determines strategy prompts for every agent in every subsequent tournament; the human only provides the 6 initial prompts for tournament 1

---

## Build Order Summary

| Step | Milestone                     | Stores to DB | On-chain | Good Hackathon Result |
| ---- | ----------------------------- | :----------: | :------: | :-------------------: |
| 1    | Full DB schema                |      —       |    —     |                       |
| 2    | 1-to-1 agent chat             |      —       |    —     |                       |
| 3    | Tournament v1 (in-memory)     |      ✗       |    ✗     |          ✅           |
| 4    | Tournament v2 + Announcements |      ✅      |    ✗     |                       |
| 5    | Tournament v3 + Wallets       |      ✅      |    ✅    |                       |
| 6    | Tournament v4 + ENS           |      ✅      |    ✅    |                       |
| 7    | Series v1 + Survivor logic    |      ✅      |    ✅    |                       |
