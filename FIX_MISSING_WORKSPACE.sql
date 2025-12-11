-- Fix: Create missing workspace for organization
-- Run this in Supabase SQL Editor

-- Create workspace for Phill McGurk's Organization
INSERT INTO workspaces (id, name, org_id, created_at)
VALUES (
  'adedf006-ca69-47d4-adbf-fc91bd7f225d',  -- Same as org ID
  'Phill McGurk''s Workspace',
  'adedf006-ca69-47d4-adbf-fc91bd7f225d',   -- Organization ID
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify workspace created
SELECT
  w.id,
  w.name,
  w.org_id,
  o.name as org_name
FROM workspaces w
JOIN organizations o ON o.id = w.org_id
WHERE w.id = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';
