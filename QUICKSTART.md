# Quick Start Guide - Authentication & Authorization

## 🚀 Getting Started

### 1. Start the Development Server

```bash
cd /Users/jenwitnoppiboon/Documents/budget-project/next-app
npm run dev
```

The application will start at `http://localhost:3000`

### 2. Login with Test Accounts

You can use any of these test accounts to log in:

**Owner Account (Full Access)**

- Email: `owner@example.com`
- Password: `password123`
- Can: Manage users, approve transactions, access all features

**Admin Account (Administrative Access)**

- Email: `admin@example.com`
- Password: `password123`
- Can: Create users, manage transactions, view reports

**User Account (Basic Access)**

- Email: `user@example.com`
- Password: `password123`
- Can: Create own transactions, view own profile

## 📋 Features Implemented

### ✅ Authentication Layer

- [x] Login page with email/password authentication
- [x] NextAuth.js integration with JWT strategy
- [x] Password hashing using bcryptjs
- [x] Session management with 30-day expiration
- [x] Logout functionality

### ✅ Authorization Layer

- [x] Role-based access control (RBAC) - 3 roles
- [x] Permission matrix for each role
- [x] Protected routes with role checking
- [x] API protection with permission middleware
- [x] Unauthorized error page

### ✅ Admin Panel

- [x] User management dashboard (`/admin/users`)
- [x] View all users with their roles
- [x] Create new users
- [x] Change user roles
- [x] Delete users (except owner)
- [x] Role statistics dashboard

### ✅ UI/UX

- [x] Responsive login page
- [x] User profile menu in header
- [x] Role-based navigation menu
- [x] Dynamic sidebar based on permissions
- [x] Logout button in dropdown menu

## 🔐 Test User Flows

### Flow 1: Login as Owner

1. Go to http://localhost:3000/login
2. Enter: `owner@example.com` / `password123`
3. Click "เข้าสู่ระบบ"
4. Access dashboard → Can see "ผู้ดูแลระบบ" (Admin) section in sidebar
5. Click "จัดการผู้ใช้งาน" to access user management
6. Can create users with any role (owner, admin, user)
7. Click profile icon → Select "ออกจากระบบ" to logout

### Flow 2: Login as Admin

1. Go to http://localhost:3000/login
2. Enter: `admin@example.com` / `password123`
3. Click "เข้าสู่ระบบ"
4. Access dashboard → Can see "ผู้ดูแลระบบ" (Admin) section
5. Click "จัดการผู้ใช้งาน" to manage users
6. Can create users with user/admin roles (not owner)
7. Cannot change owner's role

### Flow 3: Login as Regular User

1. Go to http://localhost:3000/login
2. Enter: `user@example.com` / `password123`
3. Click "เข้าสู่ระบบ"
4. Can see basic dashboard
5. No "ผู้ดูแลระบบ" section in sidebar
6. Cannot access `/admin/users` - redirects to /unauthorized
7. Can only view own profile and transactions

## 📁 File Structure

```
next-app/
├── pages/
│   ├── login.tsx                    ← Login page
│   ├── unauthorized.tsx             ← 403 error page
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].ts    ← NextAuth configuration
│   │   └── users/
│   │       └── create.ts            ← Create user API
│   └── admin/
│       └── users.tsx                ← Admin user management
├── lib/
│   └── auth/
│       ├── roles.ts                 ← Role definitions
│       └── middleware.ts            ← API protection
├── components/
│   ├── ProtectedRoute.tsx           ← Route wrapper
│   └── layout/
│       ├── Header.tsx               ← Updated with user menu
│       └── Sidebar.tsx              ← Updated with role-based nav
└── docs/
    └── AUTHENTICATION.md            ← Full documentation
```

## 🔧 Configuration

### Environment Setup

Create `.env.local` if it doesn't exist:

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
```

For production, generate a strong secret:

```bash
openssl rand -base64 32
```

## 🧪 Testing Authorization

### Test Admin Panel Access

1. **As Owner**: Full access to all user management features ✅
2. **As Admin**: Can manage users but limited role assignment ✅
3. **As User**: Redirected to /unauthorized ❌

### Test Protected Routes

Try accessing these routes:

- `/admin/users` - Protected, requires create_user permission
- `/` - Dashboard, accessible to all authenticated users
- `/unauthorized` - Error page for forbidden access

### Test API Protection

Make a request to create a user:

```bash
# This will work with admin/owner token
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","name":"New User","password":"pass123","role":"user"}'

# This will fail without authentication
```

## 🐛 Troubleshooting

### Issue: Can't login

- **Check**: Is the email/password correct? Use the test accounts above
- **Check**: Is NextAuth configured? See `.env.local`
- **Try**: Clear browser cookies and try again

### Issue: Redirects to /unauthorized

- **Check**: Does your role have permission for that page?
- **Check**: Admin users cannot access owner-only features

### Issue: Sidebar doesn't show admin menu

- **Check**: Is your account admin or owner?
- **Check**: Check `hasPermission()` in `/lib/auth/roles.ts`

### Issue: Changes not saving

- **Note**: This is a mock system. Changes only exist in session until page refresh
- **TODO**: Integrate with Supabase database

## 📖 Next Steps

### Integrate with Supabase

1. Create a Supabase project
2. Update `/pages/api/auth/[...nextauth].ts` to query Supabase
3. Replace `mockUsers` with database queries
4. Store created users in Supabase

### Add More Features

- [ ] Password reset functionality
- [ ] 2-factor authentication (2FA)
- [ ] User profile page
- [ ] Activity logging
- [ ] Email verification
- [ ] OAuth providers (Google, Microsoft)

### Database Schema

When implementing with Supabase, you'll need:

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  password_hash VARCHAR,
  role VARCHAR CHECK (role IN ('owner', 'admin', 'user')),
  status VARCHAR CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- audit_log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  resource VARCHAR,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Key Components

### LoginPage (`pages/login.tsx`)

- Beautiful login UI with test credentials display
- Email/password form
- Error message handling
- Redirect to dashboard on success

### ProtectedRoute (`components/ProtectedRoute.tsx`)

- Wraps pages that require authentication
- Checks for required roles
- Checks for specific permissions
- Redirects unauthorized users

### Header (`components/layout/Header.tsx`)

- Shows current user info
- Role display
- Dropdown menu with profile options
- Logout button

### Sidebar (`components/layout/Sidebar.tsx`)

- Shows different menu items based on role
- "Admin" section only for admin/owner
- Protected route indicators

## 📚 Documentation

See [AUTHENTICATION.md](./docs/AUTHENTICATION.md) for:

- Detailed authentication flow
- Role permission matrix
- API documentation
- Security features
- Deployment checklist

## 💡 Tips

1. **Test all three roles** - Each has different capabilities
2. **Check the console** - Helpful error messages
3. **Use DevTools** - See JWT token in Application tab
4. **Read AUTHENTICATION.md** - Complete technical reference
5. **Try protected routes** - Test access control

## 🚀 Production Ready?

✅ **YES for**:

- Basic authentication
- Role-based access control
- Protected routes
- API protection

⚠️ **NOT yet for**:

- User database persistence
- Production secret management
- Email verification
- Password reset
- Audit logging (stubbed)

## 📞 Support

See [AUTHENTICATION.md](./docs/AUTHENTICATION.md) for troubleshooting section
