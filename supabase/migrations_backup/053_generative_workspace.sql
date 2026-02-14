-- Migration: Generative Workspace Tables
-- Created: 2025-11-22
-- Description: Tables for AI-generated content approval workflow and execution logging

-- ============================================================================
-- Table: generated_content
-- Stores AI-generated marketing content for client approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Content metadata
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'banner', 'blog', 'social', 'email')),
  platform TEXT, -- meta, google, tiktok, linkedin, email, etc.

  -- Content data
  thumbnail_url TEXT,
  preview_text TEXT,
  full_content JSONB, -- Store full content data (video script, banner variants, blog text)
  ai_prompt TEXT, -- Original prompt used to generate

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'deployed', 'rejected', 'archived')),
  deployed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generated_content_workspace ON generated_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_created ON generated_content(created_at DESC);

-- Enable RLS
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workspace content" ON generated_content
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own workspace" ON generated_content
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workspace content" ON generated_content
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Table: execution_logs
-- Tracks deployment actions and system events
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Log data
  content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- deploy, approve, reject, iterate, generate, etc.
  message TEXT NOT NULL,
  platform TEXT, -- meta, google, tiktok, linkedin, email
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),

  -- Additional metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_logs_workspace ON execution_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_content ON execution_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created ON execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_action ON execution_logs(action);

-- Enable RLS
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workspace logs" ON execution_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs into own workspace" ON execution_logs
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Update trigger for generated_content
-- ============================================================================

CREATE OR REPLACE FUNCTION update_generated_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generated_content_timestamp ON generated_content;
CREATE TRIGGER trigger_update_generated_content_timestamp
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_content_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE generated_content IS 'AI-generated marketing content awaiting client approval';
COMMENT ON TABLE execution_logs IS 'Audit trail for content deployment and system actions';
COMMENT ON COLUMN generated_content.full_content IS 'JSONB storage for complete content data including variants';
COMMENT ON COLUMN execution_logs.metadata IS 'Additional context data for the log entry';
