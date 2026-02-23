-- ===================================
-- Categories Table
-- ===================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ===================================
-- Insert Category Data
-- ===================================

-- Clear existing data (optional, comment out if not needed)
-- DELETE FROM categories;

-- Insert categories
INSERT INTO categories (name, description, color, display_order, status)
VALUES
  ('ทั่วไป', 'ประเภททั่วไป', '#64748B', 1, 'active'),
  ('ป้ายหาเสียง', 'ป้ายหาเสียง/โฆษณากลางแจ้ง', '#F59E0B', 2, 'active'),
  ('รถแห่', 'รถแห่ประชาสัมพันธ์', '#EF4444', 3, 'active'),
  ('โฆษณา', 'โฆษณา/ส่วนเสริม', '#3B82F6', 4, 'active'),
  ('แผ่นพับ/ใบปลิว', 'แผ่นพับและใบปลิว', '#8B5CF6', 5, 'active'),
  ('หัวคะแนน', 'ป้ายหัวคะแนน/ส่วนหัว', '#10B981', 6, 'active')
ON CONFLICT (name) DO NOTHING;

-- ===================================
-- Verify Data
-- ===================================
SELECT id, name, description, color, display_order, status, created_at 
FROM categories 
ORDER BY display_order ASC;
