-- Migration: Make transaction_id nullable for schedule-only images
-- Purpose: Allow images to be stored for schedules without associated transactions

ALTER TABLE public.images
ALTER COLUMN transaction_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
ALTER TABLE public.images
DROP CONSTRAINT images_transaction_id_fkey;

ALTER TABLE public.images
ADD CONSTRAINT images_transaction_id_fkey 
  FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE;

-- Create composite index for schedule_id + transaction_id queries
CREATE INDEX IF NOT EXISTS idx_images_schedule_transaction 
  ON public.images (schedule_id, transaction_id) 
  WHERE transaction_id IS NOT NULL;

-- Add index for schedule-only images
CREATE INDEX IF NOT EXISTS idx_images_schedule_only 
  ON public.images (schedule_id) 
  WHERE schedule_id IS NOT NULL AND transaction_id IS NULL;
