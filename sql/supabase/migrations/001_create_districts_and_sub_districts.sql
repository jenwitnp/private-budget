-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  province VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sub_districts table with foreign key to districts
CREATE TABLE IF NOT EXISTS sub_districts (
  id BIGSERIAL PRIMARY KEY,
  district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  villages_count INT NOT NULL DEFAULT 0,
  examples TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(district_id, name)
);

-- Create indexes for better query performance
CREATE INDEX idx_districts_province ON districts(province);
CREATE INDEX idx_sub_districts_district_id ON sub_districts(district_id);
CREATE INDEX idx_sub_districts_name ON sub_districts(name);

-- Add comment to tables for documentation
COMMENT ON TABLE districts IS 'อำเภอ (Districts in Thailand)';
COMMENT ON TABLE sub_districts IS 'ตำบล (Sub-districts in Thailand)';
COMMENT ON COLUMN districts.province IS 'จังหวัด (Province)';
COMMENT ON COLUMN sub_districts.villages_count IS 'จำนวนหมู่บ้าน (Number of villages)';
COMMENT ON COLUMN sub_districts.examples IS 'ตัวอย่างหมู่บ้าน (Example villages)';
