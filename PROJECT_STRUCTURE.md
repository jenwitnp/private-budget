# Project Structure

This project is a Next.js Pages Router application backed by Supabase, NextAuth, Google Cloud Storage, React Query, Tailwind CSS, and React PDF.

## Top-Level Layout

```text
.
├── actions/                 Server-action style wrappers and workflow operations
├── components/              Reusable UI, layout, modals, dashboard, schedule views
├── docs/                    Existing system and feature documentation
├── fonts/                   Sarabun font files used by PDF/report rendering
├── hooks/                   React Query and UI hooks
├── lib/                     Shared clients, auth, permissions, providers, helpers, PDF
├── pages/                   Next.js pages and API routes
├── scripts/                 Local scripts and seed/setup helpers
├── server/                  Supabase data access and business logic
├── service/                 Storage service abstraction and GCS implementation
├── sql/                     Legacy/raw SQL schema, views, functions, seed files
├── styles/                  Global CSS
├── supabase/                Supabase CLI config and timestamped migrations
└── types/                   Shared TypeScript types
```

## Application Entry Points

- `pages/_app.tsx` wraps the application with `AppProviders`.
- `lib/providers/AppProviders.tsx` installs `SessionProvider`, `QueryClientProvider`, toast provider, auth provider, category provider, district provider, and transaction provider.
- Page routes live under `pages/*.tsx`, with admin pages under `pages/admin/*` and auth pages under `pages/auth/*`.
- API routes live under `pages/api/*`.

## Core Modules

### Pages

`pages/` contains user-facing routes:

- `index.tsx`: main grid/menu landing after auth.
- `dashboard.tsx`: dashboard charts and summary.
- `history.tsx`: transaction history, filters, withdrawal flow, reports.
- `schedule.tsx`: schedule management.
- `accounts.tsx`: bank account management.
- `complaints.tsx`: complaint management.
- `settings.tsx`: user profile/settings/password changes.
- `admin/users.tsx`: user administration.
- `admin/categories.tsx`: category administration.

### API Routes

Important API route groups:

- `pages/api/auth/[...nextauth].ts`: NextAuth credentials provider.
- `pages/api/upload.ts`: base64 image upload, processing, GCS write.
- `pages/api/delete-image.ts`: GCS image deletion.
- `pages/api/download-transaction.tsx`: transaction receipt PDF generation.
- `pages/api/generate-report.tsx`: transaction history PDF generation.
- `pages/api/data.ts`: generic table data endpoint.
- `pages/api/line/complain.ts`: LINE webhook complaint ingestion.
- `pages/api/members/*`: member lookup endpoints.
- `pages/api/schedules/search.ts`: schedule search endpoint.
- `pages/api/admin/seed-users.ts`: development seed endpoint.

### Server Data Layer

`server/*.server.ts` files contain Supabase-backed data operations:

- `transactions.server.ts`: transaction queries, detail queries, image queries, workflow data.
- `schedule.server.ts`: schedules, schedule detail, schedule images/delete flows.
- `withdrawal.server.ts`: withdrawal/transaction creation and image persistence.
- `categories.server.ts`: category CRUD and ordering.
- `districts.server.ts`: district and sub-district reads.
- `bank-accounts.server.ts`: bank account CRUD.
- `users.server.ts`: user CRUD and password hashing.
- `settings.server.ts`: settings and password changes.
- `complaints.server.ts`: complaints and complaint stats.
- `dashboard.server.ts`: dashboard aggregates.

### Actions

`actions/` wraps server logic for UI workflows:

- `transactions.ts`: transaction listing with permission-based filter injection.
- `workflow.ts`: approve/reject/pay workflow actions.
- `withdrawal.ts`: withdrawal form submission.
- `schedules.ts`: schedule submission and related transaction logic.
- `schedule-images.ts`: schedule image upload/delete records.
- `stats.ts`: transaction stats RPC calls.
- `complaints.ts`: complaint actions and stats.
- `auth.ts`: registration and username checks.

### Hooks

`hooks/` contains React Query hooks and UI helpers:

- Domain hooks: `useTransactions`, `useTransactionStats`, `useTransactionDetail`, `useSchedules`, `useScheduleImages`, `useCategories`, `useDistricts`, `useBankAccounts`, `useUsers`, `useSettings`.
- Toast/form helpers: `useToast`, `useAppToast`, `useFormWithToast`.

