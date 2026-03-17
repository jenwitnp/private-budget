-- Migration: Make transaction_id nullable in images table
-- Purpose: Support schedule-only images without requiring a transaction_id
-- When a user creates a schedule with images but NO withdrawal request,
-- we still want to save the images with only schedule_id

ALTER TABLE public.images
  ALTER COLUMN transaction_id DROP NOT NULL;

-- Add index for schedule_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_images_schedule_id ON public.images USING btree (schedule_id) TABLESPACE pg_default;

-- Add compound index for finding images by both schedule and transaction
CREATE INDEX IF NOT EXISTS idx_images_schedule_transaction ON public.images USING btree (schedule_id, transaction_id) TABLESPACE pg_default;
