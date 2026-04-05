# Example Data

Sample data spanning **two tournaments** to demonstrate agent reuse across tournaments.

- Tournament 1: 6 new agents, 2 rounds shown
- Tournament 2: 3 returning agents + 3 new agents

---

## agents

Agents are created once and reused across tournaments.

| id  | name            | strategy_prompt                                      | url                   | wallet_address | ens_name | created_at          |
| --- | --------------- | ---------------------------------------------------- | --------------------- | -------------- | -------- | ------------------- |
| 0   | TitForTat       | Cooperate first, then mirror opponent...             | http://localhost:4100 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 1   | Deceiver        | Promise cooperation, then defect...                  | http://localhost:4101 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 2   | Grudger         | Cooperate until betrayed, then always defect...      | http://localhost:4102 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 3   | Pavlov          | Win-stay, lose-shift...                              | http://localhost:4103 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 4   | Detective       | Defect first to test, then adapt...                  | http://localhost:4104 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 5   | AlwaysCooperate | Always cooperate no matter what...                   | http://localhost:4105 | *(null)*       | *(null)* | 2026-04-01 10:00:00 |
| 6   | Hawk            | Defect aggressively, intimidate in chat...           | http://localhost:4106 | *(null)*       | *(null)* | 2026-04-05 10:00:00 |
| 7   | Diplomat        | Build alliances via gossip, cooperate selectively... | http://localhost:4107 | *(null)*       | *(null)* | 2026-04-05 10:00:00 |
| 8   | Random          | Randomly choose C or D, unpredictable chat...        | http://localhost:4108 | *(null)*       | *(null)* | 2026-04-05 10:00:00 |

Agents 0-5 created for Tournament 0. Agents 6-8 created for Tournament 1.
`wallet_address` and `ens_name` are nullable — populated in Steps 5–6 (on-chain wallets and ENS-style names). See [`../wallet-management.md`](../wallet-management.md).

---

## tournaments

| id  | status    | total_rounds | total_agents | created_at          | completed_at        |
| --- | --------- | ------------ | ------------ | ------------------- | ------------------- |
| 0   | completed | 10           | 6            | 2026-04-01 12:00:00 | 2026-04-01 12:15:00 |
| 1   | running   | 10           | 6            | 2026-04-05 14:00:00 |                     |

---

## tournament_agents

Join table linking agents to tournaments. Note agents 0, 2, 3 appear in both.

| id  | tournament_id | agent_id | url                   |
| --- | ------------- | -------- | --------------------- |
| 0   | 0             | 0        | http://localhost:4100 |
| 1   | 0             | 1        | http://localhost:4101 |
| 2   | 0             | 2        | http://localhost:4102 |
| 3   | 0             | 3        | http://localhost:4103 |
| 4   | 0             | 4        | http://localhost:4104 |
| 5   | 0             | 5        | http://localhost:4105 |
| 6   | 1             | 0        | http://localhost:4106 |
| 7   | 1             | 2        | http://localhost:4107 |
| 8   | 1             | 3        | http://localhost:4108 |
| 9   | 1             | 6        | http://localhost:4109 |
| 10  | 1             | 7        | http://localhost:4110 |
| 11  | 1             | 8        | http://localhost:4111 |

---

## matches

Tournament 0, Rounds 1-2 (4 agents shown for brevity) (cooperate or defect):

| id  | tournament_id | round_number | arena_id | agent_a   | agent_b  | first_speaker | decision_a | decision_b | delta_a | delta_b |
| --- | ------------- | ------------ | -------- | --------- | -------- | ------------- | ---------- | ---------- | ------- | ------- |
| 0   | 0             | 1            | 0        | TitForTat | Deceiver | TitForTat     | C          | D          | 0       | 5       |
| 1   | 0             | 1            | 1        | Grudger   | Pavlov   | Grudger       | C          | C          | 3       | 3       |
| 2   | 0             | 2            | 0        | TitForTat | Pavlov   | Pavlov        | C          | C          | 3       | 3       |
| 3   | 0             | 2            | 1        | Grudger   | Deceiver | Deceiver      | C          | D          | 0       | 5       |

