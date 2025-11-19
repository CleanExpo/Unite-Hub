-- Phase 10 Week 7-8: Operator Playbooks, Guardrails, and Sandbox Mode
-- Training sandbox and guardrail policies for safer human-in-the-loop decisions

-- Operator Playbooks Table - Define operational procedures
CREATE TABLE IF NOT EXISTS operator_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Playbook metadata
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,

  -- Scope
  domain TEXT, -- NULL means all domains
  risk_level TEXT CHECK (risk_level IN ('LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK')),

  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, name, version)
);

-- Playbook Rules Table - Individual rules within a playbook
CREATE TABLE IF NOT EXISTS playbook_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES operator_playbooks(id) ON DELETE CASCADE,

  -- Rule definition
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'GUARDRAIL',        -- Block or require approval
    'COACHING',         -- Show hints/tips
    'AUTOMATION',       -- Auto-actions
    'ESCALATION',       -- Escalation triggers
    'VALIDATION'        -- Pre-flight checks
  )),

  -- Conditions (JSON: { "operator_score": "<50", "domain": "SEO", "risk": "HIGH" })
  conditions JSONB NOT NULL DEFAULT '{}',

  -- Actions
  action TEXT NOT NULL CHECK (action IN (
    'ALLOW',            -- Permit the action
    'BLOCK',            -- Prevent the action
    'REQUIRE_QUORUM',   -- Require multi-approval
    'SIMULATE',         -- Run in sandbox only
    'ESCALATE',         -- Escalate to higher role
    'NOTIFY',           -- Send notification
    'COACH'             -- Show coaching hint
  )),

  -- Action parameters
  action_params JSONB DEFAULT '{}',

  -- Coaching content
  coaching_message TEXT,
  coaching_severity TEXT CHECK (coaching_severity IN ('INFO', 'WARNING', 'CRITICAL')),

  -- Priority (higher = evaluated first)
  priority INTEGER NOT NULL DEFAULT 100,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Playbook Assignments Table - Assign playbooks to teams/roles
CREATE TABLE IF NOT EXISTS playbook_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES operator_playbooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Assignment target
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('ROLE', 'USER', 'TEAM')),
  target_role TEXT CHECK (target_role IN ('OWNER', 'MANAGER', 'ANALYST')),
  target_user_id UUID REFERENCES auth.users(id),
  target_team_id UUID,

  -- Assignment metadata
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE(playbook_id, target_role) WHERE assignment_type = 'ROLE',
  UNIQUE(playbook_id, target_user_id) WHERE assignment_type = 'USER'
);

-- Guardrail Evaluations Table - Log guardrail decisions
CREATE TABLE IF NOT EXISTS guardrail_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Context
  operator_id UUID REFERENCES auth.users(id),
  proposal_id UUID,
  queue_item_id UUID,

  -- Evaluation input
  domain TEXT,
  risk_level TEXT,
  operator_score DECIMAL(5,2),

  -- Result
  evaluated_rules UUID[],
  final_action TEXT NOT NULL,
  blocking_rule_id UUID REFERENCES playbook_rules(id),

  -- Metadata
  evaluation_context JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sandbox Executions Table - Track sandbox simulations
CREATE TABLE IF NOT EXISTS sandbox_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Source
  proposal_id UUID,
  queue_item_id UUID,
  operator_id UUID REFERENCES auth.users(id),

  -- Simulation details
  execution_type TEXT NOT NULL,
  input_data JSONB NOT NULL,

  -- Simulated outcome
  simulated_result JSONB NOT NULL,
  would_have_succeeded BOOLEAN,

  -- Side effects (what would have happened)
  simulated_side_effects JSONB DEFAULT '[]',

  -- Learnings
  insights TEXT[],
  warnings TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaching Hints Table - Track coaching delivery
