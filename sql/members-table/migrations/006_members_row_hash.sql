-- Row-hash column for import deduplication.
-- md5 of all importable fields joined by \x00; row is skipped on re-import if unchanged.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS row_hash TEXT;

CREATE INDEX IF NOT EXISTS members_row_hash_idx
  ON public.members (row_hash)
  WHERE row_hash IS NOT NULL;
