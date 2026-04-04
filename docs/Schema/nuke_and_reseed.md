Run this in the SQL Editor to nuke all data and re-seed:
First, paste and run this truncation block:

TRUNCATE
announcements,
chat_messages,
gossip_entries,
graffiti_entries,
memory_entries,
scores,
tournament_transactions,
matches,
tournament_agents,
tournaments,
agents
CASCADE;

Then paste the full contents of supabase/seed.sql into the SQL Editor and run it.
