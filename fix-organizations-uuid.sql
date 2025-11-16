-- Fix Organizations Table UUID Generation
-- Run this in Supabase SQL Editor to ensure id column has default UUID

-- Ensure id column has UUID default (if it doesn't already)
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the default is set
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'organizations' AND column_name = 'id';
