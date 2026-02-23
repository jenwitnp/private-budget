-- Create users table migration
-- Run in Supabase SQL Editor

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'user')) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Allow admins to view all users (implement based on your auth structure)
-- This is a basic example - adjust based on your JWT claims
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE auth.users.id::text = users.id) = 'admin'
    OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE auth.users.id::text = users.id) = 'owner'
  );

-- Insert test users (optional - can also use the seed script)
INSERT INTO users (id, email, name, password_hash, role, status)
VALUES
  ('1', 'owner@example.com', 'Owner User', '$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2', 'owner', 'active'),
  ('2', 'admin@example.com', 'Admin User', '$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2', 'admin', 'active'),
  ('3', 'user@example.com', 'Regular User', '$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2', 'user', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS users_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  changed_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON users_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON users_audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();