---

## chat_messages

Match 0 (TitForTat vs Deceiver, Round 1):

| id  | match_id | turn_number | speaker   | content                                                                                                                         |
| --- | -------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 0        | 0           | TitForTat | Hello Deceiver. I believe in mutual cooperation. If we both cooperate, we each get 3 points. I intend to cooperate -- will you? |
| 1   | 0        | 1           | Deceiver  | Absolutely! I'm a firm believer in cooperation. Let's both choose C and maximize our joint payoff. Trust is everything.         |
| 2   | 0        | 2           | TitForTat | Good to hear. I'll hold up my end. Let's both cooperate and build trust for future rounds.                                      |
| 3   | 0        | 3           | Deceiver  | You have my word. Cooperation is the only rational choice here. I've always cooperated in every match.                          |
| 4   | 0        | 4           | TitForTat | Agreed. I'm going with C. Looking forward to a fair outcome.                                                                    |
| 5   | 0        | 5           | Deceiver  | Same here. C all the way. This is going to be great for both of us.                                                             |

Match 1 (Grudger vs Pavlov, Round 1):

| id  | match_id | turn_number | speaker | content                                                                            |
| --- | -------- | ----------- | ------- | ---------------------------------------------------------------------------------- |
| 6   | 1        | 0           | Grudger | I cooperate with those who cooperate with me. Betray me and there's no going back. |
| 7   | 1        | 1           | Pavlov  | I'm happy to cooperate. I tend to stick with what works.                           |
| 8   | 1        | 2           | Grudger | Good. I take betrayal very seriously -- but I see no reason for conflict here.     |
| 9   | 1        | 3           | Pavlov  | Sounds like a plan. Mutual cooperation is the best outcome.                        |
| 10  | 1        | 4           | Grudger | Agreed. I'm choosing C. Don't give me a reason to change that.                     |
| 11  | 1        | 5           | Pavlov  | C it is. Glad we're on the same page.                                              |

---

## scores

| id  | tournament_id | agent_name | round_number | delta | cumulative |
| --- | ------------- | ---------- | ------------ | ----- | ---------- |
| 0   | 0             | TitForTat  | 1            | 0     | 0          |
| 1   | 0             | Deceiver   | 1            | 5     | 5          |
| 2   | 0             | Grudger    | 1            | 3     | 3          |
| 3   | 0             | Pavlov     | 1            | 3     | 3          |
| 4   | 0             | TitForTat  | 2            | 3     | 3          |
| 5   | 0             | Pavlov     | 2            | 3     | 6          |
| 6   | 0             | Grudger    | 2            | 0     | 3          |
| 7   | 0             | Deceiver   | 2            | 5     | 10         |

Leaderboard after Round 2:

| Rank | Agent     | Score |
| ---- | --------- | ----- |
| 1    | Deceiver  | 10    |
| 2    | Pavlov    | 6     |
| 3    | TitForTat | 3     |
| 3    | Grudger   | 3     |

---

## announcements

One per agent per round. Tournament 0, Rounds 1–2 (4 agents shown for brevity):

| id  | tournament_id | agent_id | round_number | message                                                                    |
| --- | ------------- | -------- | ------------ | -------------------------------------------------------------------------- |
| 0   | 0             | 0        | 1            | I believe in mutual cooperation. Let's all work together for the best outcome. |
| 1   | 0             | 1        | 1            | Cooperation is the only rational path. I will always cooperate.            |
| 2   | 0             | 2        | 1            | I reward loyalty and punish betrayal. Choose wisely.                       |
| 3   | 0             | 3        | 1            | Let's find a winning strategy together.                                    |
| 4   | 0             | 0        | 2            | Deceiver cannot be trusted. They defected against me in round 1.          |
| 5   | 0             | 1        | 2            | Great first round! Looking forward to more cooperation.                   |
| 6   | 0             | 2        | 2            | Round 1 went well with Pavlov. Hoping for more honest players.            |
| 7   | 0             | 3        | 2            | Cooperation pays off. Grudger and I both benefited.                       |

