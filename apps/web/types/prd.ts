/**
 * Type definitions for PRD (Product Requirements Document) system
 * Eliminates 'any' types throughout the codebase
 */

// ============================================================================
// PRD Analysis Types
// ============================================================================

export interface PRDAnalysis {
  executive_summary: string;
  problem_statement: string;
  target_users: string[];
  success_metrics: string[];
  functional_requirements: string[];
  non_functional_requirements: string[];
  constraints: string[];
  assumptions: string[];
  out_of_scope: string[];
  generated_at: string;
  model_used: string;
}

// ============================================================================
// Feature Decomposition Types
// ============================================================================

export interface Epic {
  id: string;
  name: string;
  description: string;
  user_stories: string[]; // Array of UserStory IDs
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  business_value: string;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  epic: string; // Epic ID or name
  dependencies: string[]; // Array of UserStory IDs
  effort_estimate?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  technical_notes?: string[];
}

export interface FeatureDecomposition {
  epics: Epic[];
  user_stories: UserStory[];
  total_effort_estimate: string;
  critical_path: string[]; // Array of UserStory IDs
  generated_at: string;
  model_used: string;
}

// ============================================================================
// Technical Specification Types
// ============================================================================

export interface DatabaseTable {
  name: string;
  description?: string;
  purpose: string;
  columns: DatabaseColumn[];
  relationships: DatabaseRelationship[];
  indexes?: string[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary_key?: boolean;
  foreign_key?: string;
  default?: string;
  description: string;
}

export interface DatabaseRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  from_table: string;
  to_table: string;
  from_column: string;
  to_column: string;
  description: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  authentication_required: boolean;
  request_body?: Record<string, unknown>;
  response: Record<string, unknown>;
  error_responses?: Record<string, string>;
}

export interface TechnicalArchitecture {
  frontend_stack: string[];
  backend_stack: string[];
  database: string;
  hosting: string;
  third_party_services: string[];
}

export interface TechnicalSpecification {
  architecture: TechnicalArchitecture;
  database_schema: DatabaseTable[];
  api_endpoints: APIEndpoint[];
  key_algorithms: string[];
  security_considerations: string[];
  performance_requirements: string[];
  generated_at: string;
  model_used: string;
}

// ============================================================================
// Test Plan Types
// ============================================================================

export interface TestCase {
  id: string;
  user_story_id: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  description: string;
  preconditions: string[];
  test_steps: string[];
  expected_results: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface TestPlan {
  test_cases: TestCase[];
  coverage_targets: {
    unit_tests: number;
    integration_tests: number;
    e2e_tests: number;
  };
  testing_tools: string[];
  ci_cd_integration: string;
  generated_at: string;
  model_used: string;
}

// ============================================================================
// Roadmap Types
// ============================================================================

export interface Sprint {
  sprint_number: number;
  duration_weeks: number;
  sprint_goal?: string;
  user_stories: string[]; // Array of UserStory IDs
  goals: string[];
  deliverables?: string[];
  dependencies: string[];
  risks: string[];
}

export interface Milestone {
  name: string;
  description?: string;
  target_date: string;
  target_sprint?: number;
  deliverables: string[];
  success_criteria: string[];
}

export interface Roadmap {
  sprints: Sprint[];
  milestones: Milestone[];
  total_duration_weeks: number;
  team_size_recommendation: number;
  critical_path_duration: number;
  risks_and_mitigation: string[];
  generated_at: string;
  model_used: string;
}

// ============================================================================
// Combined PRD Types
// ============================================================================

export interface CompletePRD {
  id: string;
  user_id: string;
  project_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  analysis?: PRDAnalysis;
  feature_decomposition?: FeatureDecomposition;
  technical_specification?: TechnicalSpecification;
  test_plan?: TestPlan;
  roadmap?: Roadmap;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================================================
// Agent Run Types
// ============================================================================

export type AgentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'escalated_to_human'
  | 'awaiting_verification'
  | 'verification_in_progress';

export interface AgentRun {
  id: string;
  task_id: string;
  user_id: string | null;
  agent_name: string;
  agent_id: string;
  status: AgentStatus;
  current_step?: string;
  progress_percent: number;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  verification_attempts?: number;
  verification_evidence?: Array<Record<string, unknown>>;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

// ============================================================================
// Form and UI Types
// ============================================================================

export interface PRDGenerationFormData {
  projectName: string;
  description: string;
  targetUsers?: string;
  timeline?: string;
  teamSize?: number;
  additionalContext?: string;
}

export interface PRDGenerationProgress {
  runId: string;
  status: AgentStatus;
  currentStep?: string;
  progress: number;
  error?: string;
}
