-- =====================================================
-- MINDMAP FEATURE - ROLLBACK MIGRATION
-- =====================================================
-- Purpose: Safely remove mindmap feature if needed
-- Date: 2025-01-17
-- IMPORTANT: Only run if you need to remove the mindmap feature
-- =====================================================

-- Drop helper function
DROP FUNCTION IF EXISTS get_mindmap_structure(UUID);

-- Drop tables in reverse order (dependencies first)
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS mindmap_connections CASCADE;
DROP TABLE IF EXISTS mindmap_nodes CASCADE;
DROP TABLE IF EXISTS project_mindmaps CASCADE;

-- Log rollback
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditLogs') THEN
    INSERT INTO "auditLogs" (action, details, created_at)
    VALUES (
      'migration_rolled_back',
      jsonb_build_object(
        'migration', '028_mindmap_feature',
        'tables_dropped', ARRAY['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'],
        'reason', 'manual_rollback'
      ),
      NOW()
    );
  END IF;
END $$;

-- Verification
SELECT
  'Rollback Complete' AS status,
  'Mindmap tables removed' AS message,
  NOW() AS timestamp;
