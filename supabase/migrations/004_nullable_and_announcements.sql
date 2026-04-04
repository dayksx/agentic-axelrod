-- 004_nullable_and_announcements.sql
-- 1) matches: allow NULL decisions/deltas so matches can be inserted before decisions are made
-- 2) agents: allow NULL wallet_address/ens_name (added in Steps 5-6)
-- 3) announcements: add agent_id FK (one-to-many: agent has many announcements)
-- 4) scores: add unique constraint for upsert support

-- ============================================================
-- 1. matches — make decision/delta columns nullable
-- ============================================================

ALTER TABLE matches ALTER COLUMN decision_a DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN decision_b DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN delta_a    DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN delta_b    DROP NOT NULL;

ALTER TABLE matches DROP CONSTRAINT matches_decision_a_check;
ALTER TABLE matches DROP CONSTRAINT matches_decision_b_check;

ALTER TABLE matches ADD CONSTRAINT matches_decision_a_check
  CHECK (decision_a IS NULL OR decision_a IN ('C', 'D'));
ALTER TABLE matches ADD CONSTRAINT matches_decision_b_check
  CHECK (decision_b IS NULL OR decision_b IN ('C', 'D'));

-- ============================================================
-- 2. agents — make wallet_address and ens_name nullable
-- ============================================================

ALTER TABLE agents ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE agents ALTER COLUMN ens_name       DROP NOT NULL;

-- ============================================================
-- 3. announcements — add agent_id FK for proper relationship
-- ============================================================

ALTER TABLE announcements
  ADD COLUMN agent_id int NOT NULL REFERENCES agents(id) ON DELETE CASCADE;

CREATE INDEX idx_announcements_agent ON announcements(agent_id);

-- ============================================================
-- 4. scores — unique constraint for upsert (one row per agent per round)
-- ============================================================

ALTER TABLE scores
  ADD CONSTRAINT scores_tournament_agent_round_uq
  UNIQUE (tournament_id, agent_name, round_number);
