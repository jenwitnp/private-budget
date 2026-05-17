# Supabase Local Development Setup

## ✅ Setup Complete

Supabase is now configured for local development on your machine.

## 🚀 Quick Start

### Start Supabase Services

```bash
supabase start
```

### Stop Supabase Services

```bash
supabase stop
```

### View Status

```bash
supabase status
```

## 📍 Service URLs & Connection Details

### API & Database

- **API URL**: http://127.0.0.1:54321
- **GraphQL URL**: http://127.0.0.1:54321/graphql/v1
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **S3 Storage URL**: http://127.0.0.1:54321/storage/v1/s3

### Web Interfaces

- **Supabase Studio** (Web UI): http://127.0.0.1:54323
  - Access database tables, auth settings, and more
- **Email Testing** (Inbucket): http://127.0.0.1:54324
  - View emails sent by your application during local testing

### Analytics

- **Analytics Dashboard**: http://127.0.0.1:54327

## 🔑 Authentication Keys

### Anonymous Key (public, safe to expose)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Service Role Key (private, never expose in client code)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### JWT Secret

```
super-secret-jwt-token-with-at-least-32-characters-long
```

## 📦 Storage (S3)

- **Region**: local
- **Access Key**: 625729a08b95bf1b7ff351a663f3a23c
- **Secret Key**: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda373074259 07

## 📝 Environment Variables

Your `.env.local` has been configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NEXT_PUBLIC_SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_SUPABASE_STUDIO_URL=http://127.0.0.1:54323
```

## 🐳 Docker Containers Running

```
supabase_db_budget-project          (PostgreSQL 15)
supabase_kong_budget-project        (API Gateway)
supabase_rest_budget-project        (PostgREST API)
supabase_realtime_budget-project    (Real-time subscriptions)
supabase_auth_budget-project        (Authentication)
supabase_storage_budget-project     (File storage)
supabase_edge_runtime_budget-project (Edge functions)
supabase_pg_meta_budget-project     (Database metadata)
supabase_inbucket_budget-project    (Email testing)
supabase_vector_budget-project      (Vector embeddings)
supabase_analytics_budget-project   (Analytics)
```

## 💡 Common Tasks

### Access Supabase Studio UI

Open http://127.0.0.1:54323 in your browser

### Connect to Local Database with CLI

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Run Database Migrations

```bash
supabase db push
```

### Reset Local Database

```bash
supabase db reset
```

### View Real-time Activity

Open Studio UI → Logs section

### Test Email Functionality

Send an email from your app and check http://127.0.0.1:54324

## 🔄 Development Workflow

1. Make code changes in your Next.js app
2. Changes automatically reload (hot reload enabled)
3. Test with local Supabase database
4. When ready, deploy to production Supabase

## ⚠️ Important Notes

- Local Supabase data is **NOT** persisted when you run `supabase stop`
- Use `supabase db reset` to reinitialize with seed data
- All services run in Docker containers
- Requires Docker Desktop to be running
- Database credentials are for **local development only**

## 📚 Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Supabase Management API](https://supabase.com/docs/reference/javascript/introduction)

## 🆘 Troubleshooting

### Supabase won't start?

```bash
# Stop all containers
supabase stop

# Clear Docker and try again
docker system prune -a
supabase start
```

### Port conflicts?

Edit `supabase/config.toml` and change port numbers

### Database issues?

```bash
# Reset the database
supabase db reset

# Check logs
docker logs supabase_db_budget-project
```
