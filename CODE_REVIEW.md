# Code Review

This review focuses on architecture, security, performance, maintainability, and validation risks found by scanning the current repository.

## Executive Summary

The project is functional in shape but carries several legacy risks:

- Client/server boundaries are blurred.
- Several API routes perform sensitive reads/writes without authentication.
- Permission logic is duplicated and inconsistent.
- TypeScript checks are weakened by configuration and widespread `any`.
- The lint command is currently broken.
- Database migration files are split across multiple competing directories.

## Verification

Commands run:

```bash
npx tsc --noEmit
```

Result: passed.

```bash
npm run lint
```

Result: failed.

Failure:

```text
Invalid project directory provided, no such directory: /Users/jenwitnoppiboon/Documents/budget-project/lint
```

The lint failure is caused by `package.json` using `next lint` while the project has `next@^16.1.6`.

## High-Risk Findings

### 1. Unauthenticated Generic Data Endpoint

File: `pages/api/data.ts`

The route allows `GET` access to whitelisted tables including `users`, `bank_accounts`, `categories`, `districts`, `sub_districts`, and `transactions`. It does not check session or permissions before returning rows.

Risk:

- User data, bank account metadata, and transaction rows can be exposed.
- Any caller who can reach the API can enumerate allowed table samples.

Recommendation:

- Remove this endpoint if it is only for analysis/mockup generation.
- If still needed, protect it with admin-only auth and return only explicitly safe fields.
- Do not expose `users`, `bank_accounts`, or `transactions` through a generic table endpoint.

### 2. Upload and Delete APIs Have No Auth Guard

Files:

- `pages/api/upload.ts`
- `pages/api/delete-image.ts`

Both routes perform Google Cloud Storage operations without session or permission checks.

Risk:

- Unauthenticated users can upload images.
- Unauthenticated users can delete bucket objects if they know or guess filenames.
- Upload endpoint accepts large base64 payloads up to `50mb`, which can be abused for cost/resource exhaustion.

Recommendation:

- Require `getServerSession` or a shared API guard before processing.
- Check ownership/permission against the transaction or schedule record.
- Validate filename format and storage path ownership before deleting.
- Add rate limiting and stricter upload count/size/type validation.

### 3. Weak NextAuth Secret Fallback

File: `pages/api/auth/[...nextauth].ts`

`NEXTAUTH_SECRET` falls back to `"your-secret-key"`.

Risk:

- Misconfigured environments can run with a predictable signing secret.
- JWT/session integrity depends on deployment configuration being correct by accident.

Recommendation:

- Fail startup/request handling when `NEXTAUTH_SECRET` is missing.
- Remove the fallback value.

### 4. Seed/Test Credentials Remain in Runtime Code

Files:

- `pages/api/auth/[...nextauth].ts`
- `pages/api/admin/seed-users.ts`
- `scripts/seed-users.ts`

The auth file contains mock users with known password hashes. The seed API returns test credentials in the response.

Risk:

- Test credentials and password assumptions can leak into production thinking or fixtures.
- Seed endpoints often become accidental operational backdoors.

Recommendation:

- Move seed users into scripts only.
- Keep seed APIs disabled or remove them.
- Ensure seed scripts require explicit local/dev environment confirmation.

### 5. Duplicate Permission Systems

Files:

- `lib/auth/roles.ts`
- `lib/permissions/config.ts`
- `lib/permissions/utils.ts`
- `lib/auth/middleware.ts`

There are at least two permission models:

- `lib/auth/roles.ts` has broad permissions like `manage_users`, `create_user`, `system_settings`.
- `lib/permissions/config.ts` focuses on transaction permissions and UI visibility.

Risk:

- API guards, page guards, and UI rendering can disagree.
- A user may see an action they cannot perform, or perform an action hidden in UI.
- Permission changes must be applied in multiple files.

Recommendation:

- Pick one permission source of truth.
- Make API guards, page guards, UI guards, and menu filtering all consume it.
- Add tests for owner/admin/user capabilities.

## Architecture Findings

### Client Components Import Server Modules

Examples:

- `components/DashboardCharts.tsx` imports `@/server/dashboard.server`.
- `components/TransactionDetailContent.tsx` imports `getTransactionImages` from `@/server/transactions.server`.
- `components/schedule/ScheduleCard.tsx` imports `getTransactionDetailById` from `@/server/transactions.server`.
- `hooks/useCategories.ts` imports `@/server/categories.server`.

Risk:

- Server-only code may be pulled into client bundles or fail at runtime.
- Secrets/admin clients can accidentally become reachable from browser-oriented modules.
- The project is Pages Router, so `"use server"` labels do not provide the same server-action contract as App Router server actions.

Recommendation:

- Route browser reads/writes through API routes or `getServerSideProps`.
- Keep `server/*.server.ts` imports out of client components and hooks.
- Use type-only imports from server modules only when necessary, or move shared types to `types/`.

### Supabase Client Mixes Browser and Server Concerns

File: `lib/supabaseClient.ts`

The module exports both an anon client and `getSupabaseAdmin`.

Risk:

- Server-only admin capability lives next to browser-used client code.
- Imports from this module require care everywhere.

Recommendation:

