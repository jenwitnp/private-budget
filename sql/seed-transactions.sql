-- Seed transactions data for testing and development
-- This file populates the transactions table with realistic sample data

-- Clear existing transactions (optional - comment out if you want to keep existing data)
-- DELETE FROM public.transactions;

-- Insert sample transactions with only valid statuses: pending, approved, rejected, paid
INSERT INTO public.transactions (
  id, transaction_number, user_id, bank_account_id, amount, currency, 
  description, notes, status, status_changed_at, status_changed_by, 
  recipient_name, recipient_account_number, recipient_bank, 
  transaction_date, processed_at, completed_at, failed_at, 
  error_code, error_message, fee_amount, net_amount, 
  created_at, updated_at, created_by, ip_address, user_agent, 
  districts_id, sub_districts_id, approved_by, approved_at, 
  rejected_by, rejected_at, item_name, paid_by, paid_at, category_id, payment_method
) VALUES
-- Example 1: Pending transaction (pending approval)
(
  gen_random_uuid(), 'TXN-2026-001', 
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', 
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5', 
  5000.00, 'THB',
  'ป้ายหาเสียงประชาสัมพันธ์', 
  'ป้ายขนาด 3x4 เมตร ติดตั้งที่สี่แยกหลัก',
  'pending', NOW(), NULL,
  'บริษัท ABC วิทยุ', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '3 days', NULL, NULL, NULL,
  NULL, NULL, 100.00, 4900.00,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.1', 'Mozilla/5.0',
  1, 1, NULL, NULL,
  NULL, NULL, 'ป้ายหาเสียง', NULL, NULL,
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 2: Approved transaction (waiting for payment)
(
  gen_random_uuid(), 'TXN-2026-002',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  8500.00, 'THB',
  'รถแห่ประชาสัมพันธ์',
  'เช่าเวลา 3 วัน ย่างเดือนกุมภาพันธ์',
  'approved', NOW() - INTERVAL '2 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท XYZ บันเทิง', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL, NULL,
  NULL, NULL, 150.00, 8350.00,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.2', 'Mozilla/5.0',
  1, 2, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '1 day',
  NULL, NULL, 'รถแห่', NULL, NULL,
  '06d3c2b5-7a2e-452e-b874-2e2555abfc62', 'transfer'
),

-- Example 3: Paid transaction (fully completed)
(
  gen_random_uuid(), 'TXN-2026-003',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  3200.00, 'THB',
  'แผ่นพับประชาสัมพันธ์',
  '1000 ชุด พิมพ์หลายสี',
  'paid', NOW() - INTERVAL '5 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'โรงพิมพ์อิเจนด์', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NULL,
  NULL, NULL, 80.00, 3120.00,
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.3', 'Mozilla/5.0',
  1, 3, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '4 days',
  NULL, NULL, 'แผ่นพับ', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '2 days',
  '67174461-1e3e-4804-9e38-a93578d181fa', 'transfer'
),

-- Example 4: Rejected transaction
(
  gen_random_uuid(), 'TXN-2026-004',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  2500.00, 'THB',
  'โฆษณาจอดิจิตอล',
  'หน้าจอ LED ขาดจำนวนเงินในงบประมาณ',
  'rejected', NOW() - INTERVAL '1 day', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท LED มาสเตอร์', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '1 day', NULL, NULL, NULL,
  NULL, NULL, 50.00, 2450.00,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.4', 'Mozilla/5.0',
  2, 5, NULL, NULL,
  'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '1 day', 'โฆษณาจอ', NULL, NULL,
  'f35e9d6b-feb2-47c7-9a1b-960353ed124c', 'transfer'
),

-- Example 5: Paid transaction (all stages done)
(
  gen_random_uuid(), 'TXN-2026-005',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  6800.00, 'THB',
  'ป้ายหาเสียงใบปืน',
  'ป้ายขนาดใหญ่ประชาสัมพันธ์ งานสัตหีบ',
  'paid', NOW() - INTERVAL '7 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'บริษัท สำเร็จรูป', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', NULL,
  NULL, NULL, 120.00, 6680.00,
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.5', 'Mozilla/5.0',
  1, 4, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '6 days',
  NULL, NULL, 'ป้ายใบปืน', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '4 days',
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
),

-- Example 6: Pending transaction by different user
(
  gen_random_uuid(), 'TXN-2026-006',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  4200.00, 'THB',
  'วัสดุอุปกรณ์สำนักงาน',
  'เก้าอี้ป้ายหาเสียง 5 ตัว',
  'pending', NOW() - INTERVAL '2 hours', NULL,
  'บริษัท สหกรณ์อุปกรณ์', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '2 hours', NULL, NULL, NULL,
  NULL, NULL, 80.00, 4120.00,
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.6', 'Mozilla/5.0',
  2, 6, NULL, NULL,
  NULL, NULL, 'วัสดุสำนักงาน', NULL, NULL,
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 7: Approved and paid earlier today
(
  gen_random_uuid(), 'TXN-2026-007',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  1500.00, 'THB',
  'ใบปลิวประชาสัมพันธ์',
  '5000 ชุด หลากหลายสีสัน',
  'paid', NOW() - INTERVAL '12 hours', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'โรงพิมพ์ดิจิตอล', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '8 hours', NULL,
  NULL, NULL, 30.00, 1470.00,
  NOW() - INTERVAL '12 hours', NOW() - INTERVAL '8 hours', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.7', 'Mozilla/5.0',
  3, 8, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '10 hours',
  NULL, NULL, 'ใบปลิว', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '8 hours',
  '67174461-1e3e-4804-9e38-a93578d181fa', 'transfer'
),

-- Example 8: Paid with different payment method
(
  gen_random_uuid(), 'TXN-2026-008',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  NULL,
  9500.00, 'THB',
  'บริการโฆษณาวิทยุ FM',
  'ออกอากาศประชาสัมพันธ์ 30 วินาที x 10 ครั้ง',
  'paid', NOW() - INTERVAL '3 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'สถานีวิทยุ FM 99.5', NULL, NULL,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL,
  NULL, NULL, 200.00, 9300.00,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.8', 'Mozilla/5.0',
  1, 1, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '2 days',
  NULL, NULL, 'บริการวิทยุ', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '1 day',
  'f35e9d6b-feb2-47c7-9a1b-960353ed124c', 'cash'
),

-- Example 9: Approved, waiting payment (different user)
(
  gen_random_uuid(), 'TXN-2026-009',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  7200.00, 'THB',
  'บริการสัตหีบ งานสูตรดี',
  'ค่าสูตรดี และตกแต่งหลวง ประชาสัมพันธ์',
  'approved', NOW() - INTERVAL '4 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท หนองคาย ทัวร์', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NULL, NULL,
  NULL, NULL, 150.00, 7050.00,
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.9', 'Mozilla/5.0',
  3, 9, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '3 days',
  NULL, NULL, 'บริการงาน', NULL, NULL,
  '06d3c2b5-7a2e-452e-b874-2e2555abfc62', 'transfer'
),

-- Example 10: Rejected transaction
(
  gen_random_uuid(), 'TXN-2026-010',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  3800.00, 'THB',
  'บริการถ่ายภาพและวิดีโอ',
  'บันทึกภาพกิจกรรม ห้องเรียนจำนวน 5 ห้อง',
  'rejected', NOW() - INTERVAL '6 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'สตูดิโอเวลโลว์', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days',
  NULL, NULL, 80.00, 3720.00,
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.10', 'Mozilla/5.0',
  2, 7, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '5 days',
  NULL, NULL, 'บริการถ่ายภาพ', NULL, NULL,
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
),

-- Example 11: Pending
(
  gen_random_uuid(), 'TXN-2026-011',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  4500.00, 'THB',
  'ป้ายประชาสัมพันธ์ตลาด',
  'ป้าย 2x5 เมตร ตลาดสัตหีบ',
  'pending', NOW() - INTERVAL '1 day', NULL,
  'บริษัท โครงการโฆษณา', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '1 day', NULL, NULL, NULL,
  NULL, NULL, 90.00, 4410.00,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.11', 'Mozilla/5.0',
  1, 2, NULL, NULL,
  NULL, NULL, 'ป้ายตลาด', NULL, NULL,
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 12: Approved
(
  gen_random_uuid(), 'TXN-2026-012',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  6200.00, 'THB',
  'บริการโฆษณาทีวี',
  'ออกอากาศ 15 วินาที x 20 ครั้ง',
  'approved', NOW() - INTERVAL '8 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'สถานีโทรทัศน์ไทย', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NULL, NULL,
  NULL, NULL, 130.00, 6070.00,
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.12', 'Mozilla/5.0',
  2, 5, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '7 days',
  NULL, NULL, 'โฆษณาทีวี', NULL, NULL,
  'f35e9d6b-feb2-47c7-9a1b-960353ed124c', 'transfer'
),

-- Example 13: Paid
(
  gen_random_uuid(), 'TXN-2026-013',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  2800.00, 'THB',
  'บริการพิมพ์สเกลแบนเนอร์',
  'แบนเนอร์ 5 x 2 เมตร คุณภาพสูง',
  'paid', NOW() - INTERVAL '9 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'โรงพิมพ์ศรีวิทยา', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', NULL,
  NULL, NULL, 60.00, 2740.00,
  NOW() - INTERVAL '9 days', NOW() - INTERVAL '6 days', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.13', 'Mozilla/5.0',
  1, 3, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '8 days',
  NULL, NULL, 'แบนเนอร์', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '6 days',
  '67174461-1e3e-4804-9e38-a93578d181fa', 'transfer'
),

-- Example 14: Rejected
(
  gen_random_uuid(), 'TXN-2026-014',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  5500.00, 'THB',
  'บริการอื่นๆ',
  'โครงการด้านเทคโนโลยี',
  'rejected', NOW() - INTERVAL '10 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท เทค โซลูชั่น', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '10 days', NULL, NULL, NULL,
  NULL, NULL, 120.00, 5380.00,
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.14', 'Mozilla/5.0',
  3, 8, NULL, NULL,
  'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '10 days', 'บริการเทค', NULL, NULL,
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
), 

-- Example 15: Paid
(
  gen_random_uuid(), 'TXN-2026-015',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  7500.00, 'THB',
  'ป้ายขนาดใหญ่',
  'ป้าย 4x6 เมตร ติดตั้งห้องสมุด',
  'paid', NOW() - INTERVAL '11 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'บริษัท สัญญาณ', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NULL,
  NULL, NULL, 160.00, 7340.00,
  NOW() - INTERVAL '11 days', NOW() - INTERVAL '8 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.15', 'Mozilla/5.0',
  2, 6, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '10 days',
  NULL, NULL, 'ป้ายใหญ่', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '8 days',
  '06d3c2b5-7a2e-452e-b874-2e2555abfc62', 'transfer'
),

-- Example 16: Pending
(
  gen_random_uuid(), 'TXN-2026-016',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  3500.00, 'THB',
  'บริการถ่ายภาพสินค้า',
  'ถ่ายภาพสินค้า 100 ชิ้น',
  'pending', NOW() - INTERVAL '12 days', NULL,
  'สตูดิโอ Photo Plus', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '12 days', NULL, NULL, NULL,
  NULL, NULL, 70.00, 3430.00,
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.16', 'Mozilla/5.0',
  1, 4, NULL, NULL,
  NULL, NULL, 'ถ่ายภาพ', NULL, NULL,
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 17: Approved
(
  gen_random_uuid(), 'TXN-2026-017',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  4800.00, 'THB',
  'บริการจัดงาน',
  'จัดงานประชาสัมพันธ์ ระดับเขต',
  'approved', NOW() - INTERVAL '13 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท Event Manager', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', NULL, NULL,
  NULL, NULL, 100.00, 4700.00,
  NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.17', 'Mozilla/5.0',
  3, 9, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '12 days',
  NULL, NULL, 'จัดงาน', NULL, NULL,
  '06d3c2b5-7a2e-452e-b874-2e2555abfc62', 'transfer'
),

-- Example 18: Paid
(
  gen_random_uuid(), 'TXN-2026-018',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  2200.00, 'THB',
  'เครื่องเสียงประชาสัมพันธ์',
  'ระบบเสียง 3500W พอร์ต 4 ตำแหน่ง',
  'paid', NOW() - INTERVAL '14 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'ร้านเครื่องเสียง ดีเจ', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '11 days', NULL,
  NULL, NULL, 50.00, 2150.00,
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '11 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.18', 'Mozilla/5.0',
  2, 7, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '13 days',
  NULL, NULL, 'เครื่องเสียง', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '11 days',
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
),

-- Example 19: Rejected
(
  gen_random_uuid(), 'TXN-2026-019',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  NULL,
  5800.00, 'THB',
  'บริการขนส่ง',
  'ขนส่งบริการจากจังหวัร',
  'rejected', NOW() - INTERVAL '15 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'บริษัท ขนส่ง ดีต้อน', NULL, NULL,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NULL, NOW() - INTERVAL '14 days',
  NULL, NULL, 100.00, 5700.00,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.19', 'Mozilla/5.0',
  1, 1, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '14 days',
  NULL, NULL, 'ขนส่ง', NULL, NULL,
  '67174461-1e3e-4804-9e38-a93578d181fa', 'cash'
),

-- Example 20: Pending
(
  gen_random_uuid(), 'TXN-2026-020',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  6100.00, 'THB',
  'ป้ายสายรุ้ง',
  'ป้ายไฟ LED หลากสี',
  'pending', NOW() - INTERVAL '16 days', NULL,
  'บริษัท ไฟ LED ใจความ', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '16 days', NULL, NULL, NULL,
  NULL, NULL, 130.00, 5970.00,
  NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.20', 'Mozilla/5.0',
  3, 5, NULL, NULL,
  NULL, NULL, 'ป้ายไฟ', NULL, NULL,
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
),

-- Example 21: Approved
(
  gen_random_uuid(), 'TXN-2026-021',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  3900.00, 'THB',
  'บริการออกแบบกราฟิก',
  'ออกแบบโลโก้และคู่มือการใช้',
  'approved', NOW() - INTERVAL '17 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท Creative Design', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days', NULL, NULL,
  NULL, NULL, 80.00, 3820.00,
  NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.21', 'Mozilla/5.0',
  2, 8, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '16 days',
  NULL, NULL, 'ออกแบบ', NULL, NULL,
  '9f91a37e-ac75-427a-9e0f-6543eb2ab38e', 'transfer'
),

-- Example 22: Paid
(
  gen_random_uuid(), 'TXN-2026-022',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  NULL,
  4400.00, 'THB',
  'บริการฟิล์มความปลอดภัย',
  'ติดตั้งฟิล์มกระจก',
  'paid', NOW() - INTERVAL '18 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'ร้านติดตั้งฟิล์ม ABC', NULL, NULL,
  NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', NULL,
  NULL, NULL, 90.00, 4310.00,
  NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.22', 'Mozilla/5.0',
  1, 2, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '17 days',
  NULL, NULL, 'ฟิล์ม', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '15 days',
  '67174461-1e3e-4804-9e38-a93578d181fa', 'cash'
),

-- Example 23: Rejected
(
  gen_random_uuid(), 'TXN-2026-023',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  6900.00, 'THB',
  'บริการวิดีโอ 4K',
  'ถ่ายวิดีโอ 4K ใหม่เมื่อเร็วนี้',
  'rejected', NOW() - INTERVAL '19 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'สตูดิโอ Modern Film', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '19 days', NULL, NULL, NULL,
  NULL, NULL, 140.00, 6760.00,
  NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.23', 'Mozilla/5.0',
  3, 6, NULL, NULL,
  'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '19 days', 'วิดีโอ', NULL, NULL,
  '78c3da76-aff9-4c00-9810-7dacfa5d7d4c', 'transfer'
),

-- Example 24: Paid
(
  gen_random_uuid(), 'TXN-2026-024',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  2600.00, 'THB',
  'สั่งพิมพ์นามบัตร',
  'นามบัตร 5000 ใบ หลุยส์',
  'paid', NOW() - INTERVAL '20 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'โรงพิมพ์ทรง', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '17 days', NULL,
  NULL, NULL, 55.00, 2545.00,
  NOW() - INTERVAL '20 days', NOW() - INTERVAL '17 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.24', 'Mozilla/5.0',
  2, 3, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '19 days',
  NULL, NULL, 'นามบัตร', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '17 days',
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 25: Pending
(
  gen_random_uuid(), 'TXN-2026-025',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  5300.00, 'THB',
  'บริการสกรีนเสื้อ',
  'สกรีนเสื้อ 500 ตัว คุณภาพพรีเมี่ยม',
  'pending', NOW() - INTERVAL '21 days', NULL,
  'ร้านสกรีนเสื้อ ศรี', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '21 days', NULL, NULL, NULL,
  NULL, NULL, 110.00, 5190.00,
  NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.25', 'Mozilla/5.0',
  1, 4, NULL, NULL,
  NULL, NULL, 'สกรีนเสื้อ', NULL, NULL,
  '8fd3f83b-1f71-4d67-b084-c57653d4ace7', 'transfer'
),

-- Example 26: Approved
(
  gen_random_uuid(), 'TXN-2026-026',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  3300.00, 'THB',
  'บริการจัดเรียงห้องสำนักงาน',
  'จัดเรียงและล้าวของสำนักงาน',
  'approved', NOW() - INTERVAL '22 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท Office Solutions', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', NULL, NULL,
  NULL, NULL, 70.00, 3230.00,
  NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.26', 'Mozilla/5.0',
  3, 7, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '21 days',
  NULL, NULL, 'จัดเรียง', NULL, NULL,
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
),

-- Example 27: Paid
(
  gen_random_uuid(), 'TXN-2026-027',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  8200.00, 'THB',
  'บริการสัตหีบรั้วปิด',
  'บริการตลาดสัตหีบ',
  'paid', NOW() - INTERVAL '23 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'ศูนย์ค้นหาสัตหีบ', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '23 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '20 days', NULL,
  NULL, NULL, 175.00, 8025.00,
  NOW() - INTERVAL '23 days', NOW() - INTERVAL '20 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.27', 'Mozilla/5.0',
  1, 3, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '22 days',
  NULL, NULL, 'สัตหีบ', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '20 days',
  '67174461-1e3e-4804-9e38-a93578d181fa', 'transfer'
),

-- Example 28: Rejected
(
  gen_random_uuid(), 'TXN-2026-028',
  '4c97129b-f6c0-4654-a038-27cf7d470945',
  NULL,
  4100.00, 'THB',
  'บริการเว็บไซต์',
  'พัฒนาเว็บไซต์ (ปลายน้ำ)',
  'rejected', NOW() - INTERVAL '24 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'บริษัท Web Agency', NULL, NULL,
  NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', NULL, NOW() - INTERVAL '23 days',
  NULL, NULL, 85.00, 4015.00,
  NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', '4c97129b-f6c0-4654-a038-27cf7d470945', '192.168.1.28', 'Mozilla/5.0',
  2, 4, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '23 days',
  NULL, NULL, 'เว็บไซต์', NULL, NULL,
  '78c3da76-aff9-4c00-9810-7dacfa5d7d4c', 'cash'
),

-- Example 29: Approved
(
  gen_random_uuid(), 'TXN-2026-029',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  7800.00, 'THB',
  'บริการเช่ารถเกวี่ยน',
  'เช่ารถเกวี่ยนประชาสัมพันธ์ 5 วัน',
  'approved', NOW() - INTERVAL '25 days', 'f1dcafbf-d156-4f70-876f-49dca41d4531',
  'บริษัท Rent Car Plus', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', NULL, NULL,
  NULL, NULL, 165.00, 7635.00,
  NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.29', 'Mozilla/5.0',
  3, 8, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '24 days',
  NULL, NULL, 'เช่ารถ', NULL, NULL,
  'f35e9d6b-feb2-47c7-9a1b-960353ed124c', 'transfer'
),

-- Example 30: Paid
(
  gen_random_uuid(), 'TXN-2026-030',
  'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51',
  'd58e3efd-9ec3-4d5d-aed8-c2b7e49f62f5',
  2950.00, 'THB',
  'บริการเล็งรถบ้านเรือน',
  'ส่องรถบัส 10 คัน',
  'paid', NOW() - INTERVAL '26 days', '4c97129b-f6c0-4654-a038-27cf7d470945',
  'บริษัท Transport Media', '112255445555', 'ธนาคารกรุงไทย',
  NOW() - INTERVAL '26 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '23 days', NULL,
  NULL, NULL, 60.00, 2890.00,
  NOW() - INTERVAL '26 days', NOW() - INTERVAL '23 days', 'edb6c1b5-4f5e-4434-bd3c-d346b81d8c51', '192.168.1.30', 'Mozilla/5.0',
  1, 5, 'f1dcafbf-d156-4f70-876f-49dca41d4531', NOW() - INTERVAL '25 days',
  NULL, NULL, 'เล็งรถ', '4c97129b-f6c0-4654-a038-27cf7d470945', NOW() - INTERVAL '23 days',
  '53cc315f-7342-484a-91d2-289ca1464e4c', 'transfer'
);

-- Verify the data was inserted
SELECT COUNT(*) as total_transactions FROM public.transactions;
SELECT transaction_number, status, amount, category_id, created_at FROM public.transactions ORDER BY created_at DESC;
