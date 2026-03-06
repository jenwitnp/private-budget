# Dashboard Analytics Setup Guide

## Overview

The dashboard displays real-time analytics with three main data visualizations:

1. **District Totals** - Total paid amounts grouped by district
2. **Sub-District Totals** - Total paid amounts grouped by sub-district
3. **Category Totals** - Total paid amounts grouped by category

Plus summary cards showing overall statistics.

## Database Setup

### Step 1: Run the SQL Functions

First, you need to create the analytics functions in your Supabase database:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents from `sql/dashboard_functions.sql`
5. Click **Run**

This will create 4 PostgreSQL functions:

- `get_dashboard_summary()` - Overall statistics
- `get_district_totals()` - District breakdown
- `get_sub_district_totals()` - Sub-district breakdown
- `get_category_totals()` - Category breakdown

And create indexes for optimal performance.

### Step 2: Verify Functions

Run this query to verify the functions were created:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_%';
```

You should see 4 rows:

- get_dashboard_summary
- get_district_totals
- get_sub_district_totals
- get_category_totals

## Files Created

### Backend

- **`sql/dashboard_functions.sql`** - PostgreSQL functions and indexes
- **`server/dashboard.server.ts`** - Server-side data fetching functions
  - `getDashboardSummary()` - Fetch overall statistics
  - `getDistrictTotals()` - Fetch district data
  - `getSubDistrictTotals()` - Fetch sub-district data
  - `getCategoryTotals()` - Fetch category data

### Frontend

- **`components/DashboardCharts.tsx`** - Dashboard analytics UI component
  - `SummaryCards` - 6 KPI cards showing key metrics
  - `DistrictsChart` - Bar chart for district breakdown (top 10)
  - `SubDistrictsChart` - Bar chart for sub-district breakdown (top 10)
  - `CategoriesChart` - Bar chart for category breakdown

### Configuration

- **`lib/config/menuItems.ts`** - Updated with menu configuration (already exists)

## Features

### Summary Cards

Displays these key metrics:

- 💰 Total Paid Amount (net_amount for paid transactions)
- 📋 Total Transactions
- ✅ Total Paid Transactions
- ⏳ Total Pending Transactions
- 📍 Total Districts with transactions
- 🏷️ Total Categories used

### District Chart

- Shows top 10 districts by total paid amount
- Each bar shows:
  - District name
  - Total amount (฿)
  - Number of paid transactions / total transactions
  - Percentage of total

### Sub-District Chart

- Shows top 10 sub-districts by total paid amount
- Each bar shows:
  - Sub-district name
  - Parent district
  - Total amount (฿)
  - Number of paid transactions / total transactions
  - Percentage of total

### Category Chart

- Shows all categories by total paid amount
- Each bar shows:
  - Category name
  - Total amount (฿)
  - Number of paid transactions / total transactions
  - Percentage of total
- Color-coded with gradients

## Performance Optimization

The SQL functions use:

1. **Aggregation at database level** - Calculations done in PostgreSQL
2. **Indexes** - Created on commonly filtered columns:
   - `idx_transactions_status_net_amount`
   - `idx_transactions_district_status`
   - `idx_transactions_sub_district_status`
   - `idx_transactions_category_status`

3. **Stable functions** - Marked as `STABLE` for query caching
4. **Parallel execution** - Client fetches all data simultaneously with `Promise.all()`

## Integration

The dashboard is automatically displayed on the home page (GridMenu) below the menu section.

Users will see:

```
┌─────────────────────────┐
│   Menu Grid (4-item)    │
├─────────────────────────┤
│  Admin Menu (4-item)    │ (if authorized)
├─────────────────────────┤
│   [Logout Button]       │
├─────────────────────────┤
│ 📊 Analytics Section    │
│ ┌─────────────────────┐ │
│ │ Summary Cards (6)   │ │
│ ├─────────────────────┤ │
│ │ Districts Chart     │ │
│ ├─────────────────────┤ │
│ │ Sub-Districts Chart │ │
│ ├─────────────────────┤ │
│ │ Categories Chart    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Troubleshooting

### Charts Not Showing

1. Verify SQL functions created successfully
2. Check browser console for fetch errors
3. Verify Supabase credentials in `.env.local`
4. Check that transactions table has data with `status = 'paid'`

### Slow Performance

1. Check if indexes were created: `SELECT * FROM pg_stat_user_indexes;`
2. Run `VACUUM ANALYZE` on the transactions table
3. Check for missing data relationships (NULL foreign keys)

### Wrong Totals

- Ensure you're filtering by `status = 'paid'` only
- Check that `net_amount` is correctly calculated in transactions
- Verify district_id and category_id mappings

## Future Enhancements

Consider adding:

- Date range filters
- Export to PDF/Excel
- More detailed drill-down views
- Real-time refresh with auto-polling
- Custom chart types (pie, doughnut, etc.)
- YoY comparison charts

## SQL Query Examples

Test the functions manually:

```sql
-- Get dashboard summary
SELECT * FROM get_dashboard_summary();

-- Get district totals
SELECT * FROM get_district_totals();

-- Get top 5 categories
SELECT * FROM get_category_totals() LIMIT 5;

-- Get specific district stats
SELECT * FROM get_sub_district_totals()
WHERE district_name = 'เมืองนครไทย';
```

## References

- Supabase RPC: https://supabase.com/docs/guides/api/using-rpc
- PostgreSQL Aggregate Functions: https://www.postgresql.org/docs/current/functions-aggregate.html
- React Query: https://tanstack.com/query/latest