CREATE TABLE IF NOT EXISTS coaching_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  operator_id UUID REFERENCES auth.users(id),

  -- Source
  rule_id UUID REFERENCES playbook_rules(id),
  context_type TEXT NOT NULL CHECK (context_type IN ('APPROVAL_QUEUE', 'REVIEW_THREAD', 'DASHBOARD', 'EXECUTION')),

  -- Hint content
  hint_type TEXT NOT NULL CHECK (hint_type IN ('TIP', 'WARNING', 'BEST_PRACTICE', 'LEARNING', 'REMINDER')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',

  -- Context
  related_proposal_id UUID,
  related_queue_item_id UUID,

  -- Interaction
  was_dismissed BOOLEAN DEFAULT false,
  was_helpful BOOLEAN,
  feedback TEXT,

  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playbooks_org ON operator_playbooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_status ON operator_playbooks(status);
CREATE INDEX IF NOT EXISTS idx_playbooks_domain ON operator_playbooks(domain);

CREATE INDEX IF NOT EXISTS idx_playbook_rules_playbook ON playbook_rules(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_rules_type ON playbook_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_playbook_rules_action ON playbook_rules(action);
CREATE INDEX IF NOT EXISTS idx_playbook_rules_priority ON playbook_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_assignments_playbook ON playbook_assignments(playbook_id);
CREATE INDEX IF NOT EXISTS idx_assignments_org ON playbook_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_role ON playbook_assignments(target_role);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON playbook_assignments(target_user_id);

CREATE INDEX IF NOT EXISTS idx_guardrail_evals_org ON guardrail_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_evals_operator ON guardrail_evaluations(operator_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_evals_action ON guardrail_evaluations(final_action);

CREATE INDEX IF NOT EXISTS idx_sandbox_org ON sandbox_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_operator ON sandbox_executions(operator_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_created ON sandbox_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_operator ON coaching_hints(operator_id);
CREATE INDEX IF NOT EXISTS idx_coaching_context ON coaching_hints(context_type);
CREATE INDEX IF NOT EXISTS idx_coaching_shown ON coaching_hints(shown_at DESC);

-- RLS Policies
ALTER TABLE operator_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardrail_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_hints ENABLE ROW LEVEL SECURITY;

-- Playbooks: org members can read, managers can modify
CREATE POLICY playbooks_select ON operator_playbooks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY playbooks_insert ON operator_playbooks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY playbooks_update ON operator_playbooks
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY playbooks_delete ON operator_playbooks
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- Rules: follow playbook permissions
CREATE POLICY rules_select ON playbook_rules
  FOR SELECT USING (
    playbook_id IN (
      SELECT id FROM operator_playbooks
      WHERE organization_id IN (
        SELECT organization_id FROM operator_profiles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY rules_insert ON playbook_rules
  FOR INSERT WITH CHECK (
    playbook_id IN (
      SELECT id FROM operator_playbooks
      WHERE organization_id IN (
        SELECT organization_id FROM operator_profiles
        WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
      )
    )
  );

CREATE POLICY rules_update ON playbook_rules
  FOR UPDATE USING (
    playbook_id IN (
      SELECT id FROM operator_playbooks
      WHERE organization_id IN (
        SELECT organization_id FROM operator_profiles
        WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
      )
    )
  );

CREATE POLICY rules_delete ON playbook_rules
  FOR DELETE USING (
    playbook_id IN (
      SELECT id FROM operator_playbooks
      WHERE organization_id IN (
        SELECT organization_id FROM operator_profiles
        WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
      )
    )
  );

-- Assignments: managers can manage
CREATE POLICY assignments_select ON playbook_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY assignments_insert ON playbook_assignments
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY assignments_update ON playbook_assignments
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY assignments_delete ON playbook_assignments
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Guardrail evaluations: read own or org-wide for managers
CREATE POLICY evals_select ON guardrail_evaluations
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY evals_insert ON guardrail_evaluations
  FOR INSERT WITH CHECK (true);

-- Sandbox executions: similar to evaluations
CREATE POLICY sandbox_select ON sandbox_executions
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY sandbox_insert ON sandbox_executions
  FOR INSERT WITH CHECK (true);

-- Coaching hints: operators see own
CREATE POLICY coaching_select ON coaching_hints
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY coaching_insert ON coaching_hints
  FOR INSERT WITH CHECK (true);

CREATE POLICY coaching_update ON coaching_hints
  FOR UPDATE USING (operator_id = auth.uid());
