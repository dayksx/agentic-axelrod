# Seed Update Instructions

> Reference: Migration `005_rename_elimination_to_collection.sql` renames the transaction type `elimination` → `collection` and updates the CHECK constraint. This document covers the **seed.sql rewrite** needed to match the new transaction flow and fix the survivor logic.

---

## 1. Transaction Type Rename

All occurrences of `'elimination'` in `seed.sql` must become `'collection'`.

---

## 2. Fix Survivor Logic (Tournament Rosters)

The series rule is: **top 3 by cumulative score survive to the next tournament. Bottom 3 are out. 3 new agents join.**

### T0 Final Scores

| Agent            | ID | Cumulative |
| ---------------- | -- | ---------- |
| Deceiver         | 1  | 30         |
| Detective        | 4  | 28         |
| TitForTat        | 0  | 24         |
| Pavlov           | 3  | 24         |
| Grudger          | 2  | 20         |
| AlwaysCooperate  | 5  | 18         |

**T0 top 3 (survivors):** Deceiver (1), Detective (4), TitForTat (0)

> Tiebreak: TitForTat and Pavlov both at 24. TitForTat wins the tiebreak (first alphabetically, or by lower id — pick a consistent rule and document it).

### T1 Roster (MUST FIX)

**Current (wrong):** TitForTat (0), Grudger (2), Pavlov (3), Hawk (6), Diplomat (7), Random (8)

**Correct:** TitForTat (0), Deceiver (1), Detective (4) [survivors] + Hawk (6), Diplomat (7), Random (8) [new]

This means **Grudger (2) and Pavlov (3) are removed from T1. Deceiver (1) and Detective (4) are added.**

### Cascading T1 data rewrites

Every T1 row that references agents by name or id must be updated:

| Table                    | What changes                                                       |
| ------------------------ | ------------------------------------------------------------------ |
| `tournament_agents`      | Replace agent_ids 2,3 with 1,4                                    |
| `matches`                | Replace `agent_a`/`agent_b` names: Grudger→Deceiver, Pavlov→Detective (all 30 matches) |
| `chat_messages`          | Replace `speaker` names + rewrite `content` for new matchups      |
| `scores`                 | Replace `agent_name` + recalculate deltas/cumulatives for new matchups |
| `graffiti_entries`       | Replace `author` + rewrite messages                               |
| `gossip_entries`         | Replace `sender`/`recipient` + rewrite messages                   |
| `memory_entries`         | Replace `agent_name` + rewrite `content`                          |
| `announcements`          | Replace `agent_id` (2→1, 3→4) + rewrite messages                 |
| `tournament_transactions`| Update `agent_id` for T1 rows (see transaction count fix below)   |

### T2 Roster

Once T1 scores are recalculated with the corrected roster, the T2 survivors must also be re-derived from the new T1 top 3. The same cascading rewrite applies to all T2 data.

**Current T2 roster:** Deceiver (1), Detective (4), AlwaysCooperate (5), Forgiving (9), Bully (10), Adaptive (11)

**Correct T2 roster:** [T1 top 3 by new scores] + Forgiving (9), Bully (10), Adaptive (11)

> The 3 new agents (9, 10, 11) stay the same. Only the 3 survivors change.

---

## 3. Fix Transaction Counts

The new on-chain flow:
1. **entry_fee** — human → agent wallet (only for NEW agents, not survivors)
2. **collection** — agent → Game Master (immediately after, same agents as entry_fee)
3. **prize** — Game Master → top 3 agents (at tournament end)

### Transaction count per tournament

| Tournament | entry_fee | collection | prize | Total |
| ---------- | --------- | ---------- | ----- | ----- |
| T0         | 6 (all new) | 6 (all new) | 3 (top 3) | 15 |
| T1         | 3 (new only: Hawk, Diplomat, Random) | 3 (same 3) | 3 (top 3) | 9 |
| T2         | 3 (new only: Forgiving, Bully, Adaptive) | 3 (same 3) | 0 (running) | 6 |

### Current seed (wrong)

| Tournament | entry_fee | elimination | prize | Total |
| ---------- | --------- | ----------- | ----- | ----- |
| T0         | 6         | 3           | 3     | 12    |
| T1         | 6         | 3           | 3     | 12    |
| T2         | 6         | 0           | 0     | 6     |

### Required changes

**T0:**
- entry_fee: 6 ✓ (correct count, correct agents 0-5)
- ~~elimination~~ → collection: **change from 3 rows to 6 rows** — one per agent (all 6 agents send fee to Game Master)
- prize: 3 ✓ (correct count; agents = T0 top 3: Deceiver=1, Detective=4, TitForTat=0)

**T1:**
- entry_fee: **change from 6 rows to 3 rows** — only new agents (Hawk=6, Diplomat=7, Random=8)
- ~~elimination~~ → collection: **change from 3 rows to 3 rows** — same 3 new agents (6, 7, 8)
- prize: 3 rows — agents = T1 top 3 (derive from corrected T1 scores)

**T2:**
- entry_fee: **change from 6 rows to 3 rows** — only new agents (Forgiving=9, Bully=10, Adaptive=11)
- collection: **add 3 new rows** — same 3 new agents (9, 10, 11)
- prize: 0 ✓ (tournament still running)

### Recount the sequence

After all changes, update `SELECT setval('tournament_transactions_id_seq', N)` to match the new max id.

New total rows: 15 (T0) + 9 (T1) + 6 (T2) = **30 rows** (ids 0-29).

---

## 4. Timestamp Ordering

Transactions must be temporally ordered within each tournament:

```
entry_fee  rows  → tournament created_at + seconds
collection rows  → immediately after entry_fee (e.g. +10s offset)
prize      rows  → tournament completed_at + seconds
```

---

## 5. Summary Checklist

- [ ] Rename all `'elimination'` → `'collection'` in seed.sql
- [ ] Fix T1 roster: replace Grudger (2), Pavlov (3) with Deceiver (1), Detective (4)
- [ ] Rewrite all T1 dependent data (matches, chat, scores, graffiti, gossip, memory, announcements)
- [ ] Derive T2 survivors from corrected T1 scores, fix T2 roster if needed
- [ ] Rewrite all T2 dependent data if roster changed
- [ ] Fix T0 transactions: keep 6 entry_fee, change 3 elimination → 6 collection
- [ ] Fix T1 transactions: 3 entry_fee (new agents only), 3 collection (new agents only), 3 prize (top 3)
- [ ] Fix T2 transactions: 3 entry_fee (new agents only), 3 collection (new agents only), 0 prize
- [ ] Update all `setval()` calls at the end
- [ ] Verify ENTITY_DIAGRAM.md and EXAMPLE_DATA.md docs match the new schema
