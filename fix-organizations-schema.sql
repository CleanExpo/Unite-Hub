-- Fix Organizations Table Schema
-- Run this in Supabase SQL Editor if you get "Could not find the 'email' column" error

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'cancelled'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Make email NOT NULL after adding it
UPDATE organizations SET email = name || '@example.com' WHERE email IS NULL;
ALTER TABLE organizations ALTER COLUMN email SET NOT NULL;

-- Refresh the schema (this forces Supabase to update its cache)
-- Just run this query, it will take a few seconds
SELECT pg_notify('pgrst', 'reload schema');

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;
