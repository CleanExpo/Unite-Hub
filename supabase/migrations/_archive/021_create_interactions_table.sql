-- =====================================================
-- Migration: 021_create_interactions_table
-- Purpose: Create missing interactions table for AI agents
-- Date: 2025-11-17
-- =====================================================

-- Drop table if exists (for idempotency during development)
DROP TABLE IF EXISTS interactions CASCADE;

-- Create interactions table
-- This table stores all contact interaction history (emails, calls, meetings, etc.)
-- Used by AI agents for contact intelligence and personalized content generation
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Interaction type: email_sent, email_opened, email_clicked, call, meeting, note, task, etc.
  interaction_type VARCHAR(50) NOT NULL,

  -- Subject/title of interaction
  subject VARCHAR(500),

  -- Details/body of interaction
  details JSONB NOT NULL DEFAULT '{}',

  -- When the interaction occurred
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: User who created/performed interaction
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_workspace ON interactions(workspace_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_workspace_date ON interactions(workspace_id, interaction_date DESC);

-- Create composite index for common query pattern (get recent interactions for contact)
CREATE INDEX idx_interactions_contact_date ON interactions(contact_id, interaction_date DESC);

-- Enable Row Level Security
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view interactions in their workspace
CREATE POLICY "Users can view interactions in their workspace"
  ON interactions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert interactions in their workspace
CREATE POLICY "Users can insert interactions in their workspace"
  ON interactions
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update interactions in their workspace
CREATE POLICY "Users can update interactions in their workspace"
  ON interactions
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete interactions in their workspace
CREATE POLICY "Users can delete interactions in their workspace"
  ON interactions
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interactions_updated_at();

-- Add comment for documentation
COMMENT ON TABLE interactions IS 'Stores all contact interaction history (emails, calls, meetings, etc.) for AI agents';
COMMENT ON COLUMN interactions.interaction_type IS 'Type of interaction: email_sent, email_opened, email_clicked, call, meeting, note, task, etc.';
COMMENT ON COLUMN interactions.details IS 'Flexible JSONB storage for interaction-specific data';

-- Seed some sample data for testing (optional - remove in production)
-- INSERT INTO interactions (workspace_id, contact_id, interaction_type, subject, details, interaction_date)
-- SELECT
--   c.workspace_id,
--   c.id,
--   'email_sent',
--   'Initial outreach',
--   jsonb_build_object('body', 'Sample email body', 'status', 'sent'),
--   NOW() - INTERVAL '5 days'
-- FROM contacts c
-- LIMIT 5;
