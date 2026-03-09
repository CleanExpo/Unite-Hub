-- Migration: Browser Automation Boost Tables
-- Description: Tables for browser sessions, DOM map caches, and replayable tasks.
-- Created: 2025-11-28

-- ============================================================================
-- BROWSER SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  provider TEXT DEFAULT 'chromium' CHECK (provider IN ('chromium', 'firefox', 'webkit')),
  -- Encrypted Session State
  session_key_encrypted TEXT,
  cookies_encrypted TEXT,
  local_storage_encrypted TEXT,
  session_storage_encrypted TEXT,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  -- Session Info
  origin_url TEXT,
  user_agent TEXT,
  viewport_width INTEGER DEFAULT 1920,
  viewport_height INTEGER DEFAULT 1080,
  locale TEXT DEFAULT 'en-US',
  timezone TEXT DEFAULT 'America/New_York',
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'invalidated')),
  is_authenticated BOOLEAN DEFAULT FALSE,
  auth_domain TEXT,
  auth_username TEXT,
  -- Usage Tracking
  action_count INTEGER DEFAULT 0,
  navigation_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  last_navigation_url TEXT,
  -- Lifecycle
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROWSER DOM MAPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_dom_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_session_id UUID NOT NULL REFERENCES browser_sessions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_pattern TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- DOM Structure (compressed if large)
  dom_map_json JSONB,
  dom_map_compressed BYTEA,
  is_compressed BOOLEAN DEFAULT FALSE,
  -- Element Catalog
  interactive_elements JSONB DEFAULT '[]',
  form_elements JSONB DEFAULT '[]',
  navigation_elements JSONB DEFAULT '[]',
  input_elements JSONB DEFAULT '[]',
  button_elements JSONB DEFAULT '[]',
  link_elements JSONB DEFAULT '[]',
  -- Element Counts
  total_elements INTEGER DEFAULT 0,
  interactive_count INTEGER DEFAULT 0,
  form_count INTEGER DEFAULT 0,
  -- Page Info
  page_title TEXT,
  page_language TEXT,
  has_login_form BOOLEAN DEFAULT FALSE,
  has_search_form BOOLEAN DEFAULT FALSE,
  has_contact_form BOOLEAN DEFAULT FALSE,
  -- Selectors & XPaths
  stable_selectors JSONB DEFAULT '{}',
  element_hierarchy JSONB DEFAULT '{}',
  -- Validation
  hash_signature TEXT,
  last_validated_at TIMESTAMPTZ,
  validation_status TEXT DEFAULT 'valid' CHECK (validation_status IN ('valid', 'stale', 'invalid')),
  -- Size
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROWSER REPLAY TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_replay_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('login', 'form_fill', 'data_extraction', 'navigation', 'upload', 'download', 'custom')),
  -- Pattern Definition
  pattern_json JSONB NOT NULL DEFAULT '{}',
  entry_url TEXT,
  required_elements TEXT[],
  -- Steps
  steps JSONB NOT NULL DEFAULT '[]',
  step_count INTEGER DEFAULT 0,
  estimated_duration_ms INTEGER,
  -- Parameters
  parameters JSONB DEFAULT '[]',
  default_parameters JSONB DEFAULT '{}',
  -- Execution Settings
  timeout_ms INTEGER DEFAULT 60000,
  retry_attempts INTEGER DEFAULT 2,
  retry_delay_ms INTEGER DEFAULT 2000,
  wait_for_navigation BOOLEAN DEFAULT TRUE,
  screenshot_on_complete BOOLEAN DEFAULT FALSE,
  screenshot_on_error BOOLEAN DEFAULT TRUE,
  -- Safety
  requires_approval BOOLEAN DEFAULT FALSE,
  allowed_domains TEXT[],
  blocked_actions TEXT[],
  max_iterations INTEGER DEFAULT 10,
  -- Stats
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  avg_duration_ms INTEGER,
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deprecated')),
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_task_id UUID REFERENCES browser_replay_tasks(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROWSER REPLAY RUNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_replay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_task_id UUID NOT NULL REFERENCES browser_replay_tasks(id) ON DELETE CASCADE,
  browser_session_id UUID REFERENCES browser_sessions(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
triggered_by UUID REFERENCES auth.users(id),
  trigger_source TEXT CHECK (trigger_source IN ('manual', 'scheduled', 'webhook', 'orchestrator', 'api')),
  -- Execution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  -- Parameters Used
  parameters_used JSONB DEFAULT '{}',
  entry_url TEXT,
  -- Steps Execution
  steps_total INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  steps_failed INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  step_results JSONB DEFAULT '[]',
  -- Output
  output_data JSONB DEFAULT '{}',
  extracted_data JSONB DEFAULT '{}',
  screenshots TEXT[],
  -- Errors
  error_message TEXT,
  error_step INTEGER,
  error_details JSONB DEFAULT '{}',
  -- Approval (if required)
  approval_status TEXT CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- Resource Usage
  memory_used_mb INTEGER,
  cpu_time_ms INTEGER,
  network_requests INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROWSER LEARNED PATTERNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_session_id UUID REFERENCES browser_sessions(id),
  source_run_ids UUID[],
  -- Pattern Info
  name TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT CHECK (pattern_type IN ('login', 'form', 'navigation', 'extraction', 'interaction', 'workflow')),
  -- Learned Data
  url_pattern TEXT,
  domain TEXT,
  action_sequence JSONB NOT NULL DEFAULT '[]',
  element_patterns JSONB DEFAULT '{}',
  success_indicators JSONB DEFAULT '[]',
  failure_indicators JSONB DEFAULT '[]',
  -- Confidence
  confidence_score NUMERIC(4,3),
  sample_count INTEGER DEFAULT 0,
  validation_count INTEGER DEFAULT 0,
  -- Generalization
  is_generalized BOOLEAN DEFAULT FALSE,
  generalized_at TIMESTAMPTZ,
  generalization_notes TEXT,
  -- Conversion to Task
  converted_to_task_id UUID REFERENCES browser_replay_tasks(id),
  converted_at TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'learning', 'validated', 'approved', 'rejected')),
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROWSER ACTION LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  replay_run_id UUID REFERENCES browser_replay_runs(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'navigate', 'click', 'type', 'select', 'scroll', 'hover', 'wait',
    'screenshot', 'evaluate', 'file_upload', 'file_download',
    'cookie_set', 'cookie_get', 'storage_set', 'storage_get',
    'frame_switch', 'popup_handle', 'dialog_handle', 'keyboard', 'mouse'
  )),
  action_target TEXT,
  action_selector TEXT,
  action_value TEXT,
  action_options JSONB DEFAULT '{}',
  -- Execution
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'success', 'failed', 'skipped')),
  -- Context
  url_before TEXT,
  url_after TEXT,
  page_title TEXT,
  -- Results
  result_value JSONB,
  screenshot_path TEXT,
  -- Errors
  error_message TEXT,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,
  -- Safety
  was_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  requires_approval BOOLEAN DEFAULT FALSE,
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Browser Sessions
CREATE INDEX IF NOT EXISTS idx_browser_sessions_workspace ON browser_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user ON browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_status ON browser_sessions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_last_used ON browser_sessions(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_expires ON browser_sessions(expires_at) WHERE expires_at IS NOT NULL;

-- Browser DOM Maps
CREATE INDEX IF NOT EXISTS idx_dom_maps_session ON browser_dom_maps(browser_session_id);
CREATE INDEX IF NOT EXISTS idx_dom_maps_workspace ON browser_dom_maps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dom_maps_url ON browser_dom_maps(browser_session_id, url);
CREATE INDEX IF NOT EXISTS idx_dom_maps_captured ON browser_dom_maps(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_dom_maps_validation ON browser_dom_maps(validation_status);

-- Browser Replay Tasks
CREATE INDEX IF NOT EXISTS idx_replay_tasks_workspace ON browser_replay_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_replay_tasks_category ON browser_replay_tasks(workspace_id, category);
CREATE INDEX IF NOT EXISTS idx_replay_tasks_status ON browser_replay_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_replay_tasks_name ON browser_replay_tasks(workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_replay_tasks_last_run ON browser_replay_tasks(last_run_at DESC) WHERE last_run_at IS NOT NULL;

-- Browser Replay Runs
CREATE INDEX IF NOT EXISTS idx_replay_runs_task ON browser_replay_runs(replay_task_id);
CREATE INDEX IF NOT EXISTS idx_replay_runs_session ON browser_replay_runs(browser_session_id) WHERE browser_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_replay_runs_workspace ON browser_replay_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_replay_runs_status ON browser_replay_runs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_replay_runs_started ON browser_replay_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_replay_runs_approval ON browser_replay_runs(approval_status) WHERE approval_status = 'pending';

-- Browser Learned Patterns
CREATE INDEX IF NOT EXISTS idx_learned_patterns_workspace ON browser_learned_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_type ON browser_learned_patterns(workspace_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_status ON browser_learned_patterns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_domain ON browser_learned_patterns(domain);

-- Browser Action Logs
CREATE INDEX IF NOT EXISTS idx_action_logs_session ON browser_action_logs(browser_session_id) WHERE browser_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_logs_run ON browser_action_logs(replay_run_id) WHERE replay_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_logs_workspace ON browser_action_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_type ON browser_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_action_logs_status ON browser_action_logs(status);
CREATE INDEX IF NOT EXISTS idx_action_logs_started ON browser_action_logs(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_dom_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_replay_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_replay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_action_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "browser_sessions_workspace_isolation" ON browser_sessions;
  DROP POLICY IF EXISTS "browser_dom_maps_workspace_isolation" ON browser_dom_maps;
  DROP POLICY IF EXISTS "browser_replay_tasks_workspace_isolation" ON browser_replay_tasks;
  DROP POLICY IF EXISTS "browser_replay_runs_workspace_isolation" ON browser_replay_runs;
  DROP POLICY IF EXISTS "browser_learned_patterns_workspace_isolation" ON browser_learned_patterns;
  DROP POLICY IF EXISTS "browser_action_logs_workspace_isolation" ON browser_action_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies
CREATE POLICY "browser_sessions_workspace_isolation" ON browser_sessions
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "browser_dom_maps_workspace_isolation" ON browser_dom_maps
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "browser_replay_tasks_workspace_isolation" ON browser_replay_tasks
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "browser_replay_runs_workspace_isolation" ON browser_replay_runs
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "browser_learned_patterns_workspace_isolation" ON browser_learned_patterns
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "browser_action_logs_workspace_isolation" ON browser_action_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update replay task stats after run
CREATE OR REPLACE FUNCTION update_replay_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'failed')) THEN
    UPDATE browser_replay_tasks
    SET
      run_count = run_count + 1,
      success_count = success_count + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      failure_count = failure_count + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      success_rate = CASE
        WHEN run_count + 1 > 0
        THEN ((success_count + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC / (run_count + 1)) * 100
        ELSE 0
      END,
      last_run_at = NOW(),
      last_success_at = CASE WHEN NEW.status = 'completed' THEN NOW() ELSE last_success_at END,
      last_failure_at = CASE WHEN NEW.status = 'failed' THEN NOW() ELSE last_failure_at END,
      last_failure_reason = CASE WHEN NEW.status = 'failed' THEN NEW.error_message ELSE last_failure_reason END,
      updated_at = NOW()
    WHERE id = NEW.replay_task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_replay_task_stats ON browser_replay_runs;
CREATE TRIGGER trigger_update_replay_task_stats
  AFTER INSERT OR UPDATE ON browser_replay_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_replay_task_stats();

-- Update session usage stats
CREATE OR REPLACE FUNCTION update_session_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE browser_sessions
  SET
    action_count = action_count + 1,
    last_action_at = NEW.started_at,
    last_used_at = NOW(),
    navigation_count = navigation_count + CASE WHEN NEW.action_type = 'navigate' THEN 1 ELSE 0 END,
    last_navigation_url = CASE WHEN NEW.action_type = 'navigate' THEN NEW.url_after ELSE last_navigation_url END,
    error_count = error_count + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = NEW.browser_session_id AND NEW.browser_session_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_usage ON browser_action_logs;
CREATE TRIGGER trigger_update_session_usage
  AFTER INSERT ON browser_action_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_session_usage_stats();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_browser_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_browser_sessions_updated_at ON browser_sessions;
CREATE TRIGGER trigger_browser_sessions_updated_at
  BEFORE UPDATE ON browser_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_browser_updated_at();

DROP TRIGGER IF EXISTS trigger_replay_tasks_updated_at ON browser_replay_tasks;
CREATE TRIGGER trigger_replay_tasks_updated_at
  BEFORE UPDATE ON browser_replay_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_browser_updated_at();

DROP TRIGGER IF EXISTS trigger_learned_patterns_updated_at ON browser_learned_patterns;
CREATE TRIGGER trigger_learned_patterns_updated_at
  BEFORE UPDATE ON browser_learned_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_browser_updated_at();
