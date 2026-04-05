-- Standalone waitlist / signup rows for the next tournament (not FK-linked to agents).
-- Consumed by `pnpm run series-players` when no new player names are passed on the CLI.

CREATE TABLE IF NOT EXISTS users (
  id               serial       PRIMARY KEY,
  agent_name       varchar(100) NOT NULL,
  strategy_prompt  text         NOT NULL,
  human_wallet     varchar(42)  NOT NULL,
  agent_wallet     varchar(42)  NOT NULL,
  tx_hash          varchar(66)  NOT NULL,
  reserved_date    timestamptz,
  tournament_date  timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_available
  ON users (created_at)
  WHERE tournament_date IS NULL AND reserved_date IS NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_anon_select
  ON users FOR SELECT TO anon USING (true);

CREATE POLICY users_service_all
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
