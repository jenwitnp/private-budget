-- Migration: Add payment_method column to transactions table
-- Description: Add payment_method column to track transaction payment method (cash/transfer)
-- Date: 2026-02-23

-- Add payment_method column
ALTER TABLE transactions
ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'transfer';

-- Create index for payment_method lookups
CREATE INDEX idx_transactions_payment_method 
ON transactions USING btree (payment_method);

-- Add constraint to ensure valid payment methods
ALTER TABLE transactions
ADD CONSTRAINT transactions_payment_method_check
CHECK (payment_method IN ('cash', 'transfer', null));

-- Comment on the column
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used for this transaction: cash or transfer';
