-- 002_rls.sql
-- Enables Row Level Security on all tables.
--   anon  role → read-only  (frontend uses the public anon key)
--   service_role → full access (tournament engine uses the secret service key)

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agents',
      'tournaments',
      'tournament_agents',
      'matches',
      'chat_messages',
      'graffiti_entries',
      'gossip_entries',
      'memory_entries',
      'scores',
      'tournament_transactions'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO anon USING (true)',
      tbl || '_anon_select', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl || '_service_all', tbl
    );
  END LOOP;
END
$$;
