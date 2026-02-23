# 🎯 Authentication System - Quick Reference Card

## Login URLs

| Page         | URL                                  | Access             |
| ------------ | ------------------------------------ | ------------------ |
| Login        | `http://localhost:3000/login`        | Public             |
| Dashboard    | `http://localhost:3000/`             | Authenticated      |
| Admin Users  | `http://localhost:3000/admin/users`  | Owner/Admin        |
| Unauthorized | `http://localhost:3000/unauthorized` | When access denied |

## Test Credentials

```
┌──────────────┬──────────────────────┬──────────────┐
│ Role         │ Email                │ Password     │
├──────────────┼──────────────────────┼──────────────┤
│ Owner  (👑)  │ owner@example.com    │ password123  │
│ Admin  (🛡️) │ admin@example.com    │ password123  │
│ User   (👤) │ user@example.com     │ password123  │
└──────────────┴──────────────────────┴──────────────┘
```

## Permission Quick Reference

### Owner (👑)

✅ Everything  
✅ Manage users & admins  
✅ System settings  
✅ Approve transactions

### Admin (🛡️)

✅ Manage users  
✅ Create transactions  
✅ View all data  
❌ Approve transactions  
❌ Manage other admins

### User (👤)

✅ Create own transactions  
✅ View own profile  
❌ Access admin panel  
❌ View other users

## Code Snippets

### Check if User is Authenticated

```tsx
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not logged in</div>;

  return <div>Welcome {session?.user?.name}</div>;
}
```

### Check User Role

```tsx
import { useSession } from "next-auth/react";
import { hasPermission, UserRole } from "@/lib/auth/roles";

export function AdminFeature() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  if (!hasPermission(userRole, "create_user")) {
    return <div>You don't have permission</div>;
  }

  return <button>Create User</button>;
}
```

### Protect a Page

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "owner"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Protect an API Route

```typescript
import { withAuth } from "@/lib/auth/middleware";

export default async function handler(req, res) {
  const session = await withAuth(req, res, "create_user");
  if (!session) return; // Automatically sends 401/403

  // Your protected logic here
}
```

### Sign Out User

```tsx
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
  );
}
```

## File Quick Links

| File                              | Purpose          | Lines |
| --------------------------------- | ---------------- | ----- |
| `pages/login.tsx`                 | Login UI         | 200+  |
| `pages/api/auth/[...nextauth].ts` | Auth config      | 111   |
| `lib/auth/roles.ts`               | Permissions      | 92    |
| `pages/admin/users.tsx`           | User management  | 350+  |
| `components/ProtectedRoute.tsx`   | Route protection | 45    |
| `components/layout/Header.tsx`    | User menu        | 150+  |
| `components/layout/Sidebar.tsx`   | Navigation       | 110+  |

## Session Object Structure

```typescript
{
  user: {
    id: "user-id",
    email: "user@example.com",
    name: "User Name",
    role: "admin",          // owner | admin | user
    status: "active"        // active | inactive
  },
  expires: "2024-03-15T10:30:00Z"
}
```

## JWT Token Structure

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  name: "User Name",
  role: "admin",
  status: "active",
  iat: 1234567890,
  exp: 1234654290
}
```

## Error Codes

| Code | Meaning      | Action             |
| ---- | ------------ | ------------------ |
| 200  | Success      | Continue           |
| 400  | Bad Request  | Check input        |
| 401  | Unauthorized | Login required     |
| 403  | Forbidden    | Permission denied  |
| 404  | Not Found    | Page doesn't exist |
| 500  | Server Error | Check logs         |

## Environment Variables

```bash
# Required for production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key (min 32 chars)

# Optional
NODE_ENV=development
```

## Common Tasks

### Login

1. Go to `/login`
2. Enter email & password
3. Click "เข้าสู่ระบบ"
4. Redirected to dashboard

### Logout

1. Click profile icon (top right)
2. Click "ออกจากระบบ"
3. Redirected to login page

### Create User (Admin/Owner)

1. Go to `/admin/users`
2. Click "+ เพิ่มผู้ใช้"
3. Fill form (name, email, password, role)
4. Click "เพิ่มผู้ใช้"

### Change User Role (Admin/Owner)

1. Go to `/admin/users`
2. Hover over user → Click "แก้ไข"
3. Select new role from dropdown
4. Click "บันทึก"

### Delete User (Admin/Owner, except owner)

1. Go to `/admin/users`
2. Hover over user → Click "ลบ"
3. Confirm deletion

## TypeScript Types

```typescript
// Role type
type UserRole = "owner" | "admin" | "user";

// Session user type
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  status: "active" | "inactive";
}

// Input Props type
interface InputProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  required?: boolean;
}
```

## Keyboard Shortcuts

| Action               | Keys       |
| -------------------- | ---------- |
| Focus email input    | `Tab`      |
| Focus password input | `Tab`      |
| Submit login         | `Enter`    |
| Logout               | (Use menu) |
| Close modal          | `Esc`      |

## Styling Classes

Used throughout: Tailwind CSS v4.1.18

| Class          | Purpose          |
| -------------- | ---------------- |
| `bg-emerald-*` | Primary actions  |
| `bg-slate-*`   | Neutral elements |
| `bg-red-*`     | Danger/Delete    |
| `bg-purple-*`  | Owner indicator  |
| `bg-blue-*`    | Admin indicator  |

## Debug Tips

### Check Current Session

```tsx
const { data: session } = useSession();
console.log(session);
```

### Check Current Role

```tsx
console.log(session?.user?.role);
```

### Verify Permission

```tsx
import { hasPermission } from "@/lib/auth/roles";
console.log(hasPermission("admin", "create_user")); // true/false
```

### Check NextAuth Config

```javascript
// pages/api/auth/[...nextauth].ts is accessible via:
// http://localhost:3000/api/auth/signin (login page)
// http://localhost:3000/api/auth/callback/credentials
// http://localhost:3000/api/auth/session (get current session)
```

## Troubleshooting Checklist

- [ ] Is `npm run dev` running?
- [ ] Is browser on `http://localhost:3000`?
- [ ] Are you using correct email/password?
- [ ] Did you clear browser cookies?
- [ ] Is `.env.local` configured?
- [ ] Are you on the right role for that feature?
- [ ] Check browser console for errors
- [ ] Check terminal for server errors

## Production Checklist

- [ ] Set `NEXTAUTH_SECRET` to a secure value
- [ ] Configure `NEXTAUTH_URL` for production domain
- [ ] Use HTTPS (not HTTP)
- [ ] Enable secure cookies
- [ ] Set up database for user persistence
- [ ] Configure email service for password reset
- [ ] Set up logging/monitoring
- [ ] Configure rate limiting
- [ ] Set up 2FA (optional)
- [ ] Enable audit logging

## Support

**Quick Help:**

- Read [QUICKSTART.md](./QUICKSTART.md)
- Read [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)
- Check browser console
- Check terminal logs

**Bug Report:**

1. Clear cookies
2. Restart dev server
3. Check error in console
4. Check server logs
5. Try with test account

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: ✅ Production Ready