- Split into `lib/supabase/client.ts` and `lib/supabase/admin.ts`.
- Ensure admin module is only imported by API/server files.

### SQL Source of Truth Is Unclear

SQL exists in:

- `supabase/migrations/*`
- `supabase/production_schema.sql`
- `sql/migrations/*`
- `sql/supabase/migrations/*`
- `sql/members-table/migrations/*`
- raw `sql/*.sql`

Risk:

- Developers may apply migrations in the wrong order.
- Schema drift becomes hard to diagnose.
- Duplicate migrations such as nullable transaction ID changes suggest historical churn.

Recommendation:

- Treat `supabase/migrations/*` as the canonical migration path.
- Move legacy SQL into `sql/archive/` with a README explaining status.
- Add a schema reset/apply instruction to docs.

## Type Safety and Maintainability

### TypeScript Is Lenient

File: `tsconfig.json`

Current settings include:

- `allowJs: true`
- `strict: false`
- `skipLibCheck: true`

Observed scan result: `259` `any`-style usages across app code.

Risk:

- `npx tsc --noEmit` can pass while real nullability, session shape, query result, and boundary bugs remain.
- Supabase query result types are mostly bypassed with `(supabase as any)`.

Recommendation:

- Start with `noImplicitAny: true` and `strictNullChecks: true` in targeted modules.
- Move session augmentation into strong shared types.
- Replace repeated `as any` Supabase calls with typed database helpers.

### Large Files Are Doing Too Much

Large modules include:

- `server/schedule.server.ts`: 874 lines.
- `server/transactions.server.ts`: 771 lines.
- `components/schedule/ScheduleFormModal.tsx`: 862 lines.
- `pages/complaints.tsx`: 775 lines.
- `pages/settings.tsx`: 597 lines.
- `pages/admin/users.tsx`: 548 lines.

Risk:

- Higher regression risk during edits.
- Business logic, formatting, data access, and UI state are mixed.

Recommendation:

- Split only after adding coverage or manual verification flows.
- Extract pure formatters/mappers first.
- Extract API/data operations separately from UI state.

### Generic Query Helper Uses Dynamic Strings

File: `lib/supabase/query.ts`

`fetchData`, `saveData`, `updateData`, and `deleteData` accept dynamic table/column/filter strings and rely heavily on `any`.

Risk:

- Query errors become runtime-only.
- Table/column typos are not caught by TypeScript.
- Permission filtering depends on caller discipline.

Recommendation:

- Use typed repository functions for critical domains.
- Keep generic helper only for low-risk admin/dev utilities.

## Performance Findings

### Session Callback Performs Database Fetches Frequently

File: `pages/api/auth/[...nextauth].ts`

The session callback fetches fresh user data from Supabase on every session check.

Risk:

- Increased latency on pages/API calls that read sessions.
- Extra database load under normal navigation.

Recommendation:

- Store stable claims in JWT and refresh only when needed.
- Consider short cache windows or version-based invalidation for role/status changes.

### Dashboard Fetches Multiple Aggregates Client-Side

File: `components/DashboardCharts.tsx`

Dashboard data is loaded from the browser with `Promise.all`.

Risk:

- Delayed first useful render.
- Multiple independent requests/queries increase failure points.

Recommendation:

- Use a single dashboard API endpoint or server-side data load.
- Cache aggregate responses.

### Image Upload Uses Large Base64 Payloads

File: `pages/api/upload.ts`

The upload endpoint accepts base64 images in JSON with a `50mb` body parser limit.

Risk:

- Base64 increases payload size.
- Large JSON parsing can block request handling.
- Multiple images loop sequentially through Sharp and GCS upload.

Recommendation:

- Use multipart upload or direct signed-upload flow.
- Limit image count and per-image size.
- Consider streaming or direct-to-storage uploads.

## Anti-Patterns

- Direct client imports from `server/*.server.ts`.
- Multiple permission matrices.
- `as any` around Supabase and session objects.
- Runtime console logging throughout production code paths.
- Seed/test users embedded near auth code.
- Generic table API route.
- Generated build metadata tracked by git: `tsconfig.tsbuildinfo`.
- Empty route file exists at `pages/api/data/route.js`.
- Mixed Pages Router code with App Router conventions like `route.js` and `"use server"` assumptions.

## Recommended Fix Order

1. Protect or remove unauthenticated sensitive API routes: `pages/api/data.ts`, `pages/api/upload.ts`, `pages/api/delete-image.ts`.
2. Remove the `NEXTAUTH_SECRET` fallback and fail closed on missing auth secrets.
3. Consolidate permission logic into one source of truth.
4. Fix lint tooling for the installed Next.js version.
5. Stop importing server modules from client components/hooks.
6. Split Supabase anon/admin clients into separate modules.
7. Gradually tighten TypeScript settings and remove high-risk `any` usage.
8. Clarify database migration source of truth.
9. Add focused tests for auth, permissions, transaction visibility, and upload/delete authorization.

## Suggested Near-Term Checks

Add or restore these commands:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

Then add targeted tests around:

- Login with active/inactive users.
- Owner/admin/user permission matrix.
- Transaction list filtering by role.
- Upload/delete authorization.
- Generic data endpoint removal or authorization.
