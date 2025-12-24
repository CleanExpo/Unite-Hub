-- =====================================================
-- Migration: 901_test_index_recommendations
-- Purpose: Test migration for Phase 1 validation
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: workspace_id

-- Test index optimization
CREATE INDEX IF NOT EXISTS idx_test_contacts_workspace_created
  ON contacts(workspace_id, created_at DESC);

COMMENT ON INDEX idx_test_contacts_workspace_created IS 'Test index for Phase 1 validation - improves contact timeline queries';
