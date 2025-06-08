-- Fix Projects Table Schema for Production
-- Run this in Supabase SQL Editor

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_hours INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update existing projects to have default values
UPDATE projects SET 
    priority = 3 WHERE priority IS NULL,
    status = 'active' WHERE status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
