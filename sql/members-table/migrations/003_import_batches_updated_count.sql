-- Migration 003: add updated_count column to import_batches
-- Run once against any environment where schema.sql was applied before this change.

ALTER TABLE import_batches
  ADD COLUMN IF NOT EXISTS updated_count INT NOT NULL DEFAULT 0;
