-- Fix the missing relationship between violation_slips and community_service
-- Add the missing violation_id column and other missing fields

ALTER TABLE community_service 
ADD COLUMN IF NOT EXISTS violation_id UUID REFERENCES violation_slips(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS date_started DATE,
ADD COLUMN IF NOT EXISTS date_completed DATE,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Update the status column if it doesn't exist with proper default
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_service' AND column_name = 'status') THEN
        ALTER TABLE community_service ADD COLUMN status VARCHAR(50) DEFAULT 'Partially Done';
    END IF;
END $$;

-- Also add missing status column to violation_slips if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_slips' AND column_name = 'status') THEN
        ALTER TABLE violation_slips ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';
    END IF;
END $$;