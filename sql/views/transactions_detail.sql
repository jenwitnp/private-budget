-- ===================================
-- Comprehensive Transaction Detail View
-- ===================================
-- This view joins transactions with all related tables to provide
-- complete transaction details including user info, bank accounts,
-- locations, and workflow participants

DROP VIEW IF EXISTS transactions_detail CASCADE;

CREATE OR REPLACE VIEW transactions_detail AS
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

-- ===== WORKFLOW PARTICIPANT JOINS =====
-- Users involved in approval/rejection/payment workflow
LEFT JOIN users approval_user ON t.approved_by = approval_user.id
LEFT JOIN users rejection_user ON t.rejected_by = rejection_user.id
LEFT JOIN users payment_user ON t.paid_by = payment_user.id

-- Creation audit trail
LEFT JOIN users created_by_user ON t.created_by = created_by_user.id;

-- ===================================
-- Create indexes for better performance
-- ===================================
CREATE INDEX IF NOT EXISTS idx_transactions_detail_user_id 
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_detail_status 
  ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_detail_date 
  ON transactions(transaction_date DESC);

-- ===================================
-- Grant permissions (if using Supabase RLS)
-- ===================================
-- Uncomment if you want to enable RLS on the view:
-- ALTER VIEW transactions_detail OWNER TO postgres;
-- GRANT SELECT ON transactions_detail TO authenticated;

-- ===================================
-- Example Queries
-- ===================================

-- Query 1: Get all transactions with full details
-- SELECT * FROM transactions_detail ORDER BY transaction_date DESC;

-- Query 2: Get transactions by status
-- SELECT 
--   transaction_number,
--   user_full_name,
--   amount,
--   status,
--   approved_by_name,
--   approved_at
-- FROM transactions_detail
-- WHERE status = 'approved'
-- ORDER BY transaction_date DESC;

-- Query 3: Get transactions for specific user with all details
-- SELECT * FROM transactions_detail
-- WHERE user_id = 'user-uuid-here'
-- ORDER BY transaction_date DESC;

-- Query 4: Get transaction approval audit trail
-- SELECT 
--   transaction_number,
--   user_full_name,
--   amount,
--   approved_by_name,
--   approved_at,
--   rejected_by_name,
--   rejected_at,
--   paid_by_name,
--   paid_at
-- FROM transactions_detail
-- WHERE status IN ('approved', 'paid', 'rejected');

-- Query 5: Get transactions by district
-- SELECT 
--   transaction_number,
--   user_full_name,
--   amount,
--   district_name,
--   sub_district_name,
--   status
-- FROM transactions_detail
-- WHERE province = 'Nong Khai'
-- ORDER BY transaction_date DESC;

-- Query 6: Get bank account usage
-- SELECT 
--   bank_name,
--   account_number,
--   account_holder_name,
--   COUNT(*) as usage_count,
--   SUM(amount) as total_amount,
--   MAX(transaction_date) as last_used
-- FROM transactions_detail
-- WHERE status = 'paid'
-- GROUP BY bank_account_id, bank_name, account_number, account_holder_name
-- ORDER BY usage_count DESC;
