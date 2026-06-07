import { getOperatorLanes } from './lanes'

export type SkillStatus = 'active' | 'inactive' | 'blocked_op' | 'pending_install' | 'design_only'
export type MissionRouteStatus = 'routed' | 'blocked_hard_gate'

export interface SpecializedSkillRecord {
  skillId: string
  name: string
  domain: string
  seniority: string
  description: string
  allowedTaskTypes: string[]
  prohibitedTaskTypes: string[]
  defaultOperatorLane: string
  fallbackLane: string
  evidenceRequired: string[]
  dashboardSurface: string
  requiresHumanApproval: boolean
  productionGateRequired: boolean
  status: SkillStatus
}

export interface MissionAction {
  sequence: number
  title: string
  defaultSkill: string
  defaultLane: string
  status: 'sandbox_job_candidate'
  allowedCommands: string[]
  prohibitedActions: string[]
}

export interface BusinessMissionTemplate {
  templateId: string
  objective: string
  defaultSkillTeam: string[]
  defaultLanes: string[]
  first20Actions: MissionAction[]
  allowedCommands: string[]
  evidenceOutputs: string[]
  stopGates: string[]
}

export interface MissionRouteResult {
  ok: boolean
  status: MissionRouteStatus
  selectedTemplateId: string | null
  selectedSkillTeam: string[]
  operatorLanes: string[]
  actions: MissionAction[]
  hardGates: string[]
  evidenceOutputs: string[]
  externalExecutionEnabled: false
  apiKeyMode: false
  productionDbTouched: false
  dashboardSurface: 'specialized_skill_mesh'
  nextBoardGate: string | null
}

