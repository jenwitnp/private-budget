-- ===================================
-- Transaction Views - Quick Setup Guide
-- ===================================

/\*
OVERVIEW:
This directory contains SQL views for retrieving comprehensive transaction
details with all related information in a single query.

FILES:

1. transactions_detail.sql
   - Main view with all tables except categories
   - Use this for full transaction details
   - Includes: users, bank_accounts, districts, sub_districts, workflow participants

2. transactions_detail_with_categories.sql
   - Enhanced view that includes categories
   - Requires running the migration to add category_id to transactions table
   - Use this after adding category support

# SETUP INSTRUCTIONS:

## Step 1: Create the base view (required)

Run: transactions_detail.sql

This creates the main view that joins:

- transactions with users (creator)
- bank_accounts for account details
- districts for district name
- sub_districts for sub-district name
- workflow participants (approver, rejecter, payer)

## Step 2: (Optional) Add category support

If you want to include categories in transactions:

1. Run the migration in transactions_detail_with_categories.sql
   - Adds category_id column to transactions table
   - Creates foreign key constraint
   - Creates index for performance

2. Update your withdrawal form to capture category selection

3. Use transactions_detail_with_categories view for queries

# FIELD MAPPINGS:

Base View Returns:
├─ Transaction Fields
│ ├─ id, transaction_number, amount, currency, status
│ ├─ item_name, description, notes
│ └─ transaction_date, created_at, updated_at
│
├─ User Information (Creator)
│ ├─ user_id, user_username, user_full_name
│ ├─ user_email, user_phone, user_role
│ └─ user_id_card
│
├─ Bank Account Information
│ ├─ bank_account_id, account_number, account_name
│ ├─ bank_name, branch_name, account_holder_name
│ ├─ is_primary, is_active, verified
│ └─ account_balance
│
├─ Location Information
│ ├─ district_id, district_name, province
│ ├─ sub_district_id, sub_district_name
│ └─ villages_count
│
└─ Workflow Participants
├─ Approval: approved_by_id, approved_by_name, approved_at
├─ Rejection: rejected_by_id, rejected_by_name, rejected_at
├─ Payment: paid_by_id, paid_by_name, paid_at
└─ Creation Audit: created_by_id, created_by_name

# USAGE EXAMPLES:

## Example 1: Get all transactions with full details

SELECT \* FROM transactions_detail
ORDER BY transaction_date DESC
LIMIT 100;

## Example 2: Get transactions by specific user

SELECT
transaction_number,
amount,
status,
district_name,
approved_by_name,
approved_at
FROM transactions_detail
WHERE user_id = 'user-uuid-here'
ORDER BY transaction_date DESC;

## Example 3: Get approval audit trail

SELECT
transaction_number,
user_full_name,
amount,
status,
approved_by_name,
approved_at,
rejected_by_name,
rejected_at,
paid_by_name,
paid_at
FROM transactions_detail
WHERE user_id = 'user-uuid-here'
ORDER BY transaction_date DESC;

## Example 4: Get transactions by district and status

SELECT
transaction_number,
user_full_name,
amount,
district_name,
sub_district_name,
status,
bank_name,
account_number
FROM transactions_detail
WHERE province = 'Nong Khai' AND status = 'paid'
ORDER BY transaction_date DESC;

## Example 5: Get bank account usage statistics

SELECT
bank_name,
account_number,
account_holder_name,
COUNT(\*) as usage_count,
SUM(amount) as total_amount,
AVG(amount) as avg_amount,
MAX(transaction_date) as last_used
FROM transactions_detail
WHERE status = 'paid'
GROUP BY bank_account_id, bank_name, account_number, account_holder_name
ORDER BY usage_count DESC;

## Example 6: Get user activity statistics

SELECT
user_full_name,
user_email,
COUNT(\*) as total_transactions,
SUM(amount) as total_amount,
COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
MAX(transaction_date) as last_transaction
FROM transactions_detail
GROUP BY user_id, user_full_name, user_email
ORDER BY total_amount DESC;

## Example 7: Get transactions with categories (after migration)

SELECT
category_name,
category_color,
COUNT(\*) as count,
SUM(amount) as total_amount,
MAX(transaction_date) as last_used
FROM transactions_detail_with_categories
WHERE category_id IS NOT NULL
GROUP BY category_id, category_name, category_color
ORDER BY total_amount DESC;

# PERFORMANCE NOTES:

The views use LEFT JOINs to ensure all transactions are included
even if some related records don't exist.

Indexes are automatically created on:

- transactions(user_id)
- transactions(status)
- transactions(transaction_date DESC)
- bank_accounts(user_id)
- districts(id)
- sub_districts(district_id)

For better performance with large datasets:

1. Add WHERE clauses to filter by date ranges
2. Use pagination (LIMIT/OFFSET)
3. Consider creating materialized views for reporting
4. Add custom indexes for frequently filtered columns

# UPDATING THE VIEWS:

To modify a view, use:
CREATE OR REPLACE VIEW view_name AS ...

To drop a view:
DROP VIEW IF EXISTS transactions_detail CASCADE;

Note: DROP VIEW CASCADE will also drop dependent views.

# SECURITY NOTES:

These views expose sensitive information:

- User phone numbers and email addresses
- Bank account details
- Personal ID card numbers
- IP addresses and user agents

Recommended security measures:

1. Enable Row Level Security (RLS) on base table
2. Restrict view access with database roles
3. Use database audit logging
4. Implement application-level access controls
5. Never expose views publicly without filtering

Example RLS setup:
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

\*/

-- ===================================
-- View Creation Order
-- ===================================
-- 1. Create transactions_detail.sql first (base view)
-- 2. Then optionally create transactions_detail_with_categories.sql

-- ===================================
-- Verify Views Created
-- ===================================
-- SELECT table_name
-- FROM information_schema.views
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'transactions%';

-- ===================================
-- Test Query
-- ===================================
-- \d transactions_detail
-- SELECT COUNT(\*) FROM transactions_detail;
