# Authentication & Authorization System

## Overview

The Budget application implements a three-tier role-based access control (RBAC) system using **Next.js**, **NextAuth**, and **JWT** tokens. The system provides granular permission management across the entire application.

## Three-Tier Role System

### 1. **Owner (เจ้าของ)**

- **Access Level**: Complete system access
- **Permissions**:
  - ✅ All permissions
  - ✅ Approve withdrawals
  - ✅ Manage users (create, edit, delete)
  - ✅ Manage admin accounts
  - ✅ Create transactions
  - ✅ View all transactions
  - ✅ View all users
  - ✅ System settings

### 2. **Admin (ผู้ดูแล)**

- **Access Level**: Administrative functions
- **Permissions**:
  - ✅ Create users
  - ✅ Create transactions
  - ✅ View all transactions
  - ✅ View all users
  - ✅ Manage user accounts

### 3. **User (ผู้ใช้ธรรมดา)**

- **Access Level**: Basic functionality
- **Permissions**:
  - ✅ Create own transactions
  - ✅ View own transactions
  - ✅ View own profile

## Test Accounts

| Role  | Email             | Password    | Description           |
| ----- | ----------------- | ----------- | --------------------- |
| Owner | owner@example.com | password123 | Full system access    |
| Admin | admin@example.com | password123 | Administrative access |
| User  | user@example.com  | password123 | Regular user access   |

## Authentication Flow

### 1. Login Process

```
┌─────────────────┐
│  Login Page     │
│  (pages/login)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  NextAuth Credentials    │
│  Provider                │
└────────┬─────────────────┘
         │ Email + Password
         ▼
┌──────────────────────────┐
│  bcryptjs Validation     │
│  (verify password hash)  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  JWT Token Generated     │
│  (includes role, id)     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Session Created         │
│  (30-day max age)        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Redirect to Dashboard   │
│  or callback URL         │
└──────────────────────────┘
```

### 2. Authorization Check

Every protected route checks:

1. **Authentication**: User is logged in
2. **Role-based Permission**: User's role has required permission
3. **Action Authorization**: User can perform requested action

## File Structure

```
project/
├── pages/
│   ├── login.tsx                      # Login UI
│   ├── unauthorized.tsx               # 403 error page
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].ts      # NextAuth configuration
│   │   └── users/
│   │       └── create.ts              # Create user API (protected)
│   └── admin/
│       └── users.tsx                  # User management (role-based)
│
├── lib/
│   └── auth/
│       ├── roles.ts                   # Role definitions & permissions
│       └── middleware.ts              # Auth API middleware
│
├── components/
│   ├── ProtectedRoute.tsx             # Route protection wrapper
│   └── layout/
│       ├── Header.tsx                 # Header with user menu
│       └── Sidebar.tsx                # Navigation (role-based)
└── types/
    └── next-auth.d.ts                 # TypeScript definitions
```

## Key Files

### 1. **Authentication Configuration** (`pages/api/auth/[...nextauth].ts`)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Validate email/password
        // Return user object with role
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Add role to JWT token
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      // Add role to session
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
};
```

### 2. **Role & Permission Matrix** (`lib/auth/roles.ts`)

```typescript
export const rolePermissions: Record<UserRole, string[]> = {
  owner: ["all", "approve_withdrawals", "manage_users", ...],
  admin: ["create_user", "create_transaction", "view_all_transactions", ...],
  user: ["create_transaction", "view_own_transactions", ...]
}

export function hasPermission(role: UserRole, permission: string): boolean {
  // Check if role has permission
}
```

### 3. **Protected Routes** (`ProtectedRoute.tsx`)

```typescript
export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
}) {
  const { data: session, status } = useSession();

  // Check authentication
  // Check role-based permission
  // Redirect if unauthorized
}
```

## Usage Examples

### Protecting a Page Component

```tsx
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "owner"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Checking Permissions in Component

```tsx
import { hasPermission, UserRole } from "@/lib/auth/roles";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  if (!hasPermission(userRole, "create_user")) {
    return <div>You don't have permission</div>;
  }

  return <button>Create User</button>;
}
```

