-- Add missing fields to contacts table and constraints

-- Add custom_fields column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add industry column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'industry'
  ) THEN
    ALTER TABLE contacts ADD COLUMN industry TEXT;
  END IF;
END $$;

-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'source'
  ) THEN
    ALTER TABLE contacts ADD COLUMN source TEXT;
  END IF;
END $$;

-- Add last_contacted_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_contacted_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add unique constraint on workspace_id + email (for upsert operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacts_workspace_id_email_key'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_workspace_id_email_key UNIQUE (workspace_id, email);
  END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Add index on source
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);

-- Add index on industry
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);
