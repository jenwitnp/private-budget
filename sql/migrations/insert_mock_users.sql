-- Migration: Insert mock users with proper UUIDs and usernames
-- Make sure these UUIDs match the ones in pages/api/auth/[...nextauth].ts

INSERT INTO public.users (id, username, email, first_name, role, status, created_at, updated_at)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'owner',
    'owner@example.com',
    'Owner',
    'owner',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'admin',
    'admin@example.com',
    'Admin',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'user',
    'user@example.com',
    'User',
    'user',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (username) DO UPDATE SET
  updated_at = CURRENT_TIMESTAMP;
