-- Create enum for complaint status
CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');

-- Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  line_user_id VARCHAR(255) NOT NULL,
  user_id UUID NULL,
  complaint_text TEXT NOT NULL,
  category VARCHAR(100) NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NULL DEFAULT 'normal',
  attachment_url VARCHAR(500) NULL,
  notes TEXT NULL,
  replied_by UUID NULL,
  replied_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT line_user_id_not_empty CHECK (line_user_id <> '')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_line_user_id ON public.complaints(line_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_complaints_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION update_complaints_timestamp();

-- Create table for complaint replies (for LINE OA response tracking)
CREATE TABLE IF NOT EXISTS public.complaint_replies (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  complaint_id UUID NOT NULL,
  from_user_id UUID NULL,
  from_line BOOLEAN DEFAULT FALSE,
  reply_text TEXT NOT NULL,
  attachment_url VARCHAR(500) NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for complaint_replies
CREATE INDEX IF NOT EXISTS idx_complaint_replies_complaint_id ON public.complaint_replies(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_replies_created_at ON public.complaint_replies(created_at DESC);
