-- ============================================================
-- RLS Policies — Nexus 2.0
-- Pattern: founder_id = auth.uid() (single-tenant)
-- Date: 09/03/2026
-- Idempotent: DROP IF EXISTS before CREATE
-- ============================================================

-- Enable RLS on all 9 tables (safe to re-run)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_projects ENABLE ROW LEVEL SECURITY;

-- ── Helper: idempotent policy creation via DO block ──────────
DO $$
DECLARE
  policies TEXT[][] := ARRAY[
    -- table, policy_suffix, operation, using_clause, check_clause
    ['businesses',        'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['businesses',        'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['businesses',        'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['businesses',        'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['contacts',          'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['contacts',          'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['contacts',          'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['contacts',          'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['nexus_pages',       'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['nexus_pages',       'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['nexus_pages',       'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['nexus_pages',       'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['nexus_databases',   'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['nexus_databases',   'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['nexus_databases',   'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['nexus_databases',   'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['nexus_rows',        'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['nexus_rows',        'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['nexus_rows',        'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['nexus_rows',        'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['credentials_vault', 'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['credentials_vault', 'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['credentials_vault', 'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['credentials_vault', 'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['approval_queue',    'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['approval_queue',    'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['approval_queue',    'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['approval_queue',    'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['social_channels',   'select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['social_channels',   'insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['social_channels',   'update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['social_channels',   'delete',  'DELETE',  'founder_id = auth.uid()', ''],

    ['connected_projects','select',  'SELECT',  'founder_id = auth.uid()', ''],
    ['connected_projects','insert',  'INSERT',  '',                        'founder_id = auth.uid()'],
    ['connected_projects','update',  'UPDATE',  'founder_id = auth.uid()', 'founder_id = auth.uid()'],
    ['connected_projects','delete',  'DELETE',  'founder_id = auth.uid()', '']
  ];
  p TEXT[];
  policy_name TEXT;
  sql TEXT;
BEGIN
  FOREACH p SLICE 1 IN ARRAY policies
  LOOP
    policy_name := p[1] || '_' || p[2];

    -- Drop existing policy if present
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', policy_name, p[1]);

    -- Build CREATE POLICY statement
    IF p[3] = 'INSERT' THEN
      sql := format('CREATE POLICY %I ON %I FOR %s WITH CHECK (%s);',
                     policy_name, p[1], p[3], p[5]);
    ELSIF p[3] IN ('SELECT', 'DELETE') THEN
      sql := format('CREATE POLICY %I ON %I FOR %s USING (%s);',
                     policy_name, p[1], p[3], p[4]);
    ELSE -- UPDATE
      sql := format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s);',
                     policy_name, p[1], p[3], p[4], p[5]);
    END IF;

    EXECUTE sql;
  END LOOP;
END $$;
