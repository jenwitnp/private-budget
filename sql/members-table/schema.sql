-- =============================================================================
-- Members Management — Supabase Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------------

CREATE TYPE member_level AS ENUM ('A', 'B', 'C', 'D');

CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'move', 'archive', 'restore', 'delete'
);

-- ---------------------------------------------------------------------------
-- 2. Level config  (org can rename A–D labels in Settings)
-- ---------------------------------------------------------------------------

CREATE TABLE level_config (
  level      member_level PRIMARY KEY,
  label_th   TEXT NOT NULL,
  label_en   TEXT NOT NULL
);

INSERT INTO level_config VALUES
  ('A', 'หัวสายงาน', 'Top Leader'),
  ('B', 'ผู้จัดการ',  'Manager'),
  ('C', 'หัวกลุ่ม',  'Group Lead'),
  ('D', 'สมาชิก',    'Member');

-- ---------------------------------------------------------------------------
-- 2b. Districts & sub-districts  (reference tables, managed externally)
--     Shown here for FK documentation only — do NOT re-create if they exist.
-- ---------------------------------------------------------------------------
-- CREATE TABLE districts (
--   id         BIGSERIAL PRIMARY KEY,
--   name       VARCHAR(255) NOT NULL UNIQUE,   -- includes "อำเภอ" prefix
--   province   VARCHAR(255) NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE TABLE sub_districts (
--   id             BIGSERIAL PRIMARY KEY,
--   district_id    BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
--   name           VARCHAR(255) NOT NULL,       -- includes "ตำบล" prefix
--   villages_count INT  NOT NULL DEFAULT 0,
--   examples       TEXT[] DEFAULT '{}',
--   created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE (district_id, name)
-- );

-- ---------------------------------------------------------------------------
-- 3. Import batches  (one row per Excel upload session)
-- ---------------------------------------------------------------------------

CREATE TABLE import_batches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         TEXT        NOT NULL,
  total_rows       INT         NOT NULL DEFAULT 0,
  imported_count   INT         NOT NULL DEFAULT 0,
  updated_count    INT         NOT NULL DEFAULT 0,
  skipped_count    INT         NOT NULL DEFAULT 0,
  error_count      INT         NOT NULL DEFAULT 0,
  default_level    member_level NOT NULL DEFAULT 'D',
  -- JSON map of Excel column header → DB column name used during import
  column_mapping   JSONB,
  imported_by      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. Members  (core table, self-referential hierarchy via upline_id)
-- ---------------------------------------------------------------------------

CREATE TABLE members (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal info
  first_name            TEXT         NOT NULL,
  last_name             TEXT         NOT NULL,
  age                   SMALLINT,

  -- Hierarchy
  level                 member_level NOT NULL DEFAULT 'D',
  upline_id             UUID         REFERENCES members(id) ON DELETE SET NULL,

  -- Address
  province              TEXT,
  district              TEXT,
  subdistrict           TEXT,
  village_no            SMALLINT,
  house_no              TEXT,
  election_zone         SMALLINT,              -- เขตเลือกตั้ง
  -- FK to reference tables (resolved from text names during import)
  district_id           BIGINT       REFERENCES districts(id)     ON DELETE SET NULL,
  sub_district_id       BIGINT       REFERENCES sub_districts(id) ON DELETE SET NULL,

  -- Electoral data (from Excel import)
  record_type           TEXT,                  -- รูปแบบ: บัญชีหลัก / บัญชีรอง
  voting_status         TEXT,                  -- สถานะ: ไปใช้สิทธิ / ไม่ไปใช้สิทธิ / แจ้งเหตุ

  -- Metadata
  tags                  TEXT[]       NOT NULL DEFAULT '{}',
  notes                 TEXT,

  -- Denormalised counts (maintained by triggers below)
  direct_downline_count INT          NOT NULL DEFAULT 0,

  -- Soft-delete / archive  (purge_at = archived_at + 30 days, enforced by app)
  is_archived           BOOLEAN      NOT NULL DEFAULT FALSE,
  archived_at           TIMESTAMPTZ,
  purge_at              TIMESTAMPTZ,

  -- Import deduplication: md5 of all importable fields; row skipped on re-import if hash unchanged
  row_hash              TEXT,

  -- Traceability
  import_batch_id       UUID         REFERENCES import_batches(id) ON DELETE SET NULL,
  added_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX members_upline_id_idx    ON members (upline_id);
CREATE INDEX members_level_idx        ON members (level);
CREATE INDEX members_province_idx     ON members (province);
CREATE INDEX members_is_archived_idx  ON members (is_archived);
CREATE INDEX members_tags_idx         ON members USING GIN (tags);
-- Thai-friendly full-text search on name
CREATE INDEX members_name_fts_idx     ON members
  USING GIN (to_tsvector('simple', first_name || ' ' || last_name));
-- Location filter indexes (partial — only active members)
CREATE INDEX members_district_idx        ON members (district)        WHERE NOT is_archived;
CREATE INDEX members_subdistrict_idx     ON members (subdistrict)     WHERE NOT is_archived;
CREATE INDEX members_village_no_idx      ON members (village_no)      WHERE NOT is_archived;
CREATE INDEX members_district_id_idx     ON members (district_id);
CREATE INDEX members_sub_district_id_idx ON members (sub_district_id);
CREATE INDEX members_row_hash_idx        ON members (row_hash) WHERE row_hash IS NOT NULL;
-- Fuzzy name search (migration 007) — requires pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX members_first_name_trgm_idx ON members USING GIN (first_name gin_trgm_ops) WHERE NOT is_archived;
CREATE INDEX members_last_name_trgm_idx  ON members USING GIN (last_name  gin_trgm_ops) WHERE NOT is_archived;
-- Compound level+name: upline candidate lookup (level filter is most selective)
CREATE INDEX members_level_first_name_idx ON members (level, first_name) WHERE NOT is_archived;

-- ---------------------------------------------------------------------------
-- 5. Member history  (audit log — every mutation appended here)
-- ---------------------------------------------------------------------------

CREATE TABLE member_history (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID         NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  action       audit_action NOT NULL,
  -- JSONB diff: { "field": { "old": ..., "new": ... }, ... }
  changes      JSONB,
  performed_by TEXT,
  performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX member_history_member_id_idx   ON member_history (member_id);
CREATE INDEX member_history_performed_at_idx ON member_history (performed_at DESC);

-- ---------------------------------------------------------------------------
-- 5b. Import row snapshots  (medium + ambiguous rows pending manual review)
-- ---------------------------------------------------------------------------

CREATE TABLE import_row_snapshots (
  id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID     NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,

  confidence        TEXT     NOT NULL,               -- 'medium' | 'ambiguous'
  score             INT      NOT NULL DEFAULT 0,
  row_data          JSONB    NOT NULL,                -- raw ImportRow (camelCase keys)
  matched_member_id UUID     REFERENCES members(id) ON DELETE SET NULL,
  changed_fields    TEXT[]   NOT NULL DEFAULT '{}',
  ambiguous_with    UUID[]   NOT NULL DEFAULT '{}',   -- other candidate member IDs
  previous_state    JSONB,                            -- member snapshot before import update (null = no update was applied)

  status            TEXT     NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rolled_back'
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX import_row_snapshots_batch_id_idx ON import_row_snapshots (batch_id);
CREATE INDEX import_row_snapshots_status_idx   ON import_row_snapshots (status);

ALTER TABLE import_row_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth: all on import_row_snapshots"
  ON import_row_snapshots FOR ALL TO authenticated USING (TRUE);

-- ---------------------------------------------------------------------------
-- 6. Trigger: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_set_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Trigger: maintain direct_downline_count on upline
--    Fires after INSERT / UPDATE of upline_id / DELETE on members
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_direct_downline_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.upline_id IS NOT NULL THEN
      UPDATE members
        SET direct_downline_count = direct_downline_count - 1
        WHERE id = OLD.upline_id;
    END IF;
    RETURN OLD;
  END IF;

  -- For INSERT or upline_id change: decrement old upline, increment new one
  IF TG_OP = 'UPDATE' AND OLD.upline_id IS DISTINCT FROM NEW.upline_id THEN
    IF OLD.upline_id IS NOT NULL THEN
      UPDATE members
        SET direct_downline_count = direct_downline_count - 1
        WHERE id = OLD.upline_id;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT')
     OR (TG_OP = 'UPDATE' AND OLD.upline_id IS DISTINCT FROM NEW.upline_id)
  THEN
    IF NEW.upline_id IS NOT NULL THEN
      UPDATE members
        SET direct_downline_count = direct_downline_count + 1
        WHERE id = NEW.upline_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER members_sync_downline_count
  AFTER INSERT OR UPDATE OF upline_id OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION sync_direct_downline_count();

-- ---------------------------------------------------------------------------
-- 8. Function: total descendants (recursive, excludes archived)
--    Usage: SELECT member_total_descendants('<uuid>');
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION member_total_descendants(root_id UUID)
RETURNS INT LANGUAGE sql STABLE AS $$
  WITH RECURSIVE tree AS (
    SELECT id
      FROM members
     WHERE upline_id = root_id
       AND NOT is_archived
    UNION ALL
    SELECT m.id
      FROM members m
      JOIN tree t ON m.upline_id = t.id
     WHERE NOT m.is_archived
  )
  SELECT COUNT(*)::INT FROM tree;
$$;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
--    All tables locked to authenticated users.
--    Tighten per-role (owner / editor / viewer) when auth is wired up.
-- ---------------------------------------------------------------------------

-- ALTER TABLE members        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE member_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE level_config   ENABLE ROW LEVEL SECURITY;

-- -- members
-- CREATE POLICY "auth: read members"
--   ON members FOR SELECT TO authenticated USING (TRUE);
-- CREATE POLICY "auth: insert members"
--   ON members FOR INSERT TO authenticated WITH CHECK (TRUE);
-- CREATE POLICY "auth: update members"
--   ON members FOR UPDATE TO authenticated USING (TRUE);
-- CREATE POLICY "auth: delete members"
--   ON members FOR DELETE TO authenticated USING (TRUE);

-- -- import_batches
-- CREATE POLICY "auth: all on import_batches"
--   ON import_batches FOR ALL TO authenticated USING (TRUE);

-- -- member_history  (read-only for authenticated; writes come from server functions)
-- CREATE POLICY "auth: read member_history"
--   ON member_history FOR SELECT TO authenticated USING (TRUE);

-- -- level_config
-- CREATE POLICY "auth: read level_config"
--   ON level_config FOR SELECT TO authenticated USING (TRUE);
-- CREATE POLICY "auth: update level_config"
--   ON level_config FOR UPDATE TO authenticated USING (TRUE);
