-- Add FK columns linking members to the districts / sub_districts reference tables.
-- IDs are resolved from text names during Excel import.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS district_id     BIGINT REFERENCES public.districts(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_district_id BIGINT REFERENCES public.sub_districts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS members_district_id_idx     ON public.members (district_id);
CREATE INDEX IF NOT EXISTS members_sub_district_id_idx ON public.members (sub_district_id);
