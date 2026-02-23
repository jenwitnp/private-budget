-- Migration: Add foreign key relationship between transactions and bank_accounts
-- This ensures Supabase can properly resolve the relationship in queries

-- Check if the constraint already exists before adding
ALTER TABLE transactions
ADD CONSTRAINT transactions_bank_account_id_fkey 
FOREIGN KEY (bank_account_id) 
REFERENCES bank_accounts (id) 
ON DELETE SET NULL
ON UPDATE CASCADE;
