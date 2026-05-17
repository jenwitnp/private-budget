-- Migration 008: member_stats — single-row counter table + triggers
-- Replaces the expensive full-table aggregate on the dashboard with an O(1) read.
-- this_month is intentionally excluded: it uses a partial index range scan instead
-- (month boundary can't be tracked atomically by triggers without pg_cron).

-- ── 1. Stats table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_stats (
  id         int         PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces single row
  total      int         NOT NULL DEFAULT 0,
  unassigned int         NOT NULL DEFAULT 0,
  count_a    int         NOT NULL DEFAULT 0,
  count_b    int         NOT NULL DEFAULT 0,
  count_c    int         NOT NULL DEFAULT 0,
  count_d    int         NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Partial index for this_month fast query ────────────────────────────────
-- Covers: WHERE NOT is_archived AND added_at >= date_trunc('month', NOW())
-- Only scans rows added this month instead of the full table.

CREATE INDEX IF NOT EXISTS idx_members_added_at_active
  ON members (added_at DESC)
  WHERE NOT is_archived;

-- ── 3. Trigger function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_member_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  d_total      int := 0;
  d_unassigned int := 0;
  d_a          int := 0;
  d_b          int := 0;
  d_c          int := 0;
  d_d          int := 0;
BEGIN
  -- Subtract OLD row contribution (UPDATE / DELETE)
  IF TG_OP IN ('UPDATE', 'DELETE') AND NOT OLD.is_archived THEN
    d_total      := d_total - 1;
    d_unassigned := d_unassigned - CASE WHEN OLD.upline_id IS NULL AND OLD.level != 'A' THEN 1 ELSE 0 END;
    d_a          := d_a          - CASE WHEN OLD.level = 'A' THEN 1 ELSE 0 END;
    d_b          := d_b          - CASE WHEN OLD.level = 'B' THEN 1 ELSE 0 END;
    d_c          := d_c          - CASE WHEN OLD.level = 'C' THEN 1 ELSE 0 END;
    d_d          := d_d          - CASE WHEN OLD.level = 'D' THEN 1 ELSE 0 END;
  END IF;

  -- Add NEW row contribution (UPDATE / INSERT)
  IF TG_OP IN ('UPDATE', 'INSERT') AND NOT NEW.is_archived THEN
    d_total      := d_total + 1;
    d_unassigned := d_unassigned + CASE WHEN NEW.upline_id IS NULL AND NEW.level != 'A' THEN 1 ELSE 0 END;
    d_a          := d_a          + CASE WHEN NEW.level = 'A' THEN 1 ELSE 0 END;
    d_b          := d_b          + CASE WHEN NEW.level = 'B' THEN 1 ELSE 0 END;
    d_c          := d_c          + CASE WHEN NEW.level = 'C' THEN 1 ELSE 0 END;
    d_d          := d_d          + CASE WHEN NEW.level = 'D' THEN 1 ELSE 0 END;
  END IF;

  -- Skip the UPDATE if nothing actually changed (e.g. unrelated column update)
  IF d_total = 0 AND d_unassigned = 0 AND d_a = 0 AND d_b = 0 AND d_c = 0 AND d_d = 0 THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  UPDATE member_stats SET
    total      = total      + d_total,
    unassigned = unassigned + d_unassigned,
    count_a    = count_a    + d_a,
    count_b    = count_b    + d_b,
    count_c    = count_c    + d_c,
    count_d    = count_d    + d_d,
    updated_at = now()
  WHERE id = 1;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- ── 4. Attach trigger to members ─────────────────────────────────────────────

DROP TRIGGER IF EXISTS member_stats_sync ON members;

CREATE TRIGGER member_stats_sync
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION trg_member_stats();

-- ── 5. Seed initial counts from current data ─────────────────────────────────

INSERT INTO member_stats (id, total, unassigned, count_a, count_b, count_c, count_d)
SELECT
  1,
  COUNT(*) FILTER (WHERE NOT is_archived)::int,
  COUNT(*) FILTER (WHERE NOT is_archived AND upline_id IS NULL AND level != 'A')::int,
  COUNT(*) FILTER (WHERE NOT is_archived AND level = 'A')::int,
  COUNT(*) FILTER (WHERE NOT is_archived AND level = 'B')::int,
  COUNT(*) FILTER (WHERE NOT is_archived AND level = 'C')::int,
  COUNT(*) FILTER (WHERE NOT is_archived AND level = 'D')::int
FROM members
ON CONFLICT (id) DO UPDATE SET
  total      = EXCLUDED.total,
  unassigned = EXCLUDED.unassigned,
  count_a    = EXCLUDED.count_a,
  count_b    = EXCLUDED.count_b,
  count_c    = EXCLUDED.count_c,
  count_d    = EXCLUDED.count_d,
  updated_at = now();

-- ── 6. Manual resync helper (run if counts ever drift) ───────────────────────
-- Usage: SELECT refresh_member_stats();

CREATE OR REPLACE FUNCTION refresh_member_stats()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE member_stats SET
    total      = (SELECT COUNT(*) FILTER (WHERE NOT is_archived)                                       FROM members)::int,
    unassigned = (SELECT COUNT(*) FILTER (WHERE NOT is_archived AND upline_id IS NULL AND level != 'A') FROM members)::int,
    count_a    = (SELECT COUNT(*) FILTER (WHERE NOT is_archived AND level = 'A')                       FROM members)::int,
    count_b    = (SELECT COUNT(*) FILTER (WHERE NOT is_archived AND level = 'B')                       FROM members)::int,
    count_c    = (SELECT COUNT(*) FILTER (WHERE NOT is_archived AND level = 'C')                       FROM members)::int,
    count_d    = (SELECT COUNT(*) FILTER (WHERE NOT is_archived AND level = 'D')                       FROM members)::int,
    updated_at = now()
  WHERE id = 1;
END;
$$;
