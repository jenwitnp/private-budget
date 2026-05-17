-- Migration 002: add import_row_snapshots table for manual review and rollback
-- Run once against any environment where schema.sql was applied before this change.

CREATE TABLE IF NOT EXISTS import_row_snapshots (
  id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID     NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,

  confidence        TEXT     NOT NULL,
  score             INT      NOT NULL DEFAULT 0,
  row_data          JSONB    NOT NULL,
  matched_member_id UUID     REFERENCES members(id) ON DELETE SET NULL,
  changed_fields    TEXT[]   NOT NULL DEFAULT '{}',
  ambiguous_with    UUID[]   NOT NULL DEFAULT '{}',
  previous_state    JSONB,

  status            TEXT     NOT NULL DEFAULT 'pending',
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS import_row_snapshots_batch_id_idx ON import_row_snapshots (batch_id);
CREATE INDEX IF NOT EXISTS import_row_snapshots_status_idx   ON import_row_snapshots (status);

ALTER TABLE import_row_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'import_row_snapshots'
      AND policyname = 'auth: all on import_row_snapshots'
  ) THEN
    CREATE POLICY "auth: all on import_row_snapshots"
      ON import_row_snapshots FOR ALL TO authenticated USING (TRUE);
  END IF;
END $$;
