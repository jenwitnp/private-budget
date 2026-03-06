# Authentication Guard & Route Protection

This project provides multiple ways to protect routes and ensure only logged-in users can access pages.

## Options Available

### 1. Server-Side Protection (Recommended for Initial Page Load)

**File:** `/lib/auth/withAuth.ts`

#### Option A: Using `requireAuth` (Simplest)

```typescript
import { requireAuth } from "@/lib/auth/withAuth";

export default function MyPage() {
  // Component code
}

export const getServerSideProps = requireAuth;
```

#### Option B: Using `withAuth` HOC (Advanced)

```typescript
import { withAuth } from "@/lib/auth/withAuth";

export default function MyPage(props: any) {
  // Component code
}

export const getServerSideProps = withAuth(async (context) => {
  // Fetch additional data here
  const data = await fetch(...);

  return {
    props: {
      data,
    },
  };
});
```

### 2. Client-Side Protection (Runtime Check)

**File:** `/components/ProtectedRoute.tsx`

Wrap components that need authentication:

```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>
        {/* Page content - only shown if user is logged in */}
      </div>
    </ProtectedRoute>
  );
}
```

#### With Role/Permission Requirements:

```typescript
<ProtectedRoute requiredRoles={["admin", "owner"]}>
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute requiredPermission="view_all_transactions">
  <Reports />
</ProtectedRoute>
```

## What Happens

### When User is NOT Logged In:

- **Server-side (`requireAuth`)**: ✅ Redirects immediately at server level (before page loads)
- **Client-side (`ProtectedRoute`)**: Shows loading spinner, then redirects to login

### When User IS Logged In:

- ✅ Page loads normally
- ✅ User data available in `session`

### Special Cases:

- **No valid role**: Redirects to `/unauthorized`
- **Role mismatch**: Redirects to `/unauthorized`
- **Permission missing**: Redirects to `/unauthorized`

## Current Protected Pages

The following pages already have protection:

✅ `/pages/history.tsx`
✅ `/pages/accounts.tsx`
✅ `/pages/settings.tsx`
✅ `/pages/admin/users.tsx`
✅ `/pages/dashboard.tsx`
✅ `/pages/pdf-preview.tsx`

## Applying to Other Pages

### For Default Authentication Only:

```typescript
// At the bottom of your page file
export const getServerSideProps = requireAuth;
```

### For Authenticated + Additional Data:

```typescript
export const getServerSideProps = withAuth(async (context) => {
  // Your custom data fetching
  return {
    props: {
      yourData: {...},
    },
  };
});
```

### For Runtime Protection Only:

```typescript
export default function MyPage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

## Best Practices

1. **Use `requireAuth` on getServerSideProps** for most pages - faster and more secure
2. **Combine server & client** for dynamic components that change auth state
3. **Use `ProtectedRoute`** for conditional rendering within a page
4. **Specify roles/permissions** when you need fine-grained control

## Examples in Codebase

See these files for working examples:

- `/pages/history.tsx` - Uses server-side protection + Layout
- `/pages/accounts.tsx` - Uses server-side protection + Layout
- `/lib/auth/withAuth.ts` - Core auth guard implementation
