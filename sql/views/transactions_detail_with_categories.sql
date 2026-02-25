-- ===================================
-- Category Support Migration
-- ===================================
-- This migration adds category support to transactions table
-- Run this after transactions_detail.sql if you want to include categories

-- Drop existing view if it exists
DROP VIEW IF EXISTS transactions_detail_with_categories CASCADE;

-- ===================================
-- Step 1: Add category_id column to transactions table
-- ===================================
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category_id UUID NULL;

-- Add foreign key constraint (safely, only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_category_id_fkey'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_category_id_fkey 
      FOREIGN KEY (category_id) 
      REFERENCES categories(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_category_id 
  ON transactions(category_id);

-- ===================================
-- Step 2: Enhanced View with Categories
-- ===================================
-- This view includes category information
-- Run this after adding the category_id column

CREATE OR REPLACE VIEW transactions_detail_with_categories AS
SELECT
  -- Transaction basic info
  t.id,
  t.transaction_number,
  t.amount,
  t.currency,
  t.status,
  t.item_name,
  t.description,
  t.notes,
  t.payment_method,
  t.transaction_date,
  t.created_at,
  t.updated_at,
  
  -- ===== USER INFORMATION =====
  -- Transaction creator
  u.id as user_id,
  u.username as user_username,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  CONCAT(u.first_name, ' ', u.last_name) as user_full_name,
  u.email as user_email,
  u.phone_number as user_phone,
  u.id_card_number as user_id_card,
  u.role as user_role,
  
  -- ===== BANK ACCOUNT INFORMATION =====
  ba.id as bank_account_id,
  ba.account_number,
  ba.account_name,
  ba.bank,
  ba.bank_name,
  ba.branch_name,
  ba.account_holder_name,
  ba.account_holder_id as account_holder_id_card,
  ba.is_primary as bank_account_is_primary,
  ba.is_active as bank_account_is_active,
  ba.verified as bank_account_verified,
  ba.account_balance,
  
  -- ===== LOCATION INFORMATION =====
  -- Districts
  d.id as district_id,
  d.name as district_name,
  d.province,
  
  -- Sub-districts
  sd.id as sub_district_id,
  sd.name as sub_district_name,
  sd.villages_count,
  
  -- ===== CATEGORY INFORMATION =====
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.color as category_color,
  c.icon as category_icon,
  
  -- ===== WORKFLOW PARTICIPANTS =====
  -- Approval
  approval_user.id as approved_by_id,
  CONCAT(approval_user.first_name, ' ', approval_user.last_name) as approved_by_name,
  approval_user.username as approved_by_username,
  t.approved_at,
  
  -- Rejection
  rejection_user.id as rejected_by_id,
  CONCAT(rejection_user.first_name, ' ', rejection_user.last_name) as rejected_by_name,
  rejection_user.username as rejected_by_username,
  t.rejected_at,
  
  -- Payment
  payment_user.id as paid_by_id,
  CONCAT(payment_user.first_name, ' ', payment_user.last_name) as paid_by_name,
  payment_user.username as paid_by_username,
  t.paid_at,
  
  -- Creation audit
  created_by_user.id as created_by_id,
  CONCAT(created_by_user.first_name, ' ', created_by_user.last_name) as created_by_name,
  
  -- ===== TRANSACTION STATUS DETAILS =====
  t.fee_amount,
  t.net_amount,
  t.error_code,
  t.error_message,
  t.ip_address,
  t.user_agent
  
FROM transactions t

-- ===== PRIMARY JOINS =====
-- User who created the transaction
LEFT JOIN users u ON t.user_id = u.id

-- Bank account details
LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id

-- Location information
LEFT JOIN districts d ON t.districts_id = d.id
LEFT JOIN sub_districts sd ON t.sub_districts_id = sd.id

-- Category information
LEFT JOIN categories c ON t.category_id = c.id

-- ===== WORKFLOW PARTICIPANT JOINS =====
-- Users involved in approval/rejection/payment workflow
LEFT JOIN users approval_user ON t.approved_by = approval_user.id
LEFT JOIN users rejection_user ON t.rejected_by = rejection_user.id
LEFT JOIN users payment_user ON t.paid_by = payment_user.id

-- Creation audit trail
LEFT JOIN users created_by_user ON t.created_by = created_by_user.id;

-- ===================================
-- Sample Query with Categories
-- ===================================
-- Get transactions by category with statistics
-- SELECT 
--   category_name,
--   category_color,
--   COUNT(*) as count,
--   SUM(amount) as total_amount,
--   AVG(amount) as avg_amount
-- FROM transactions_detail_with_categories
-- WHERE category_id IS NOT NULL
-- GROUP BY category_id, category_name, category_color
-- ORDER BY total_amount DESC;
