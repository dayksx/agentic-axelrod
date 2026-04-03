-- 001_schema.sql
-- Creates all tables for the Agentic Axelrod tournament system.

-- ============================================================
-- agents: standalone entities that persist across tournaments
-- ============================================================
CREATE TABLE agents (
  id          serial       PRIMARY KEY,
  name        varchar(100) UNIQUE NOT NULL,
  strategy_prompt text     NOT NULL,
  url         text         NOT NULL,
  wallet_address varchar(42) UNIQUE NOT NULL,
  ens_name    varchar(255) UNIQUE NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================
-- tournaments: a single tournament run
-- ============================================================
CREATE TABLE tournaments (
  id           serial       PRIMARY KEY,
  status       varchar(20)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'running', 'completed')),
  total_rounds int          NOT NULL,
  total_agents int          NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================
-- tournament_agents: join table linking agents to tournaments
-- ============================================================
CREATE TABLE tournament_agents (
  id            serial PRIMARY KEY,
  tournament_id int    NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  agent_id      int    NOT NULL REFERENCES agents(id)      ON DELETE CASCADE,
  url           text   NOT NULL,
  UNIQUE (tournament_id, agent_id)
);

-- ============================================================
-- matches: one row per head-to-head within a round
-- ============================================================
CREATE TABLE matches (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number  int          NOT NULL,
  arena_id      int          NOT NULL,
  agent_a       varchar(100) NOT NULL,
  agent_b       varchar(100) NOT NULL,
  first_speaker varchar(100) NOT NULL,
  decision_a    varchar(1)   NOT NULL CHECK (decision_a IN ('C', 'D')),
  decision_b    varchar(1)   NOT NULL CHECK (decision_b IN ('C', 'D')),
  delta_a       int          NOT NULL,
  delta_b       int          NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================
-- chat_messages: 6 messages per match (3 per agent, alternating)
-- ============================================================
CREATE TABLE chat_messages (
  id          serial       PRIMARY KEY,
  match_id    int          NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  turn_number int          NOT NULL CHECK (turn_number BETWEEN 0 AND 5),
  speaker     varchar(100) NOT NULL,
  content     text         NOT NULL
);

-- ============================================================
-- graffiti_entries: arena wall messages visible to future rounds
-- ============================================================
CREATE TABLE graffiti_entries (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id      int          NOT NULL REFERENCES matches(id)     ON DELETE CASCADE,
  arena_id      int          NOT NULL,
  author        varchar(100) NOT NULL,
  round_number  int          NOT NULL,
  message       text         NOT NULL
);

-- ============================================================
-- gossip_entries: private directed messages between agents
-- ============================================================
CREATE TABLE gossip_entries (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id      int          NOT NULL REFERENCES matches(id)     ON DELETE CASCADE,
  sender        varchar(100) NOT NULL,
  recipient     varchar(100) NOT NULL,
  message       text         NOT NULL,
  round_number  int          NOT NULL
);

-- ============================================================
-- memory_entries: each agent's compressed round summary
-- ============================================================
CREATE TABLE memory_entries (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id      int          NOT NULL REFERENCES matches(id)     ON DELETE CASCADE,
  agent_name    varchar(100) NOT NULL,
  round_number  int          NOT NULL,
  content       text         NOT NULL
);

-- ============================================================
-- scores: one row per agent per round per tournament
-- ============================================================
CREATE TABLE scores (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  agent_name    varchar(100) NOT NULL,
  round_number  int          NOT NULL,
  delta         int          NOT NULL,
  cumulative    int          NOT NULL
);

-- ============================================================
-- tournament_transactions: on-chain transaction log
-- ============================================================
CREATE TABLE tournament_transactions (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  agent_id      int          NOT NULL REFERENCES agents(id)      ON DELETE CASCADE,
  type          varchar(20)  NOT NULL CHECK (type IN ('entry_fee', 'elimination', 'prize')),
  tx_hash       varchar(66)  NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now()
);


-- ============================================================
-- INDEXES for common UI queries
-- ============================================================

CREATE INDEX idx_tournament_agents_tournament ON tournament_agents(tournament_id);
CREATE INDEX idx_tournament_agents_agent      ON tournament_agents(agent_id);

CREATE INDEX idx_matches_tournament_round     ON matches(tournament_id, round_number);

CREATE INDEX idx_chat_messages_match          ON chat_messages(match_id);

CREATE INDEX idx_graffiti_tournament_arena    ON graffiti_entries(tournament_id, arena_id);

CREATE INDEX idx_gossip_tournament            ON gossip_entries(tournament_id);

CREATE INDEX idx_memory_tournament_agent      ON memory_entries(tournament_id, agent_name);

CREATE INDEX idx_scores_tournament_agent      ON scores(tournament_id, agent_name);
CREATE INDEX idx_scores_tournament_round      ON scores(tournament_id, round_number);

CREATE INDEX idx_transactions_tournament      ON tournament_transactions(tournament_id);
