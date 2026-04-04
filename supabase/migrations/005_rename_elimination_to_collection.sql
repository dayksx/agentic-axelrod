-- 005_rename_elimination_to_collection.sql
-- Rename transaction type 'elimination' → 'collection' to reflect the actual flow:
--   entry_fee  = human → agent wallet (at tournament start)
--   collection = agent → Game Master  (immediately after entry_fee)
--   prize      = Game Master → agent  (at tournament end)

-- ============================================================
-- 1. Drop the old CHECK constraint (must happen before UPDATE)
-- ============================================================

ALTER TABLE tournament_transactions
  DROP CONSTRAINT tournament_transactions_type_check;

-- ============================================================
-- 2. Update existing rows
-- ============================================================

UPDATE tournament_transactions
  SET type = 'collection'
  WHERE type = 'elimination';

-- ============================================================
-- 3. Add the new CHECK constraint
-- ============================================================

ALTER TABLE tournament_transactions
  ADD CONSTRAINT tournament_transactions_type_check
  CHECK (type IN ('entry_fee', 'collection', 'prize'));
