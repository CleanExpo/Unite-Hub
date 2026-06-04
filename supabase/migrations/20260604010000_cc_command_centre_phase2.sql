-- ============================================================
-- Nexus Command Centre — Data Model Phase 2 (remaining cc_* tables)
-- Spec: NEXUS_AUTONOMOUS_COMMAND_CENTER_SPEC.md §6 (data model)
-- Companion to: 20260604000000_cc_command_centre.sql (cc_tasks/events/evidence)
-- Date: 2026-06-04
--
-- Additive only. Founder-scoped RLS on every table (founder_id = auth.uid()),
-- mirroring the phase-1 migration. Reversible "-- DOWN / rollback" at the foot.
--
-- APPLY TARGET: "Unite-Group Test" project (xgqwfwqumliuguzhshwv) — NOT production.
-- Apply phase 1 first, then this file (cc_approvals/validation/sessions/decisions
-- reference cc_tasks; cc_risks/brand_rules reference cc_projects defined here).
--
-- Tables added:
--   cc_projects · cc_agents · cc_tools · cc_decisions · cc_approvals
--   cc_validation_runs · cc_risks · cc_brand_rules · cc_execution_sessions
-- ============================================================

-- ============================================================
-- 1. CC_PROJECTS (registry, durable)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  repo_path           TEXT,
  github_repo         TEXT,
  brand_rules_ref     TEXT,
  business_purpose    TEXT NOT NULL DEFAULT '',
  deployment_target   TEXT,
  owner               TEXT,
  agent_team          TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'stub', 'paused', 'archived')),
  evidence_vault_path TEXT,
  validation_commands TEXT[] NOT NULL DEFAULT '{}',
  linear_prefix       TEXT,
  production_url       TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, name)
);
COMMENT ON TABLE cc_projects IS 'Command Centre project registry (durable mirror of projects.json)';

-- ============================================================
-- 2. CC_AGENTS (specialist agent roster)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_agents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT '',
  autonomy_max_level INT NOT NULL DEFAULT 1 CHECK (autonomy_max_level BETWEEN 0 AND 5),
  model_tier         TEXT,
  skills             TEXT[] NOT NULL DEFAULT '{}',
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, name)
);
COMMENT ON TABLE cc_agents IS 'Specialist senior-agent roster + per-agent autonomy cap';

-- ============================================================
-- 3. CC_TOOLS (Universal Tool Access Layer catalogue)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_tools (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key          TEXT NOT NULL,
  source            TEXT NOT NULL
                    CHECK (source IN ('hermes', 'mcp', 'project', 'codex', 'claude-code', 'local')),
  server            TEXT,
  description       TEXT NOT NULL DEFAULT '',
  input_schema      JSONB NOT NULL DEFAULT '{}',
  risk_class        TEXT NOT NULL DEFAULT 'read'
                    CHECK (risk_class IN ('read', 'write-local', 'write-shared', 'external', 'destructive')),
  required_level    INT NOT NULL DEFAULT 0 CHECK (required_level BETWEEN 0 AND 5),
  project_scope     UUID[] NOT NULL DEFAULT '{}',
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  discovered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(founder_id, tool_key)
);
COMMENT ON TABLE cc_tools IS 'Federated tool catalogue for the Universal Tool Access Layer (Module I)';

-- ============================================================
-- 4. CC_DECISIONS (Senior Board deliberations)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES cc_tasks(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  verdict     TEXT NOT NULL DEFAULT 'HOLD' CHECK (verdict IN ('APPROVED', 'HOLD', 'REJECTED')),
  rationale   TEXT NOT NULL DEFAULT '',
  personas    JSONB NOT NULL DEFAULT '{}',
  wiki_path   TEXT,
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cc_decisions IS '9-persona Board verdicts + rationale (links to a task when applicable)';

-- ============================================================
-- 5. CC_APPROVALS (human approve/reject/edit/defer)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES cc_tasks(id) ON DELETE CASCADE,
  decision    TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'edit', 'defer')),
  approver    TEXT NOT NULL DEFAULT '',
  note        TEXT,
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cc_approvals IS 'Human approval decisions gating task promotion';

-- ============================================================
-- 6. CC_VALIDATION_RUNS (quality-gate results)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_validation_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id       UUID NOT NULL REFERENCES cc_tasks(id) ON DELETE CASCADE,
  gate          TEXT NOT NULL,
  command       TEXT,
  result        TEXT NOT NULL DEFAULT 'skip' CHECK (result IN ('pass', 'fail', 'skip')),
  evidence_path TEXT,
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cc_validation_runs IS 'Validation/quality-gate run results per task (no fake-green)';

