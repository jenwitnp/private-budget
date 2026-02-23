-- Migration: Fix bank_name enum to include all Thai banks
-- This migration ensures the bank enum has all bank codes

-- Create new bank_name enum type with all Thai bank codes
CREATE TYPE bank_name_new AS ENUM (
  '002', -- Bangkok Bank
  '004', -- Bank of America
  '006', -- Kasikornbank
  '011', -- Thai Military Bank
  '014', -- Siam Commercial Bank
  '021', -- Citibank Thailand
  '022', -- HSBC Thailand
  '025', -- Krung Thai Bank
  '034', -- Bank of China Thailand
  '035', -- Bank of Tokyo-Mitsubishi UFJ
  '040', -- The Hongkong and Shanghai Banking Corporation
  '042', -- Bank of India
  '044', -- Bank of Baroda
  '045', -- Mizuho Bank
  '047', -- Islamic Bank of Thailand
  '048', -- Thai Credit Bank
  '050', -- Krung Thai Bank (alternative)
  '051', -- Bank of Bangkok
  '052', -- Abu Dhabi Islamic Bank
  '053', -- Bangkok Bank Public
  '054', -- Industrial and Commercial Bank of China
  '055', -- UnionPay
  '056', -- Bank of Khon Kaen
  '057', -- Ayudhya Bank
  '058', -- Bamrungrad Bank
  '070', -- Government Savings Bank
  '073', -- Kiatnakin Bank
  '074', -- Thanachart Bank
  '075', -- TISCO Bank
  '076', -- Tha Nos Bank
  '077', -- Siam City Bank
  '078', -- Phoenix Bank
  '079', -- TMB Bank
  '080', -- Seabank
  '081', -- Krungthai Bank
  '082', -- Krungsri Bank
  '083', -- Bank Negara Malaysia
  '999'  -- Other banks
);

-- Convert existing column to use new enum
-- Note: This assumes the old enum had compatible values
ALTER TABLE public.bank_accounts ALTER COLUMN bank TYPE bank_name_new USING (bank::text::bank_name_new);

-- Drop old enum and rename new one
DROP TYPE IF EXISTS bank_name;
ALTER TYPE bank_name_new RENAME TO bank_name;

-- Verify the changes
SELECT enum_range(NULL::bank_name);
