/**
 * H01: AI Rule Suggestion Studio
 *
 * Creates tenant-scoped tables for AI/heuristic rule suggestions and feedback.
 * All signals and suggestions are PII-free (no raw payloads, emails, URLs, user names).
 * Rule drafts are compatible with existing Guardian rule creation schema.
 */

-- Table 1: guardian_rule_suggestions
-- Stores rule suggestions from AI or heuristics, with status tracking and expiry.
CREATE TABLE IF NOT EXISTS guardian_rule_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new',
  -- Valid statuses: 'new', 'reviewing', 'accepted', 'rejected', 'applied', 'expired'

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'ai',
  -- 'ai' = from AI model, 'heuristic' = from deterministic pattern matching

  -- Suggestion metadata
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,  -- PII-free explanation of why this rule is suggested
  confidence NUMERIC NULL,  -- 0.0..1.0 if from AI; fixed values (e.g., 0.65) if heuristic

  -- Signal aggregates used (PII-free: counts, rates, windows only)
  signals JSONB NOT NULL,

  -- Rule draft in Guardian rule schema format (compatible with existing rule creation)
  -- Must not contain raw payloads, emails, webhook URLs, API keys, or identifying data
  rule_draft JSONB NOT NULL,

  -- Safety assertions
  safety JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   prompt_safety: { redacted_fields: string[], data_only: boolean },
  --   validation: { passed: boolean, errors?: string[] },
  --   pii_check: { found_prohibited_keys: string[] }
  -- }

  -- Apply tracking
  applied_rule_id UUID NULL,  -- Set when admin applies suggestion via rule creation flow

  -- Expiry
  expires_at TIMESTAMPTZ NULL,

  -- Audit
  created_by TEXT NULL,  -- Actor/admin who created suggestion (for Z10 audit tracking)

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT status_valid CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected', 'applied', 'expired')),
  CONSTRAINT source_valid CHECK (source IN ('ai', 'heuristic'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_rule_suggestions_tenant_status ON guardian_rule_suggestions(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_suggestions_tenant_created ON guardian_rule_suggestions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_suggestions_tenant_expires ON guardian_rule_suggestions(tenant_id, expires_at);

-- Table 2: guardian_rule_suggestion_feedback
-- Tracks admin interactions with suggestions (views, votes, accepts, applies)
CREATE TABLE IF NOT EXISTS guardian_rule_suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES guardian_rule_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Feedback action
  action TEXT NOT NULL,
  -- Valid actions: 'viewed', 'thumbs_up', 'thumbs_down', 'accepted', 'rejected', 'applied'

  -- Optional rating and reason
  rating INTEGER NULL,  -- 1..5 rating, optional
  reason TEXT NULL,     -- Explanation for rejection/acceptance (treat as sensitive)
  notes TEXT NULL,      -- Free-text admin notes (treat as sensitive; redact by default in exports)

  -- Audit
  actor TEXT NULL,      -- Admin/user who gave feedback

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT action_valid CHECK (action IN ('viewed', 'thumbs_up', 'thumbs_down', 'accepted', 'rejected', 'applied')),
  CONSTRAINT rating_valid CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- Indexes for feedback queries
CREATE INDEX IF NOT EXISTS idx_rule_suggestion_feedback_suggestion ON guardian_rule_suggestion_feedback(suggestion_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_suggestion_feedback_tenant_action ON guardian_rule_suggestion_feedback(tenant_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_suggestion_feedback_tenant ON guardian_rule_suggestion_feedback(tenant_id, created_at DESC);

-- Enable RLS on both tables
ALTER TABLE guardian_rule_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_rule_suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: guardian_rule_suggestions
-- Tenant isolation: can only see own tenant's suggestions
DROP POLICY IF EXISTS "tenant_isolation_rule_suggestions" ON guardian_rule_suggestions;
CREATE POLICY "tenant_isolation_rule_suggestions" ON guardian_rule_suggestions
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policy: guardian_rule_suggestion_feedback
-- Tenant isolation: can only see own tenant's feedback
DROP POLICY IF EXISTS "tenant_isolation_rule_suggestion_feedback" ON guardian_rule_suggestion_feedback;
CREATE POLICY "tenant_isolation_rule_suggestion_feedback" ON guardian_rule_suggestion_feedback
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Comments for documentation
COMMENT ON TABLE guardian_rule_suggestions IS
  'Tenant-scoped AI/heuristic rule suggestions. All signals are PII-free aggregates. Rule drafts are compatible with existing Guardian rule creation schema. Suggestions are advisory-only; admins must explicitly review and apply them.';

COMMENT ON COLUMN guardian_rule_suggestions.signals IS
  'PII-free aggregates only: counts, rates, time windows. Never includes raw events, payloads, emails, URLs, or identifying data.';

COMMENT ON COLUMN guardian_rule_suggestions.rule_draft IS
  'Rule definition in Guardian rule schema format. Must be compatible with existing rule creation APIs. Must not contain raw payloads, emails, webhook URLs, API keys, or identifying data.';

COMMENT ON COLUMN guardian_rule_suggestions.safety IS
  'Safety validation results: prompt redactions applied, validation outcomes, prohibited key checks.';

COMMENT ON TABLE guardian_rule_suggestion_feedback IS
  'Tracks admin interactions with suggestions: views, votes, accepts/rejects, applies. Sensitive fields (reason, notes) should be redacted in exports by default.';
