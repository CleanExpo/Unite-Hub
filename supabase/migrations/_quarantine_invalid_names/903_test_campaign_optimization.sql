-- =====================================================
-- Migration: 903_test_campaign_optimization
-- Purpose: Test migration - campaign performance
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: workspace_id

-- Campaign optimization
CREATE INDEX IF NOT EXISTS idx_test_campaigns_workspace_status
  ON campaigns(workspace_id, status);

COMMENT ON INDEX idx_test_campaigns_workspace_status IS 'Test index - optimizes campaign status filtering';
