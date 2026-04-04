# Database Entity Relationship Diagram

```mermaid
erDiagram
    agents {
        serial id PK
        varchar name UK
        text strategy_prompt
        text url
        varchar wallet_address UK
        varchar ens_name UK
        timestamp created_at
    }

    tournaments {
        serial id PK
        varchar status
        int total_rounds
        int total_agents
        timestamp created_at
        timestamp completed_at
    }

    tournament_agents {
        serial id PK
        int tournament_id FK
        int agent_id FK
        text url
    }

    matches {
        serial id PK
        int tournament_id FK
        int round_number
        int arena_id
        varchar agent_a
        varchar agent_b
        varchar first_speaker
        varchar decision_a
        varchar decision_b
        int delta_a
        int delta_b
        timestamp created_at
    }

    chat_messages {
        serial id PK
        int match_id FK
        int turn_number
        varchar speaker
        text content
    }

    graffiti_entries {
        serial id PK
        int tournament_id FK
        int match_id FK
        int arena_id
        varchar author
        int round_number
        text message
    }

    gossip_entries {
        serial id PK
        int tournament_id FK
        int match_id FK
        varchar sender
        varchar recipient
        text message
        int round_number
    }

    announcements {
        serial id PK
        int tournament_id FK
        int round_number
        text message
    }

    memory_entries {
        serial id PK
        int tournament_id FK
        int match_id FK
        varchar agent_name
        int round_number
        text content
    }

    scores {
        serial id PK
        int tournament_id FK
        varchar agent_name
        int round_number
        int delta
        int cumulative
    }

    tournament_transactions {
        serial id PK
        int tournament_id FK
        int agent_id FK
        varchar type
        varchar tx_hash
        timestamp created_at
    }

    agents ||--o{ tournament_agents : "participates in"
    agents ||--o{ tournament_transactions : "involved in"
    tournaments ||--o{ tournament_transactions : "has"
    tournaments ||--o{ tournament_agents : "includes"
    tournaments ||--o{ matches : "has"
    tournaments ||--o{ graffiti_entries : "has"
    tournaments ||--o{ gossip_entries : "has"
    tournaments ||--o{ memory_entries : "has"
    tournaments ||--o{ announcements : "has"
    tournaments ||--o{ scores : "has"
    matches ||--o{ chat_messages : "has"
    matches ||--o{ graffiti_entries : "produced in"
    matches ||--o{ gossip_entries : "produced in"
    matches ||--o{ memory_entries : "produced in"
```

## Relationships

- **agents** are standalone entities. They persist across tournaments. Each agent has a unique name, strategy prompt, and default URL. Created once, reused in future tournaments.
- **tournaments** represent a single tournament run (10 rounds, 6 agents).
- **tournament_agents** is the join table linking agents to tournaments. The `url` column stores the agent's deployment URL for that specific tournament (may differ from the default if redeployed). Unique constraint on (tournament_id, agent_id).
- **matches** belong to a tournament. Each match records the two agents, arena, round, decisions, and score deltas.
- **chat_messages** belong to a match. 6 messages per match (3 per agent, strict alternating).
- **graffiti_entries** belong to both a tournament and a match. Persists across rounds within an arena.
- **gossip_entries** belong to both a tournament and a match. Private messages between agents.
- **announcements** belong to a tournament. One row per round — a broadcast string from the Game Master sent to all agents after each round. No match_id (round-level, not match-level).
- **memory_entries** belong to both a tournament and a match. Each agent's compressed round summary.
- **scores** belong to a tournament. One row per agent per round, tracking the delta and running cumulative total.
- **tournament_transactions** belong to a tournament and an agent. One row per onchain transaction. `type` is one of `entry_fee` (GM → agent at start), `elimination` (agent → GM at end, delegated), or `prize` (GM → agent at end). 12 rows per completed tournament: 6 entry fees + 3 eliminations + 3 prizes.

## Agent Lifecycle Across Tournaments

```mermaid
flowchart LR
    subgraph t1 [Tournament 1]
        A1[TitForTat]
        A2[Deceiver]
        A3[Grudger]
        A4[Pavlov]
        A5[Detective]
        A6[AlwaysCooperate]
    end

    subgraph t2 [Tournament 2]
        B1[TitForTat]
        B2[Grudger]
        B3[Pavlov]
        B4[Hawk]
        B5[Diplomat]
        B6[Random]
    end

    A1 -.->|"returning"| B1
    A3 -.->|"returning"| B2
    A4 -.->|"returning"| B3
```

- Tournament 1: 6 new agents created
- Tournament 2: 3 returning agents (TitForTat, Grudger, Pavlov) + 3 new agents (Hawk, Diplomat, Random)
- Returning agents keep their `agents.id` and appear in both tournaments via `tournament_agents`

## Key Queries for UI

| Query | Tables | Use Case |
|---|---|---|
| All agents | `agents` | Agent registry / roster page |
| Agent tournament history | `tournament_agents` JOIN `tournaments` | Agent profile: which tournaments they played |
| Tournament list | `tournaments` | Home page |
| Tournament participants | `tournament_agents` JOIN `agents` | Tournament detail sidebar |
| Leaderboard | `scores` WHERE max round per agent | Tournament view |
| Round results | `matches` WHERE round_number = N | Round view |
| Match detail | `matches` + `chat_messages` | Arena view (chat bubbles) |
| Score progression | `scores` ORDER BY round_number | Line chart per agent |
| Arena graffiti history | `graffiti_entries` WHERE arena_id = N | Arena sidebar |
| Gossip network | `gossip_entries` | Gossip graph visualization |
| Agent memory timeline | `memory_entries` WHERE agent_name = X | Agent detail view |
| Round announcement | `announcements` WHERE round_number = N | Announcement phase in arena view |
| Cross-tournament stats | `scores` GROUP BY agent_name across tournaments | Agent career stats |
