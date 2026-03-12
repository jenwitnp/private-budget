-- Drop existing table if it exists
DROP TABLE IF EXISTS public.schedule CASCADE;

-- Create schedule table
CREATE TABLE public.schedule (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  address TEXT,
  district_id BIGINT REFERENCES public.districts(id) ON DELETE SET NULL,
  sub_district_id BIGINT REFERENCES public.sub_districts(id) ON DELETE SET NULL,
  note TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_time_range CHECK (time_start IS NULL OR time_end IS NULL OR time_start < time_end)
) TABLESPACE pg_default;

-- Create indexes for common queries
CREATE INDEX idx_schedule_user_id ON public.schedule(user_id);
CREATE INDEX idx_schedule_scheduled_date ON public.schedule(scheduled_date);
CREATE INDEX idx_schedule_district_id ON public.schedule(district_id);
CREATE INDEX idx_schedule_sub_district_id ON public.schedule(sub_district_id);
CREATE INDEX idx_schedule_status ON public.schedule(status);
CREATE INDEX idx_schedule_user_date ON public.schedule(user_id, scheduled_date);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_updated_at_trigger
BEFORE UPDATE ON public.schedule
FOR EACH ROW
EXECUTE FUNCTION update_schedule_updated_at();