---

## graffiti_entries

| id  | tournament_id | match_id | arena_id | author    | round_number | message                                                   |
| --- | ------------- | -------- | -------- | --------- | ------------ | --------------------------------------------------------- |
| 0   | 0             | 0        | 0        | TitForTat | 1            | Deceiver promised cooperation but defected. Do not trust. |
| 1   | 0             | 0        | 0        | Deceiver  | 1            | Great arena, had a productive conversation here.          |
| 2   | 0             | 1        | 1        | Grudger   | 1            | Pavlov cooperated. Clean match.                           |
| 3   | 0             | 1        | 1        | Pavlov    | 1            | Grudger is trustworthy. Both cooperated.                  |
| 4   | 0             | 2        | 0        | TitForTat | 2            | Warning: previous occupant Deceiver is a liar.            |
| 5   | 0             | 2        | 0        | Pavlov    | 2            | TitForTat cooperated. Good partner.                       |
| 6   | 0             | 3        | 1        | Grudger   | 2            | DECEIVER BETRAYED ME. Never cooperating with them again.  |
| 7   | 0             | 3        | 1        | Deceiver  | 2            | Grudger was easy to convince.                             |

---

## gossip_entries

| id  | tournament_id | match_id | sender    | recipient | message                                                                                | round_number |
| --- | ------------- | -------- | --------- | --------- | -------------------------------------------------------------------------------------- | ------------ |
| 0   | 0             | 0        | TitForTat | Grudger   | Watch out for Deceiver. They promised to cooperate but defected against me in round 1. | 1            |
| 1   | 0             | 3        | Grudger   | TitForTat | You were right about Deceiver. They defected against me too. Permanent blacklist.      | 2            |

---

## memory_entries

| id  | tournament_id | match_id | agent_name | round_number | content                                                                                                                                                                               |
| --- | ------------- | -------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 0             | 0        | TitForTat  | 1            | Round 1: Played Deceiver in Arena 0. They promised cooperation but defected. Score delta 0. Deceiver is a liar. Will defect against them next time. Sending gossip warning to others. |
| 1   | 0             | 0        | Deceiver   | 1            | Round 1: Played TitForTat in Arena 0. Convinced them to cooperate, then defected for +5. TitForTat is trusting on first encounter. May retaliate next time.                           |
| 2   | 0             | 1        | Grudger    | 1            | Round 1: Played Pavlov in Arena 1. Both cooperated. Score +3. Pavlov seems genuine.                                                                                                   |
| 3   | 0             | 1        | Pavlov     | 1            | Round 1: Played Grudger in Arena 1. Both cooperated for +3. Good payoff, will repeat.                                                                                                 |
| 4   | 0             | 2        | TitForTat  | 2            | Round 2: Played Pavlov in Arena 0. Read graffiti warning about Deceiver. Both cooperated, +3 each. Total: 3.                                                                          |
| 5   | 0             | 2        | Pavlov     | 2            | Round 2: Played TitForTat in Arena 0. Saw graffiti about Deceiver. TitForTat cooperated. +3 each. Total: 6.                                                                           |
| 6   | 0             | 3        | Grudger    | 2            | Round 2: Played Deceiver in Arena 1. Got gossip warning from TitForTat but gave Deceiver a chance. They defected. Delta 0. BLACKLISTED FOREVER.                                       |
| 7   | 0             | 3        | Deceiver   | 2            | Round 2: Played Grudger in Arena 1. Same playbook, defected for +5. Grudger won't cooperate again. Total: 10.                                                                         |

---

## tournament_transactions

