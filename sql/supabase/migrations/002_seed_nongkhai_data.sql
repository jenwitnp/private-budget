-- Seed data for Nongkhai province
-- Insert districts first
INSERT INTO districts (name, province) VALUES
  ('อำเภอท่าบ่อ', 'หนองคาย'),
  ('อำเภอศรีเชียงใหม่', 'หนองคาย'),
  ('อำเภอสังคม', 'หนองคาย'),
  ('อำเภอโพธิ์ตาก', 'หนองคาย')
ON CONFLICT (name) DO NOTHING;

-- Insert sub_districts for อำเภอท่าบ่อ
INSERT INTO sub_districts (district_id, name, villages_count, examples) VALUES
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลท่าบ่อ', 13, ARRAY['หมู่ 1 บ้านท่าบ่อ', 'หมู่ 2 บ้านหัวหาด']),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลน้ำโมง', 13, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลโคกคอน', 7, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลบ้านเดื่อ', 9, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลบ้านถ่อน', 8, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลบ้านลาน', 10, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลนาข่า', 8, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลโพนสา', 10, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลหนองนาง', 9, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอท่าบ่อ'), 'ตำบลกองนาง', 13, ARRAY[]::text[])
ON CONFLICT (district_id, name) DO NOTHING;

-- Insert sub_districts for อำเภอศรีเชียงใหม่
INSERT INTO sub_districts (district_id, name, villages_count, examples) VALUES
  ((SELECT id FROM districts WHERE name = 'อำเภอศรีเชียงใหม่'), 'ตำบลพานพร้าว', 15, ARRAY['หมู่ 1 บ้านพานพร้าว']),
  ((SELECT id FROM districts WHERE name = 'อำเภอศรีเชียงใหม่'), 'ตำบลบ้านหม้อ', 8, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอศรีเชียงใหม่'), 'ตำบลพระพุทธบาท', 10, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอศรีเชียงใหม่'), 'ตำบลหนองปลาปาก', 10, ARRAY[]::text[])
ON CONFLICT (district_id, name) DO NOTHING;

-- Insert sub_districts for อำเภอสังคม
INSERT INTO sub_districts (district_id, name, villages_count, examples) VALUES
  ((SELECT id FROM districts WHERE name = 'อำเภอสังคม'), 'ตำบลสังคม', 7, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอสังคม'), 'ตำบลแก้งไก่', 6, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอสังคม'), 'ตำบลผาตั้ง', 7, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอสังคม'), 'ตำบลบ้านม่วง', 7, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอสังคม'), 'ตำบลนางิ้ว', 9, ARRAY[]::text[])
ON CONFLICT (district_id, name) DO NOTHING;

-- Insert sub_districts for อำเภอโพธิ์ตาก
INSERT INTO sub_districts (district_id, name, villages_count, examples) VALUES
  ((SELECT id FROM districts WHERE name = 'อำเภอโพธิ์ตาก'), 'ตำบลโพธิ์ตาก', 7, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอโพธิ์ตาก'), 'ตำบลด่านศรีสุข', 9, ARRAY[]::text[]),
  ((SELECT id FROM districts WHERE name = 'อำเภอโพธิ์ตาก'), 'ตำบลโพนทอง', 11, ARRAY[]::text[])
ON CONFLICT (district_id, name) DO NOTHING;
