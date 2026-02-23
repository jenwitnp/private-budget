-- Migration: Fix account_type enum to include all account types
-- This migration adds missing enum values to the account_type enum

-- First, check current enum values (for reference)
-- SELECT enum_range(NULL::account_type);

-- Drop the constraint that depends on the enum
ALTER TABLE public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_account_type_check;

-- Create new enum type with all values
CREATE TYPE account_type_new AS ENUM ('savings', 'checking', 'fixed');

-- Convert existing column to use new enum
ALTER TABLE public.bank_accounts ALTER COLUMN account_type TYPE account_type_new USING (account_type::text::account_type_new);

-- Drop old enum and rename new one
DROP TYPE IF EXISTS account_type;
ALTER TYPE account_type_new RENAME TO account_type;

-- Add back default
ALTER TABLE public.bank_accounts ALTER COLUMN account_type SET DEFAULT 'savings'::account_type;

-- Add NOT NULL constraint if needed
ALTER TABLE public.bank_accounts ALTER COLUMN account_type SET NOT NULL;

-- Verify the changes
SELECT enum_range(NULL::account_type);