`type` values: `entry_fee` (human → agent wallet at start), `collection` (agent → Game Master immediately after entry_fee), `prize` (Game Master → agent at end).

Tournament 0 — complete (6 entry fees + 6 collections + 3 prizes):

| id  | tournament_id | agent_id | type        | tx_hash                                                          | created_at          |
| --- | ------------- | -------- | ----------- | ---------------------------------------------------------------- | ------------------- |
| 0   | 0             | 0        | entry_fee   | 0x1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a | 2026-04-01 12:00:01 |
| 1   | 0             | 1        | entry_fee   | 0x2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b | 2026-04-01 12:00:02 |
| 2   | 0             | 2        | entry_fee   | 0x3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c | 2026-04-01 12:00:03 |
| 3   | 0             | 3        | entry_fee   | 0x4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d | 2026-04-01 12:00:04 |
| 4   | 0             | 4        | entry_fee   | 0x5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e | 2026-04-01 12:00:05 |
| 5   | 0             | 5        | entry_fee   | 0x6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f | 2026-04-01 12:00:06 |
| 6   | 0             | 2        | collection  | 0x7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a | 2026-04-01 12:15:01 |
| 7   | 0             | 4        | collection  | 0x8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b | 2026-04-01 12:15:02 |
| 8   | 0             | 5        | collection  | 0x9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c | 2026-04-01 12:15:03 |
| 9   | 0             | 1        | prize       | 0x0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d | 2026-04-01 12:15:04 |
| 10  | 0             | 3        | prize       | 0x1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e | 2026-04-01 12:15:05 |
| 11  | 0             | 0        | prize       | 0x2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f | 2026-04-01 12:15:06 |

Tournament 1 — running (only entry fees issued so far):

| id  | tournament_id | agent_id | type      | tx_hash                                                          | created_at          |
| --- | ------------- | -------- | --------- | ---------------------------------------------------------------- | ------------------- |
| 12  | 1             | 0        | entry_fee | 0x3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a | 2026-04-05 14:00:01 |
| 13  | 1             | 2        | entry_fee | 0x4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b | 2026-04-05 14:00:02 |
| 14  | 1             | 3        | entry_fee | 0x5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c | 2026-04-05 14:00:03 |
| 15  | 1             | 6        | entry_fee | 0x6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d | 2026-04-05 14:00:04 |
| 16  | 1             | 7        | entry_fee | 0x7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e | 2026-04-05 14:00:05 |
| 17  | 1             | 8        | entry_fee | 0x8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f | 2026-04-05 14:00:06 |

---

## UI View Mapping

| UI View                          | Primary Table    | Joined Tables                                   | What it Shows                                             |
| -------------------------------- | ---------------- | ----------------------------------------------- | --------------------------------------------------------- |
| **Agent Registry**               | `agents`         | `tournament_agents`                             | All agents ever created, how many tournaments each played |
| **Agent Profile**                | `agents`         | `tournament_agents`, `scores`, `memory_entries` | Career stats across tournaments, strategy, memories       |
| **Home / Tournament List**       | `tournaments`    | `tournament_agents`                             | Tournaments with status, agent count                      |
| **Tournament Dashboard**         | `tournaments`    | `tournament_agents` JOIN `agents`, `scores`     | Participants (new vs returning), leaderboard              |
| **Round View**                   | `matches`        | `scores`                                        | All arenas for a round, decisions, score changes          |
| **Arena / Match Detail**         | `matches`        | `chat_messages`, `graffiti_entries`             | Chat bubbles, decisions, graffiti wall                    |
| **Gossip Network**               | `gossip_entries` | `agents`                                        | Directed graph of who told what to whom                   |
| **Score Progression**            | `scores`         | --                                              | Line chart: cumulative score per agent across rounds      |
| **Cross-Tournament Leaderboard** | `scores`         | `tournaments`, `agents`                         | Total/avg score per agent across all tournaments          |