-- ============================================================
-- 7. CC_RISKS (risk register)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_risks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id         UUID REFERENCES cc_projects(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  severity           TEXT NOT NULL DEFAULT 'medium'
                     CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence           TEXT,
  impact             TEXT,
  recommended_action TEXT,
  owner_role         TEXT,
  status             TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'mitigating', 'accepted', 'closed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cc_risks IS 'Command Centre risk register entries';

-- ============================================================
-- 8. CC_BRAND_RULES (per-project brand locks)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_brand_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES cc_projects(id) ON DELETE CASCADE,
  tokens_ref       TEXT,
  locks            JSONB NOT NULL DEFAULT '{}',
  deviation_policy TEXT NOT NULL DEFAULT 'do-not-deviate-unless-authorised',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cc_brand_rules IS 'Per-project brand-lock rules ("do not deviate unless authorised")';

-- ============================================================
-- 9. CC_EXECUTION_SESSIONS (agent runs)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_execution_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES cc_tasks(id) ON DELETE CASCADE,
  surface     TEXT NOT NULL DEFAULT 'local'
              CHECK (surface IN ('codex', 'claude-code', 'pi-ceo-dev', 'local')),
  status      TEXT NOT NULL DEFAULT 'running'
              CHECK (status IN ('running', 'paused', 'done', 'failed')),
  logs_ref    TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);
COMMENT ON TABLE cc_execution_sessions IS 'Agent execution sessions per task (start/pause/resume/recover)';

-- ============================================================
-- 10. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS cc_projects_founder_status_idx     ON cc_projects(founder_id, status);
CREATE INDEX IF NOT EXISTS cc_agents_founder_active_idx       ON cc_agents(founder_id, active);
CREATE INDEX IF NOT EXISTS cc_tools_founder_source_idx        ON cc_tools(founder_id, source);
CREATE INDEX IF NOT EXISTS cc_decisions_founder_at_idx        ON cc_decisions(founder_id, at DESC);
CREATE INDEX IF NOT EXISTS cc_decisions_task_idx              ON cc_decisions(task_id);
CREATE INDEX IF NOT EXISTS cc_approvals_task_idx              ON cc_approvals(task_id, at DESC);
CREATE INDEX IF NOT EXISTS cc_validation_runs_task_idx        ON cc_validation_runs(task_id, ran_at DESC);
CREATE INDEX IF NOT EXISTS cc_risks_founder_project_idx       ON cc_risks(founder_id, project_id);
CREATE INDEX IF NOT EXISTS cc_brand_rules_project_idx         ON cc_brand_rules(project_id);
CREATE INDEX IF NOT EXISTS cc_execution_sessions_task_idx     ON cc_execution_sessions(task_id, started_at DESC);

-- ============================================================
-- 11. RLS (founder-scoped on every table)
-- ============================================================
ALTER TABLE cc_projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_tools              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_decisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_approvals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_validation_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_risks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_brand_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_execution_sessions ENABLE ROW LEVEL SECURITY;

-- Full CRUD, founder-owned, for the config/registry tables.
CREATE POLICY cc_projects_all  ON cc_projects  FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_agents_all    ON cc_agents    FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_tools_all     ON cc_tools     FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_risks_all     ON cc_risks     FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_brand_rules_all ON cc_brand_rules FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

-- Decisions: founder SELECT/INSERT (verdicts are not edited after the fact).
CREATE POLICY cc_decisions_select ON cc_decisions FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_decisions_insert ON cc_decisions FOR INSERT WITH CHECK (founder_id = auth.uid());

-- Approvals / validation_runs / execution_sessions: founder-owned, linked to an owned task.
CREATE POLICY cc_approvals_select ON cc_approvals FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_approvals_insert ON cc_approvals FOR INSERT WITH CHECK (
  founder_id = auth.uid() AND EXISTS (SELECT 1 FROM cc_tasks t WHERE t.id = cc_approvals.task_id AND t.founder_id = auth.uid()));

CREATE POLICY cc_validation_runs_select ON cc_validation_runs FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_validation_runs_insert ON cc_validation_runs FOR INSERT WITH CHECK (
  founder_id = auth.uid() AND EXISTS (SELECT 1 FROM cc_tasks t WHERE t.id = cc_validation_runs.task_id AND t.founder_id = auth.uid()));

CREATE POLICY cc_execution_sessions_select ON cc_execution_sessions FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_execution_sessions_insert ON cc_execution_sessions FOR INSERT WITH CHECK (
  founder_id = auth.uid() AND EXISTS (SELECT 1 FROM cc_tasks t WHERE t.id = cc_execution_sessions.task_id AND t.founder_id = auth.uid()));
CREATE POLICY cc_execution_sessions_update ON cc_execution_sessions FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

-- ============================================================
-- 12. updated_at triggers (reuse cc_update_updated_at_column from phase 1)
-- ============================================================
DROP TRIGGER IF EXISTS cc_projects_updated_at ON cc_projects;
CREATE TRIGGER cc_projects_updated_at BEFORE UPDATE ON cc_projects FOR EACH ROW EXECUTE FUNCTION cc_update_updated_at_column();

-- ============================================================
-- DOWN / rollback  (drop in reverse dependency order)
-- ============================================================
-- DROP TRIGGER IF EXISTS cc_projects_updated_at ON cc_projects;
-- DROP TABLE IF EXISTS cc_execution_sessions;
-- DROP TABLE IF EXISTS cc_brand_rules;
-- DROP TABLE IF EXISTS cc_risks;
-- DROP TABLE IF EXISTS cc_validation_runs;
-- DROP TABLE IF EXISTS cc_approvals;
-- DROP TABLE IF EXISTS cc_decisions;
-- DROP TABLE IF EXISTS cc_tools;
-- DROP TABLE IF EXISTS cc_agents;
-- DROP TABLE IF EXISTS cc_projects;
-- ============================================================
