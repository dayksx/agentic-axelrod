-- 003_announcements.sql
-- Adds the announcements table: one Game Master broadcast per round per tournament.

CREATE TABLE announcements (
  id            serial       PRIMARY KEY,
  tournament_id int          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number  int          NOT NULL,
  message       text         NOT NULL
);

CREATE INDEX idx_announcements_tournament_round ON announcements(tournament_id, round_number);

-- RLS: same pattern as all other tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_anon_select
  ON announcements FOR SELECT TO anon USING (true);

CREATE POLICY announcements_service_all
  ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
