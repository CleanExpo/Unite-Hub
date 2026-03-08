-- Fix organizations table - add missing columns

-- Add stripe_customer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE organizations ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add website column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'website'
  ) THEN
    ALTER TABLE organizations ADD COLUMN website TEXT;
  END IF;
END $$;

-- Add team_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'team_size'
  ) THEN
    ALTER TABLE organizations ADD COLUMN team_size TEXT;
  END IF;
END $$;

-- Add industry column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'industry'
  ) THEN
    ALTER TABLE organizations ADD COLUMN industry TEXT;
  END IF;
END $$;

-- Add plan column if it doesn't exist with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter';
  END IF;
END $$;

-- Add status column if it doesn't exist with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'cancelled')) DEFAULT 'trial';
  END IF;
END $$;

-- Add trial_ends_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add index on stripe_customer_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
