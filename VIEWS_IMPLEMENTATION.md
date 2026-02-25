# Transaction Views Implementation Summary

## Overview

Created comprehensive SQL views that provide complete transaction details by joining all related tables. This enables retrieving full transactional context in a single query.

## 📁 Files Created

### 1. **sql/views/transactions_detail.sql**

Main database view with all related information.

**Joins performed:**

- `transactions` + `users` (transaction creator via user_id)
- `transactions` + `bank_accounts` (bank details via bank_account_id)
- `transactions` + `districts` (district name via districts_id)
- `transactions` + `sub_districts` (sub-district name via sub_districts_id)
- `transactions` + `users` (approval user via approved_by)
- `transactions` + `users` (rejection user via rejected_by)
- `transactions` + `users` (payment user via paid_by)
- `transactions` + `users` (creation audit via created_by)

**Key Fields Returned:**

```
Transaction: id, transaction_number, amount, currency, status, item_name,
             description, notes, transaction_date, created_at, updated_at

User (Creator): user_id, user_username, user_first_name, user_last_name,
                user_full_name, user_email, user_phone, user_role

Bank Account: bank_account_id, account_number, account_name, bank_name,
              branch_name, account_holder_name, is_primary, is_active,
              verified, account_balance

Location: district_id, district_name, province, sub_district_id,
          sub_district_name, villages_count

Workflow: approved_by_name, approved_at, rejected_by_name, rejected_at,
          paid_by_name, paid_at

Audit: created_by_name, fee_amount, net_amount, error_code, error_message
```

### 2. **sql/views/transactions_detail_with_categories.sql**

Enhanced view with category support (optional migration).

**What it does:**

- Adds `category_id` column to transactions table
- Creates foreign key to categories table
- Provides view that includes category information
- Maintains all features from transactions_detail

**Run this if you want to:**

- Track transaction categories
- Enable category-based reporting
- Filter transactions by category

### 3. **sql/views/README.md**

Complete setup guide with:

- Step-by-step installation instructions
- Field mappings documentation
- 7 practical SQL query examples
- Performance optimization notes
- Security recommendations
- RLS setup examples

### 4. **lib/database.views.ts**

TypeScript type definitions for all views.

**Types Provided:**

- `TransactionDetail` - Main view output
- `TransactionDetailWithCategory` - Enhanced view with categories
- `TransactionSummary` - For list views
- `TransactionAuditTrail` - Workflow history
- `BankAccountStats` - Bank analytics
- `UserActivityStats` - User analytics
- `CategoryStats` - Category analytics
- `LocationTransactionStats` - Regional analytics

## 🚀 Setup Instructions

### Step 1: Create Base View

```bash
# Run in Supabase SQL editor:
# Copy and execute content from: sql/views/transactions_detail.sql
```

### Step 2: (Optional) Add Category Support

```bash
# If you want categories:
# Run content from: sql/views/transactions_detail_with_categories.sql
```

### Step 3: Update Your Application

```typescript
import type { TransactionDetail } from "@/lib/database.views";

// Use in your queries
const transactions = await queryTransactionDetails();
```

## 📊 Common Use Cases

### Get Full Transaction Details

```sql
SELECT * FROM transactions_detail
WHERE id = 'transaction-id'
```

### Get User's Transaction History

```sql
SELECT
  transaction_number, amount, status,
  approved_by_name, approved_at,
  bank_name, account_number
FROM transactions_detail
WHERE user_id = 'user-id'
ORDER BY transaction_date DESC
```

### Get Approval Audit Trail

```sql
SELECT
  transaction_number, user_full_name, amount,
  approved_by_name, approved_at,
  rejected_by_name, rejected_at,
  paid_by_name, paid_at
FROM transactions_detail
WHERE user_id = 'user-id'
```

### Get Bank Account Usage

```sql
SELECT
  bank_name, account_number,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions_detail
WHERE status = 'paid'
GROUP BY bank_account_id, bank_name, account_number
ORDER BY total DESC
```

### Get Transactions by Location

```sql
SELECT
  transaction_number, user_full_name, amount,
  district_name, sub_district_name, status
FROM transactions_detail
WHERE province = 'Nong Khai'
ORDER BY transaction_date DESC
```

## 🔐 Security Recommendations

1. **Enable Row Level Security (RLS)**

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

2. **Restrict View Access**
   - Use database roles with specific permissions
   - Don't expose all fields in public APIs
   - Filter sensitive data (IDs, emails, phone numbers)

3. **Audit Logging**
   - Enable query logging for sensitive views
   - Monitor access patterns
   - Log all modifications

## ⚡ Performance Notes

**Indexes Created Automatically:**

- `idx_transactions_user_id`
- `idx_transactions_status`
- `idx_transactions_date` (DESC)

**Optimization Tips:**

- Add WHERE clauses to filter by date ranges
- Use pagination (LIMIT/OFFSET)
- Consider materialized views for reporting
- Create custom indexes for frequently filtered columns

## 📋 Data Relationships Diagram

```
transactions
├─ user_id ──────────────→ users (creator)
├─ bank_account_id ──────→ bank_accounts
├─ districts_id ─────────→ districts
├─ sub_districts_id ─────→ sub_districts (→ districts)
├─ approved_by ──────────→ users (approver) [optional]
├─ rejected_by ──────────→ users (rejecter) [optional]
├─ paid_by ──────────────→ users (payer) [optional]
└─ category_id ──────────→ categories [optional, requires migration]
```

## 🔄 Usage in Application

### Example Hook for Fetching Transaction Details

```typescript
import { useQuery } from "@tanstack/react-query";
import type { TransactionDetail } from "@/lib/database.views";

export function useTransactionDetails(transactionId: string) {
  return useQuery({
    queryKey: ["transaction-detail", transactionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions_detail")
        .select("*")
        .eq("id", transactionId)
        .single();

      return data as TransactionDetail;
    },
  });
}
```

### Example Component

```typescript
function TransactionDetailView({ transactionId }: { transactionId: string }) {
  const { data: transaction } = useTransactionDetails(transactionId);

  if (!transaction) return <div>Loading...</div>;

  return (
    <div>
      <h2>{transaction.transaction_number}</h2>
      <p>User: {transaction.user_full_name}</p>
      <p>Bank: {transaction.bank_name}</p>
      <p>Location: {transaction.district_name}, {transaction.province}</p>
      <p>Approved by: {transaction.approved_by_name}</p>
      <p>Amount: ฿{transaction.amount.toLocaleString()}</p>
    </div>
  );
}
```

## 📝 Next Steps

1. ✅ Copy SQL from `sql/views/transactions_detail.sql`
2. ✅ Execute in Supabase SQL editor
3. ✅ Test with sample queries
4. ✅ (Optional) Run category migration
5. ✅ Update your transaction fetching to use views
6. ✅ Import types from `lib/database.views.ts`
7. ✅ Implement RLS policies for security

## 🆘 Troubleshooting

**View not found error:**

- Ensure SQL was executed successfully
- Check view exists: `SELECT * FROM information_schema.views WHERE table_name LIKE 'transactions%'`

**Slow queries:**

- Check indexes are created
- Add date range filters to queries
- Consider materialized view for complex reports

**Missing category data:**

- Run the category migration first
- Ensure transactions have category_id values set
- Use `transactions_detail_with_categories` view

## 📞 Support

Refer to:

- `sql/views/README.md` - Detailed documentation
- `lib/database.views.ts` - TypeScript types
- Example queries in both SQL files
