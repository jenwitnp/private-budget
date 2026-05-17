-- Migration 001: add Excel-sourced columns to members
-- Run once against any environment where schema.sql was applied before this change.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS election_zone  SMALLINT,
  ADD COLUMN IF NOT EXISTS record_type    TEXT,
  ADD COLUMN IF NOT EXISTS voting_status  TEXT;

COMMENT ON COLUMN members.election_zone  IS 'เขตเลือกตั้ง — from Excel column "เขตเลือกตั้ง"';
COMMENT ON COLUMN members.record_type    IS 'รูปแบบ — e.g. บัญชีหลัก, บัญชีรอง';
COMMENT ON COLUMN members.voting_status  IS 'สถานะ — ไปใช้สิทธิเลือกตั้ง / ไม่ไปใช้สิทธิ / แจ้งเหตุผู้ไม่ไปใช้สิทธิ';
