-- Add member_id (ผู้แทน/ผู้รับมอบ) to schedule and transactions tables
-- Allows linking a member to both the schedule event and its financial transaction
-- so that the same person can be displayed on both the schedule page and the transaction page.

ALTER TABLE public.schedule
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_member_id
  ON public.schedule USING btree (member_id);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_member_id
  ON public.transactions USING btree (member_id);
