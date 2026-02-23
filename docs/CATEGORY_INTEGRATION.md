# Category Integration into WithdrawModal

## Summary

Integrated dynamic category data from Supabase database into the WithdrawModal component. Categories are now fetched from the database instead of being hardcoded.

## Changes Made

### 1. Server Function (`server/categories.server.ts`)

**Added:** `getActiveCategories()` function

- Fetches only active categories from database
- Returns array of categories sorted by `display_order`
- Throws error for error handling
- Logs with emoji prefix: 📋

### 2. React Query Hook (`hooks/useCategories.ts`)

**Added:** `useActiveCategories()` hook

- Uses React Query to manage fetching state
- 5-minute stale time, 10-minute cache
- Handles loading and error states automatically
- Query key: `["categories", "active"]`

### 3. Select Component (`components/form/Select.tsx`)

**Enhanced:** Added `disabled` prop

- New prop: `disabled?: boolean`
- Applies disabled styling: gray background, cursor-not-allowed
- Prevents interaction while loading

### 4. WithdrawModal Component (`components/modals/WithdrawModal.tsx`)

**Updated:**

- Imported `useActiveCategories` hook
- Added: `const { data: categories, isLoading: categoriesLoading } = useActiveCategories()`
- Replaced hardcoded options with dynamic mapping:
  ```tsx
  options={
    categories?.map((category) => ({
      value: category.id,
      label: category.name,
    })) || []
  }
  ```
- Dynamic placeholder: "กำลังโหลด..." during loading, "-- เลือกหมวดหมู่ --" when ready
- Disabled while loading: `disabled={categoriesLoading}`

## Benefits

- ✅ No more hardcoded category data
- ✅ Real-time updates when categories change
- ✅ Automatic caching for performance
- ✅ Loading state feedback to users
- ✅ Uses UUID (category.id) instead of hardcoded numeric IDs
- ✅ Consistent with existing project pattern

## Category Data Structure

```typescript
{
  id: string (UUID)
  name: string (e.g., "ทั่วไป")
  description: string | null
  color: string | null
  status: "active" | "inactive"
  display_order: number
  created_at: string
  updated_at: string
}
```

## Usage Pattern

The implementation follows the same pattern used across the application:

- Server function with error handling
- React Query hook for state management
- Component-level integration with loading states
- Thai language UI
