-- ---------------------------------------------------------------------------
-- 007: pg_trgm fuzzy name search
-- Enables tone-mark-variant matching (e.g. แสงเพชร ↔ แสงเพ็ชร)
-- and prefix/partial name autocomplete on the upline search input.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes on name columns (partial: active members only)
CREATE INDEX IF NOT EXISTS members_first_name_trgm_idx
  ON members USING GIN (first_name gin_trgm_ops) WHERE NOT is_archived;

CREATE INDEX IF NOT EXISTS members_last_name_trgm_idx
  ON members USING GIN (last_name gin_trgm_ops) WHERE NOT is_archived;

-- Compound level + first_name: upline candidate search hits the level filter first
-- (most selective column), then scans only that level's names in order.
CREATE INDEX IF NOT EXISTS members_level_first_name_idx
  ON members (level, first_name) WHERE NOT is_archived;
