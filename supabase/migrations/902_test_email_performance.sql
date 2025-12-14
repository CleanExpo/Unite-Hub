-- =====================================================
-- Migration: 902_test_email_performance
-- Purpose: Test migration - email performance optimization
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: workspace_id

-- Optimize email queries
CREATE INDEX IF NOT EXISTS idx_test_emails_workspace_sent
  ON emails(workspace_id, sent_at DESC);

COMMENT ON INDEX idx_test_emails_workspace_sent IS 'Test index - optimizes email sent history queries';