Several hooks import server modules directly, such as `hooks/useCategories.ts`, `hooks/useBankAccounts.ts`, `hooks/useSchedules.ts`, `hooks/useSettings.ts`, and `hooks/useUsers.ts`.

### Components

Major component groups:

- `components/layout/*`: sidebar/header/layout wrappers.
- `components/modals/*`: transaction workflow, withdrawal, payment, reports, detail.
- `components/schedule/*`: schedule cards, form modal, image modals, member autocomplete.
- `components/form/*`: form controls, date picker, autocomplete, image upload controls.
- `components/dashboard/*`: dashboard chart components.
- `components/ui/*`: basic UI primitives.

### Shared Library

Key `lib/` areas:

- `lib/supabaseClient.ts`: Supabase browser/admin client factory.
- `lib/supabase/query.ts`: generic Supabase CRUD/query helper.
- `lib/auth/*`: page/API auth helpers and role matrix.
- `lib/permissions/*`: transaction/UI permission system.
- `lib/providers/*`: global React contexts/providers.
- `lib/context/WorkflowContext.tsx`: transaction workflow state and modal orchestration.
- `lib/helpers/*`: upload/delete helpers, currency formatting, transaction filter mapping.
- `lib/pdf/*`: PDF templates.
- `lib/gcp/credentials.ts`: GCP credential resolution.

### Storage Service

`service/storage/` defines storage abstractions and Google Cloud Storage implementation:

- `index.ts`: service factory.
- `types.ts`: storage interfaces.
- `google-cloud-storage.ts`: GCS implementation.
- `vehicle-integration.ts`: additional storage integration example.

### Database and SQL

SQL assets are split across multiple locations:

- `supabase/migrations/*`: timestamped Supabase migrations.
- `supabase/production_schema.sql`: production schema dump.
- `sql/*.sql`: legacy/raw schema and seed scripts.
- `sql/migrations/*`: older migration files.
- `sql/supabase/migrations/*`: another migration namespace.
- `sql/members-table/*`: member table schema/migration set.
- `sql/views/*`: view definitions and README.

This split is workable for historical context, but it makes the source of truth unclear.

## Dependency Flow

Current high-level flow:

```text
pages/_app.tsx
  -> lib/providers/AppProviders.tsx
    -> auth/session/query/toast/category/district/transaction providers

pages/*.tsx
  -> components/*
  -> hooks/*
  -> actions/*
  -> server/*.server.ts types and sometimes functions

components/*
  -> hooks/*
  -> actions/*
  -> server/*.server.ts types and sometimes functions
  -> lib/permissions/*

hooks/*
  -> server/*.server.ts
  -> actions/*
  -> React Query

actions/*
  -> server/*.server.ts
  -> lib/permissions/*

server/*.server.ts
  -> lib/supabaseClient.ts
  -> lib/supabase/query.ts
  -> service/storage/*

pages/api/*
  -> server/*.server.ts
  -> lib/auth/*
  -> lib/supabaseClient.ts
  -> lib/gcp/credentials.ts
```

## Boundary Notes

The main architectural concern is that UI and hooks directly import `server/*.server.ts` functions. Examples include:

- `components/DashboardCharts.tsx` imports dashboard server functions.
- `components/TransactionDetailContent.tsx` imports `getTransactionImages`.
- `components/schedule/ScheduleCard.tsx` imports `getTransactionDetailById`.
- `hooks/useCategories.ts` imports category server functions.

In a Pages Router app, this makes client/server boundaries difficult to reason about. Server-only code should generally be reached through API routes, `getServerSideProps`, or a clearly supported server-action pattern.

## Generated and Local Artifacts

Observed generated/local artifacts in the project tree:

- `.next/`
- `node_modules/`
- `tsconfig.tsbuildinfo`
- `.DS_Store` files
- `.env.local`
- `credentials/`

Some are ignored by `.gitignore`, but they still increase local operational risk and can confuse analysis if included in scans.

## Suggested Structural Improvements

1. Create a single documented data access path for browser code: API routes or a supported server-action layer.
2. Keep `server/*.server.ts` server-only and prevent direct client imports.
3. Consolidate permissions into one module and make API/page/UI guards consume that same source.
4. Choose one database migration source of truth, preferably `supabase/migrations/*`.
5. Move generated/local artifacts out of review scope and keep `tsconfig.tsbuildinfo` untracked.
6. Split very large modules once behavior is covered by checks, especially `server/schedule.server.ts`, `server/transactions.server.ts`, `components/schedule/ScheduleFormModal.tsx`, and `pages/complaints.tsx`.