const RAW_SKILLS = [
  {
    "skill_id": "senior_project_manager",
    "name": "Senior Project Manager",
    "domain": "orchestration",
    "seniority": "senior",
    "description": "Turns Board objectives into bounded batches, next 15-20 actions, sandbox jobs, evidence, and stop gates.",
    "allowed_task_types": [
      "mission_analysis",
      "decomposition",
      "prioritisation",
      "sandbox_job_creation",
      "evidence_audit"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "board_strategy_council",
    "name": "Board Strategy Council",
    "domain": "strategy",
    "seniority": "board",
    "description": "Reviews risk, business value, $2b thesis alignment, and authority gates before execution expansion.",
    "allowed_task_types": [
      "board_packet",
      "risk_review",
      "growth_strategy",
      "decision_options"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": true,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "senior_software_engineer",
    "name": "Senior Software Engineer",
    "domain": "engineering",
    "seniority": "senior",
    "description": "Reads code before writing, implements safe local changes, tests, and prepares PRs without deployment.",
    "allowed_task_types": [
      "feature_implementation",
      "refactor",
      "test_authoring",
      "code_review"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "openai_codex_max",
    "fallback_lane": "hermes_local",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "senior_devops",
    "name": "Senior DevOps",
    "domain": "devops",
    "seniority": "senior",
    "description": "Maintains local CI, scripts, cron, dashboards, and release readiness without prod deploy.",
    "allowed_task_types": [
      "local_validation",
      "cron_verification",
      "ci_triage",
      "release_readiness"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "senior_qa",
    "name": "Senior QA",
    "domain": "quality",
    "seniority": "senior",
    "description": "Defines acceptance criteria, writes validation tests, and blocks false-green shipping.",
    "allowed_task_types": [
      "test_plan",
      "regression_test",
      "acceptance_check",
      "gate_verification"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "security_compliance",
    "name": "Security / Compliance",
    "domain": "security",
    "seniority": "senior",
    "description": "Protects secrets, auth, data boundaries, auditability, compliance and hard-gate refusal.",
    "allowed_task_types": [
      "security_review",
      "secret_scan",
      "policy_check",
      "audit_review"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": true,
    "status": "active"
  },
  {
    "skill_id": "research_intelligence",
    "name": "Research Intelligence",
    "domain": "research",
    "seniority": "senior",
    "description": "Converts local/web-approved research into structured market, product, and competitor intelligence.",
    "allowed_task_types": [
      "local_research",
      "market_synthesis",
      "source_review",
      "opportunity_map"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "business_growth",
    "name": "Business Growth",
    "domain": "growth",
    "seniority": "senior",
    "description": "Maps revenue levers, partnerships, funnel improvements, and unit-economics actions.",
    "allowed_task_types": [
      "growth_plan",
      "funnel_review",
      "pricing_packet",
      "partnership_map"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "seo_aeo_geo",
    "name": "SEO/AEO/GEO",
    "domain": "marketing",
    "seniority": "senior",
    "description": "Plans search, answer-engine, and generative-engine visibility campaigns.",
    "allowed_task_types": [
      "keyword_research",
      "content_brief",
      "schema_plan",
      "geo_visibility"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "content_engine",
    "name": "Content Engine",
    "domain": "content",
    "seniority": "senior",
    "description": "Creates approval-gated content packets, briefs, posts, and campaign calendars without publishing.",
    "allowed_task_types": [
      "content_brief",
      "campaign_plan",
      "draft_generation",
      "approval_packet"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "course_builder",
    "name": "Course Builder",
    "domain": "education",
    "seniority": "senior",
    "description": "Builds course outlines, lessons, assessments, and product launch assets for CARSI and future products.",
    "allowed_task_types": [
      "course_outline",
      "lesson_plan",
      "assessment_plan",
      "launch_packet"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "restoreassist_product_ops",
    "name": "RestoreAssist Product Ops",
    "domain": "product",
    "seniority": "senior",
    "description": "Coordinates RestoreAssist readiness, standalone-business evidence, feature gates, and sale-readiness assets.",
    "allowed_task_types": [
      "restoreassist_readiness",
      "feature_readiness",
      "standalone_review",
      "client_ops"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "disaster_recovery_ops",
    "name": "Disaster Recovery Ops",
    "domain": "product",
    "seniority": "senior",
    "description": "Coordinates DR/NRPG content, operational runbooks, safety boundaries, and campaign readiness.",
    "allowed_task_types": [
      "dr_campaign",
      "nrpg_review",
      "runbook_update",
      "evidence_packet"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "evidence_audit_clerk",
    "name": "Evidence / Audit Clerk",
    "domain": "governance",
    "seniority": "senior",
    "description": "Writes append-only evidence, audit, results, and dashboard status records.",
    "allowed_task_types": [
      "evidence_audit",
      "ledger_append",
      "dashboard_status",
      "results_packet"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "agentic_nexus_skill_exec",
    "fallback_lane": "hermes_local",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "dashboard_analyst",
    "name": "Dashboard Analyst",
    "domain": "analytics",
    "seniority": "senior",
    "description": "Turns artifacts into founder dashboard summaries, counts, risks, and next actions.",
    "allowed_task_types": [
      "dashboard",
      "status_feed",
      "metrics_summary",
      "blocked_gate_panel"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "agentic_nexus_skill_exec",
    "fallback_lane": "hermes_local",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "release_shipit_manager",
    "name": "Release / ShipIt Manager",
    "domain": "release",
    "seniority": "senior",
    "description": "Builds ShipIt readiness packets and stops before deploy/main/live gates unless named authority exists.",
    "allowed_task_types": [
      "shipit_readiness",
      "release_packet",
      "ci_review",
      "pr_readiness"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "hermes_local",
    "fallback_lane": "agentic_nexus_skill_exec",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": true,
    "production_gate_required": true,
    "status": "active"
  },
  {
    "skill_id": "local_operator_executor",
    "name": "Local Operator Executor",
    "domain": "execution",
    "seniority": "senior",
    "description": "Creates and dry-runs safe local/sandbox operator jobs, refusing external/prod/API-key actions.",
    "allowed_task_types": [
      "sandbox_job_creation",
      "dry_run",
      "local_execution",
      "policy_refusal"
    ],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing"
    ],
    "default_operator_lane": "agentic_nexus_skill_exec",
    "fallback_lane": "hermes_local",
    "evidence_required": [
      "objective",
      "input_artifacts",
      "actions_taken",
      "validation_output",
      "audit_record",
      "dashboard_update"
    ],
    "dashboard_surface": "specialized_skill_mesh",
    "requires_human_approval": false,
    "production_gate_required": false,
    "status": "active"
  },
  {
    "skill_id": "sandbox_voice_migration_blocked_op",
    "name": "Sandbox Voice Migration Lane",
    "domain": "voice",
    "seniority": "blocked",
    "description": "Explicitly blocked until 1Password CLI authentication is green; retained for visibility only.",
    "allowed_task_types": [],
    "prohibited_task_types": [
      "api_key_mode",
      "external_execution",
      "production_db",
      "deployment",
      "live_runner",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "sandbox_voice_apply"
    ],
    "default_operator_lane": "BLOCKED-OP",
    "fallback_lane": "none",
    "evidence_required": [
      "blocked_reason",
      "op_auth_status"
    ],
    "dashboard_surface": "blocked_gate_panel",
    "requires_human_approval": true,
    "production_gate_required": true,
    "status": "blocked_op"
  }
] as const
const RAW_TEMPLATES = [
  {
    "template_id": "carsi_course_product_launch",
    "objective": "Launch a CARSI course/product through local course outline, launch packet, SEO brief, evidence and Board gates.",
    "default_skill_team": [
      "senior_project_manager",
      "course_builder",
      "content_engine",
      "seo_aeo_geo",
      "business_growth",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for CARSI course/product launch",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for CARSI course/product launch",
        "default_skill": "course_builder",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for CARSI course/product launch",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for CARSI course/product launch",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for CARSI course/product launch",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for CARSI course/product launch",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for CARSI course/product launch",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for CARSI course/product launch",
        "default_skill": "course_builder",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for CARSI course/product launch",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for CARSI course/product launch",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for CARSI course/product launch",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for CARSI course/product launch",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for CARSI course/product launch",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for CARSI course/product launch",
        "default_skill": "course_builder",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for CARSI course/product launch",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for CARSI course/product launch",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for CARSI course/product launch",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for CARSI course/product launch",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for CARSI course/product launch",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for CARSI course/product launch",
        "default_skill": "course_builder",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "restoreassist_feature_readiness",
    "objective": "Prepare a RestoreAssist feature readiness packet and safe local implementation plan while keeping RestoreAssist standalone.",
    "default_skill_team": [
      "senior_project_manager",
      "senior_software_engineer",
      "restoreassist_product_ops",
      "senior_qa",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for RestoreAssist feature readiness",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for RestoreAssist feature readiness",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for RestoreAssist feature readiness",
        "default_skill": "restoreassist_product_ops",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for RestoreAssist feature readiness",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for RestoreAssist feature readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for RestoreAssist feature readiness",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for RestoreAssist feature readiness",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for RestoreAssist feature readiness",
        "default_skill": "restoreassist_product_ops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for RestoreAssist feature readiness",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for RestoreAssist feature readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for RestoreAssist feature readiness",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for RestoreAssist feature readiness",
        "default_skill": "senior_software_engineer",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for RestoreAssist feature readiness",
        "default_skill": "restoreassist_product_ops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for RestoreAssist feature readiness",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for RestoreAssist feature readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for RestoreAssist feature readiness",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for RestoreAssist feature readiness",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for RestoreAssist feature readiness",
        "default_skill": "restoreassist_product_ops",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for RestoreAssist feature readiness",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for RestoreAssist feature readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "disaster_recovery_content_seo_campaign",
    "objective": "Plan a DR/NRPG content and search campaign without publishing.",
    "default_skill_team": [
      "senior_project_manager",
      "disaster_recovery_ops",
      "seo_aeo_geo",
      "content_engine",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Disaster Recovery content/SEO campaign",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Disaster Recovery content/SEO campaign",
        "default_skill": "disaster_recovery_ops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Disaster Recovery content/SEO campaign",
        "default_skill": "seo_aeo_geo",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Disaster Recovery content/SEO campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Disaster Recovery content/SEO campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Disaster Recovery content/SEO campaign",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Disaster Recovery content/SEO campaign",
        "default_skill": "disaster_recovery_ops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Disaster Recovery content/SEO campaign",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Disaster Recovery content/SEO campaign",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Disaster Recovery content/SEO campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Disaster Recovery content/SEO campaign",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Disaster Recovery content/SEO campaign",
        "default_skill": "disaster_recovery_ops",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Disaster Recovery content/SEO campaign",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Disaster Recovery content/SEO campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Disaster Recovery content/SEO campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Disaster Recovery content/SEO campaign",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Disaster Recovery content/SEO campaign",
        "default_skill": "disaster_recovery_ops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Disaster Recovery content/SEO campaign",
        "default_skill": "seo_aeo_geo",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Disaster Recovery content/SEO campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Disaster Recovery content/SEO campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "unite_group_crm_improvement",
    "objective": "Improve Unite-Hub CRM founder surfaces or local logic with tests and PR gates.",
    "default_skill_team": [
      "senior_project_manager",
      "senior_software_engineer",
      "senior_qa",
      "dashboard_analyst",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Unite-Group CRM improvement",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Unite-Group CRM improvement",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Unite-Group CRM improvement",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Unite-Group CRM improvement",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Unite-Group CRM improvement",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Unite-Group CRM improvement",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Unite-Group CRM improvement",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Unite-Group CRM improvement",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Unite-Group CRM improvement",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Unite-Group CRM improvement",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Unite-Group CRM improvement",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Unite-Group CRM improvement",
        "default_skill": "senior_software_engineer",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Unite-Group CRM improvement",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Unite-Group CRM improvement",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Unite-Group CRM improvement",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Unite-Group CRM improvement",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Unite-Group CRM improvement",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Unite-Group CRM improvement",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Unite-Group CRM improvement",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Unite-Group CRM improvement",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "daily_ops_business_review",
    "objective": "Review daily operating outputs, blockers, evidence, and next autonomous mission.",
    "default_skill_team": [
      "senior_project_manager",
      "board_strategy_council",
      "dashboard_analyst",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Daily Ops business review",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Daily Ops business review",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Daily Ops business review",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Daily Ops business review",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Daily Ops business review",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Daily Ops business review",
        "default_skill": "board_strategy_council",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Daily Ops business review",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Daily Ops business review",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Daily Ops business review",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Daily Ops business review",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Daily Ops business review",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Daily Ops business review",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Daily Ops business review",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Daily Ops business review",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Daily Ops business review",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Daily Ops business review",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Daily Ops business review",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Daily Ops business review",
        "default_skill": "board_strategy_council",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Daily Ops business review",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Daily Ops business review",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "project_health_check",
    "objective": "Run local project health inspection and update status artifacts.",
    "default_skill_team": [
      "senior_project_manager",
      "senior_devops",
      "dashboard_analyst",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Project health check",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Project health check",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Project health check",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Project health check",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Project health check",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Project health check",
        "default_skill": "senior_devops",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Project health check",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Project health check",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Project health check",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Project health check",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Project health check",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Project health check",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Project health check",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Project health check",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Project health check",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Project health check",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Project health check",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Project health check",
        "default_skill": "senior_devops",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Project health check",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Project health check",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "seo_aeo_geo_research_sprint",
    "objective": "Create a search/answer/generative visibility research sprint packet.",
    "default_skill_team": [
      "research_intelligence",
      "seo_aeo_geo",
      "content_engine",
      "business_growth",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for SEO/AEO/GEO research sprint",
        "default_skill": "research_intelligence",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for SEO/AEO/GEO research sprint",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for SEO/AEO/GEO research sprint",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for SEO/AEO/GEO research sprint",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for SEO/AEO/GEO research sprint",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for SEO/AEO/GEO research sprint",
        "default_skill": "research_intelligence",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for SEO/AEO/GEO research sprint",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for SEO/AEO/GEO research sprint",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for SEO/AEO/GEO research sprint",
        "default_skill": "business_growth",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for SEO/AEO/GEO research sprint",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for SEO/AEO/GEO research sprint",
        "default_skill": "research_intelligence",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for SEO/AEO/GEO research sprint",
        "default_skill": "seo_aeo_geo",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for SEO/AEO/GEO research sprint",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for SEO/AEO/GEO research sprint",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for SEO/AEO/GEO research sprint",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for SEO/AEO/GEO research sprint",
        "default_skill": "research_intelligence",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for SEO/AEO/GEO research sprint",
        "default_skill": "seo_aeo_geo",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for SEO/AEO/GEO research sprint",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for SEO/AEO/GEO research sprint",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for SEO/AEO/GEO research sprint",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "social_content_campaign",
    "objective": "Draft approval-gated social campaign assets without publishing.",
    "default_skill_team": [
      "content_engine",
      "business_growth",
      "board_strategy_council",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Social content campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Social content campaign",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Social content campaign",
        "default_skill": "board_strategy_council",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Social content campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Social content campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Social content campaign",
        "default_skill": "business_growth",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Social content campaign",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Social content campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Social content campaign",
        "default_skill": "content_engine",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Social content campaign",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Social content campaign",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Social content campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Social content campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Social content campaign",
        "default_skill": "business_growth",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Social content campaign",
        "default_skill": "board_strategy_council",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Social content campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Social content campaign",
        "default_skill": "content_engine",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Social content campaign",
        "default_skill": "business_growth",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Social content campaign",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Social content campaign",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "saas_feature_build",
    "objective": "Turn a SaaS feature objective into local implementation, tests, evidence and PR readiness.",
    "default_skill_team": [
      "senior_project_manager",
      "senior_software_engineer",
      "senior_qa",
      "security_compliance",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for SaaS feature build",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for SaaS feature build",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for SaaS feature build",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for SaaS feature build",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for SaaS feature build",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for SaaS feature build",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for SaaS feature build",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for SaaS feature build",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for SaaS feature build",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for SaaS feature build",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for SaaS feature build",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for SaaS feature build",
        "default_skill": "senior_software_engineer",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for SaaS feature build",
        "default_skill": "senior_qa",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for SaaS feature build",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for SaaS feature build",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for SaaS feature build",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for SaaS feature build",
        "default_skill": "senior_software_engineer",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for SaaS feature build",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for SaaS feature build",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for SaaS feature build",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "shipit_readiness",
    "objective": "Prepare local ShipIt readiness map and stop before deploy/main/live/production gates.",
    "default_skill_team": [
      "release_shipit_manager",
      "senior_devops",
      "senior_qa",
      "security_compliance",
      "board_strategy_council",
      "evidence_audit_clerk"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for ShipIt readiness",
        "default_skill": "release_shipit_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for ShipIt readiness",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for ShipIt readiness",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for ShipIt readiness",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for ShipIt readiness",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for ShipIt readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for ShipIt readiness",
        "default_skill": "release_shipit_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for ShipIt readiness",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for ShipIt readiness",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for ShipIt readiness",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for ShipIt readiness",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for ShipIt readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for ShipIt readiness",
        "default_skill": "release_shipit_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for ShipIt readiness",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for ShipIt readiness",
        "default_skill": "senior_qa",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for ShipIt readiness",
        "default_skill": "security_compliance",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for ShipIt readiness",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for ShipIt readiness",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for ShipIt readiness",
        "default_skill": "release_shipit_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for ShipIt readiness",
        "default_skill": "senior_devops",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "board_decision_packet",
    "objective": "Create options, risks, authority model, evidence and exact next Board decision.",
    "default_skill_team": [
      "board_strategy_council",
      "senior_project_manager",
      "evidence_audit_clerk",
      "dashboard_analyst"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Board decision packet",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Board decision packet",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Board decision packet",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Board decision packet",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Board decision packet",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Board decision packet",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Board decision packet",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Board decision packet",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Board decision packet",
        "default_skill": "board_strategy_council",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Board decision packet",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Board decision packet",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Board decision packet",
        "default_skill": "dashboard_analyst",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Board decision packet",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Board decision packet",
        "default_skill": "senior_project_manager",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Board decision packet",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Board decision packet",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Board decision packet",
        "default_skill": "board_strategy_council",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Board decision packet",
        "default_skill": "senior_project_manager",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Board decision packet",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Board decision packet",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  },
  {
    "template_id": "evidence_audit",
    "objective": "Verify evidence/audit/dashboard completeness and refusal boundaries.",
    "default_skill_team": [
      "evidence_audit_clerk",
      "dashboard_analyst",
      "security_compliance"
    ],
    "default_lanes": [
      "hermes_local",
      "agentic_nexus_skill_exec",
      "openai_codex_max"
    ],
    "first20_actions": [
      {
        "sequence": 1,
        "title": "Analyse objective and current state for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 2,
        "title": "Load relevant registry and prior artifacts for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 3,
        "title": "Identify business outcome and owner for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 4,
        "title": "Map stop gates and prohibited actions for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 5,
        "title": "Select senior skill team for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 6,
        "title": "Select local operator lanes for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 7,
        "title": "Generate sandbox job candidates for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 8,
        "title": "Define evidence outputs for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 9,
        "title": "Define validation commands for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 10,
        "title": "Create first artifact draft for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 11,
        "title": "Create review checklist for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 12,
        "title": "Run local static validation for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 13,
        "title": "Update audit record for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 14,
        "title": "Update evidence ledger for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 15,
        "title": "Regenerate dashboard/status for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 16,
        "title": "Review hard-gate compliance for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 17,
        "title": "Prepare Board summary for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 18,
        "title": "Rank safe next mission for Evidence audit",
        "default_skill": "security_compliance",
        "default_lane": "agentic_nexus_skill_exec",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 19,
        "title": "Write final results for Evidence audit",
        "default_skill": "evidence_audit_clerk",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      },
      {
        "sequence": 20,
        "title": "Stop at true authority gate for Evidence audit",
        "default_skill": "dashboard_analyst",
        "default_lane": "hermes_local",
        "status": "sandbox_job_candidate",
        "allowed_commands": [
          "read_file",
          "search_files",
          "terminal:npm test/type-check/lint only",
          "write_file",
          "patch",
          "python3 local stdlib scripts"
        ],
        "prohibited_actions": [
          "op_1password",
          "supabase",
          "psql",
          "production_db",
          "deployment",
          "external_execution",
          "api_key_mode",
          "browser_automation",
          "computer_use",
          "email",
          "stripe_payments",
          "claims_orders",
          "public_publishing",
          "secrets"
        ]
      }
    ],
    "allowed_commands": [
      "read_file",
      "search_files",
      "write_file",
      "patch",
      "terminal:npm run type-check",
      "terminal:npm run lint",
      "terminal:npm run test",
      "python3 generate_dashboard_status_feed.py"
    ],
    "evidence_outputs": [
      "results_md",
      "evidence_ledger_jsonl",
      "audit_jsonl",
      "dashboard_status_json",
      "validation_output"
    ],
    "stop_gates": [
      "production_db",
      "deployment",
      "live_runner",
      "external_execution",
      "api_key_mode",
      "op_1password",
      "secrets",
      "browser_automation",
      "computer_use",
      "email",
      "stripe_payments",
      "claims_orders",
      "public_publishing",
      "merge_to_main_live"
    ]
  }
] as const

const HARD_GATE_KEYWORDS: Array<[string, string]> = [
  ['production database', 'production_db'],
  ['production db', 'production_db'],
  ['prod db', 'production_db'],
  ['migration apply', 'production_db'],
  ['deploy', 'deployment'],
  ['launch live runner', 'live_runner'],
  ['live runner', 'live_runner'],
  ['external execution', 'external_execution'],
  ['api key', 'api_key_mode'],
  ['1password', 'op_1password'],
  ['op auth', 'op_1password'],
  ['psql', 'production_db'],
  ['supabase', 'production_db'],
]

function normaliseSkill(raw: (typeof RAW_SKILLS)[number]): SpecializedSkillRecord {
  return {
    skillId: raw.skill_id,
    name: raw.name,
    domain: raw.domain,
    seniority: raw.seniority,
    description: raw.description,
    allowedTaskTypes: [...raw.allowed_task_types],
    prohibitedTaskTypes: [...raw.prohibited_task_types],
    defaultOperatorLane: raw.default_operator_lane,
    fallbackLane: raw.fallback_lane,
    evidenceRequired: [...raw.evidence_required],
    dashboardSurface: raw.dashboard_surface,
    requiresHumanApproval: raw.requires_human_approval,
    productionGateRequired: raw.production_gate_required,
    status: raw.status as SkillStatus,
  }
}

function normaliseTemplate(raw: (typeof RAW_TEMPLATES)[number]): BusinessMissionTemplate {
  return {
    templateId: raw.template_id,
    objective: raw.objective,
    defaultSkillTeam: [...raw.default_skill_team],
    defaultLanes: [...raw.default_lanes],
    first20Actions: raw.first20_actions.map((action) => ({
      sequence: action.sequence,
      title: action.title,
      defaultSkill: action.default_skill,
      defaultLane: action.default_lane,
      status: action.status as 'sandbox_job_candidate',
      allowedCommands: [...action.allowed_commands],
      prohibitedActions: [...action.prohibited_actions],
    })),
    allowedCommands: [...raw.allowed_commands],
    evidenceOutputs: [...raw.evidence_outputs],
    stopGates: [...raw.stop_gates],
  }
}

export function getSpecializedSkillRegistry(): SpecializedSkillRecord[] {
  return RAW_SKILLS.map(normaliseSkill)
}

export function getBusinessMissionTemplates(): BusinessMissionTemplate[] {
  return RAW_TEMPLATES.map(normaliseTemplate)
}

function selectTemplateId(objective: string): string {
  const text = objective.toLowerCase()
  if (text.includes('restoreassist')) return 'restoreassist_feature_readiness'
  if (text.includes('carsi') || text.includes('course')) return 'carsi_course_product_launch'
  if (text.includes('disaster') || text.includes('nrpg')) return 'disaster_recovery_content_seo_campaign'
  if (text.includes('seo') || text.includes('aeo') || text.includes('geo')) return 'seo_aeo_geo_research_sprint'
  if (text.includes('shipit') || text.includes('release')) return 'shipit_readiness'
  if (text.includes('audit') || text.includes('evidence')) return 'evidence_audit'
  if (text.includes('daily')) return 'daily_ops_business_review'
  if (text.includes('health')) return 'project_health_check'
  if (text.includes('content') || text.includes('social')) return 'social_content_campaign'
  if (text.includes('saas') || text.includes('feature')) return 'saas_feature_build'
  if (text.includes('crm')) return 'unite_group_crm_improvement'
  return 'board_decision_packet'
}

export function generateMissionActions(templateId: string): MissionAction[] {
  const template = getBusinessMissionTemplates().find((candidate) => candidate.templateId === templateId)
  return template ? template.first20Actions : []
}

function detectHardGates(objective: string): string[] {
  const text = objective.toLowerCase()
  const gates = new Set<string>()
  for (const [needle, gate] of HARD_GATE_KEYWORDS) {
    if (text.includes(needle)) gates.add(gate)
  }
  return [...gates]
}

export function routeBusinessMission(objective: string): MissionRouteResult {
  const hardGates = detectHardGates(objective)
  if (hardGates.length > 0) {
    return {
      ok: false,
      status: 'blocked_hard_gate',
      selectedTemplateId: null,
      selectedSkillTeam: [],
      operatorLanes: [],
      actions: [],
      hardGates,
      evidenceOutputs: ['blocked_gate_audit', 'board_decision_packet'],
      externalExecutionEnabled: false,
      apiKeyMode: false,
      productionDbTouched: false,
      dashboardSurface: 'specialized_skill_mesh',
      nextBoardGate: `approve_or_refuse_${hardGates.join('_')}`,
    }
  }

  const selectedTemplateId = selectTemplateId(objective)
  const template = getBusinessMissionTemplates().find((candidate) => candidate.templateId === selectedTemplateId)!
  return {
    ok: true,
    status: 'routed',
    selectedTemplateId,
    selectedSkillTeam: template.defaultSkillTeam,
    operatorLanes: template.defaultLanes,
    actions: template.first20Actions,
    hardGates: template.stopGates,
    evidenceOutputs: template.evidenceOutputs,
    externalExecutionEnabled: false,
    apiKeyMode: false,
    productionDbTouched: false,
    dashboardSurface: 'specialized_skill_mesh',
    nextBoardGate: 'approve_external_execution_or_continue_local_only',
  }
}

export function getSpecializedSkillMeshStatus() {
  const skills = getSpecializedSkillRegistry()
  const templates = getBusinessMissionTemplates()
  const lanes = getOperatorLanes()
  return {
    source: 'static_local_registry' as const,
    surface: 'specialized_skill_mesh' as const,
    specializedSkillCount: skills.length,
    businessMissionTemplateCount: templates.length,
    activeLanes: lanes.filter((lane) => lane.status === 'active').map((lane) => lane.laneId),
    pendingLanes: lanes.filter((lane) => lane.status !== 'active').map((lane) => lane.laneId),
    blockedLanes: ['sandbox_voice_migration_blocked_op'],
    hardGates: ['production_db', 'deployment', 'live_runner', 'external_execution', 'api_key_mode', 'op_1password', 'supabase', 'psql', 'secrets', 'browser_automation', 'computer_use', 'email', 'stripe_payments', 'claims_orders', 'public_publishing'],
    nextAutonomousMissionOption: 'run_specialized_skill_mesh_real_local_mission_dry_run',
    externalExecutionEnabled: false as const,
    apiKeyMode: false as const,
    productionDbTouched: false as const,
  }
}
