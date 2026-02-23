-- Schema Documentation and Usage Examples

-- ============================================
-- TABLE STRUCTURE
-- ============================================

-- districts (อำเภอ)
-- id: Primary key (BigSerial)
-- name: District name (e.g., 'อำเภอท่าบ่อ')
-- province: Province name (e.g., 'หนองคาย')
-- created_at: Timestamp
-- updated_at: Timestamp

-- sub_districts (ตำบล)
-- id: Primary key (BigSerial)
-- district_id: Foreign key to districts (CASCADE on delete)
-- name: Sub-district name
-- villages_count: Number of villages in this sub-district
-- examples: Array of example village names
-- created_at: Timestamp
-- updated_at: Timestamp

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- 1. Get all districts in Nongkhai with their sub-districts count
-- SELECT 
--   d.id,
--   d.name,
--   COUNT(sd.id) as sub_districts_count
-- FROM districts d
-- LEFT JOIN sub_districts sd ON d.id = sd.district_id
-- WHERE d.province = 'หนองคาย'
-- GROUP BY d.id, d.name
-- ORDER BY d.name;

-- 2. Get all sub-districts for a specific district
-- SELECT 
--   sd.id,
--   sd.name,
--   sd.villages_count,
--   sd.examples
-- FROM sub_districts sd
-- WHERE sd.district_id = (SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ')
-- ORDER BY sd.name;

-- 3. Get total villages count for a district
-- SELECT 
--   d.name as district_name,
--   SUM(sd.villages_count) as total_villages
-- FROM districts d
-- LEFT JOIN sub_districts sd ON d.id = sd.district_id
-- WHERE d.name = 'อำเภอท่าบ่อ'
-- GROUP BY d.id, d.name;

-- 4. Search sub-districts by name
-- SELECT 
--   d.name as district_name,
--   sd.name as sub_district_name,
--   sd.villages_count
-- FROM sub_districts sd
-- JOIN districts d ON sd.district_id = d.id
-- WHERE sd.name ILIKE '%ท่า%'
-- ORDER BY d.name, sd.name;

-- 5. Get sub-district with examples
-- SELECT 
--   d.name as district_name,
--   sd.name as sub_district_name,
--   sd.examples
-- FROM sub_districts sd
-- JOIN districts d ON sd.district_id = d.id
-- WHERE sd.examples IS NOT NULL AND array_length(sd.examples, 1) > 0
-- ORDER BY d.name, sd.name;

-- ============================================
-- INDEXES
-- ============================================
-- idx_districts_province: For filtering by province
-- idx_sub_districts_district_id: For joining sub_districts to districts
-- idx_sub_districts_name: For searching sub-districts by name