### Protecting API Routes

```typescript
import { withAuth } from "@/lib/auth/middleware";

export default async function handler(req, res) {
  const session = await withAuth(req, res, "create_user");
  if (!session) return; // Automatically sends 401/403

  // Protected logic here
}
```

### Signing Out

```tsx
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</button>;
```

## Session & Token Structure

### JWT Token

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  name: "User Name",
  role: "admin",
  status: "active",
  iat: 1234567890,
  exp: 1234654290,
  jti: "jwt-id"
}
```

### Session Object

```typescript
{
  user: {
    id: "user-id",
    email: "user@example.com",
    name: "User Name",
    role: "admin",
    status: "active"
  },
  expires: "2024-03-15T10:30:00Z"
}
```

## Security Features

### 1. **Password Hashing**

- Uses `bcryptjs` library
- Bcrypt rounds: 10 (default)
- Passwords never stored in plaintext

### 2. **JWT Tokens**

- Signed tokens (HMAC-SHA256)
- 30-day expiration by default
- Contains role and user ID
- Secure httpOnly cookies

### 3. **Protected Routes**

- Check session before rendering
- Check permissions before allowing actions
- Redirect to login if unauthenticated
- Redirect to 403 if unauthorized

### 4. **API Protection**

- Middleware validates authentication
- Permission checking before processing
- Error responses without sensitive info

## Admin Panel Features

### User Management (`/admin/users`)

**Owner/Admin Only**

Features:

- ✅ View all users with their roles
- ✅ Create new users
- ✅ Change user roles (Owner only for owner role)
- ✅ Delete users (except owner)
- ✅ Filter by status (active/inactive)
- ✅ View user creation date
- ✅ Stats dashboard showing role breakdown

### Role Assignment

```
Owner   ←→ Can assign all roles
             (owner, admin, user)

Admin   ←→ Can assign admin/user roles
             (cannot assign owner)

User    ←→ Cannot manage users
             (no access to admin panel)
```

## Authentication Flow Diagram

### Client-Side Flow

```
1. User navigates to app
   ↓
2. useSession() checks for existing session
   ↓
3. If no session → Redirect to /login
   ↓
4. User enters credentials
   ↓
5. signIn() sends to NextAuth API
   ↓
6. JWT token created & stored in httpOnly cookie
   ↓
7. Session established with role
   ↓
8. Redirect to dashboard/callback URL
```

### Server-Side Flow

```
1. API request received with JWT cookie
   ↓
2. getServerSession() validates JWT
   ↓
3. Check user role & permissions
   ↓
4. If unauthorized → Return 401/403
   ↓
5. If authorized → Process request
   ↓
6. Log action (audit trail)
```

## Deployment Considerations

### Environment Variables Needed

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

### Production Checklist

- [ ] Set `NEXTAUTH_SECRET` to a strong random value
- [ ] Configure secure cookies (HTTPS only in prod)
- [ ] Implement database for user storage
- [ ] Set up proper logging/audit trails
- [ ] Configure rate limiting for login attempts
- [ ] Implement session refresh mechanism
- [ ] Set up password reset functionality
- [ ] Configure 2FA if needed

## Future Enhancements

- [ ] Implement database user persistence
- [ ] Add password reset functionality
- [ ] Implement 2-factor authentication (2FA)
- [ ] Add OAuth providers (Google, Microsoft)
- [ ] Session activity logging
- [ ] Suspicious login detection
- [ ] IP-based access control
- [ ] Custom permission roles

## Troubleshooting

### Issue: Can't access admin panel

**Solution**: Check that user role includes "create_user" or "view_all_transactions" permission

### Issue: Session expires too quickly

**Solution**: Adjust `maxAge` in authOptions (currently 30 days)

### Issue: Permissions not working

**Solution**: Verify role is correctly set in JWT callback

### Issue: Password validation fails

**Solution**: Ensure bcryptjs is installed and password matches hash

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT.io](https://jwt.io/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
