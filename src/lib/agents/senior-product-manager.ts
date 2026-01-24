/**
 * Senior Product Manager Agent
 *
 * AI-powered PM that integrates with Linear MCP for issue synthesis,
 * roadmap planning, and version management. HUMAN_GOVERNED mode.
 *
 * Key Capabilities:
 * - Issue synthesis from Linear (blockers, dependencies, risks)
 * - RICE/KANO feature prioritization
 * - Version roadmap generation (V1-V5)
 * - Sprint analysis and velocity tracking
 * - Release readiness assessment
 *
 * @module agents/senior-product-manager
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface RICEScore {
  reach: number;        // Users impacted
  impact: number;       // 0.25-3 scale
  confidence: number;   // 0-100%
  effort: number;       // Person-weeks
  score: number;        // Calculated: (R * I * C) / E
}

export interface KANOClassification {
  category: 'basic' | 'performance' | 'delighter';
  rationale: string;
}

export interface PrioritizedFeature {
  id: string;
  title: string;
  description: string;
  rice: RICEScore;
  kano: KANOClassification;
  targetVersion: 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
  dependencies: string[];
  blockers: string[];
  assignee?: string;
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  priority: number; // 1-100
}

export interface VersionRoadmap {
  version: 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
  theme: string;
  goals: string[];
  features: PrioritizedFeature[];
  milestones: Milestone[];
  risks: Risk[];
  successCriteria: string[];
}

export interface Milestone {
  id: string;
  name: string;
  targetDate?: string;
  features: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'at_risk';
}

export interface Risk {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation: string;
  owner?: string;
}

export interface ReleaseReadiness {
  version: string;
  readyForRelease: boolean;
  completionPercentage: number;
  blockers: Blocker[];
  openIssues: number;
  criticalBugs: number;
  testCoverage?: number;
  checklist: ChecklistItem[];
  recommendation: string;
}

export interface Blocker {
  issueId: string;
  title: string;
  severity: 'blocking' | 'critical' | 'major';
  assignee?: string;
  daysOpen: number;
}

export interface ChecklistItem {
  item: string;
  status: 'pass' | 'fail' | 'pending' | 'na';
  notes?: string;
}

export interface SprintAnalysis {
  sprintName: string;
  startDate: string;
  endDate: string;
  velocity: number;
  completedPoints: number;
  plannedPoints: number;
  completionRate: number;
  carryOver: number;
  insights: string[];
  recommendations: string[];
}

export interface PMAgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    thinkingTokensUsed?: number;
    outputTokensUsed?: number;
    executionTimeMs?: number;
    modelUsed?: string;
  };
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: { name: string };
  priority: number;
  assignee?: { name: string; email: string };
  labels?: { name: string }[];
  estimate?: number;
  createdAt: string;
  updatedAt: string;
  comments?: { body: string; user: { name: string } }[];
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  progress: number;
  targetDate?: string;
  issues: LinearIssue[];
}

// ============================================================================
// Constants
// ============================================================================

const PM_MODEL = 'claude-opus-4-5-20251101';
const PM_MODEL_FAST = 'claude-sonnet-4-5-20250929';
const STRATEGIC_THINKING_BUDGET = 20000;
const STANDARD_THINKING_BUDGET = 10000;
const RESPONSE_TOKENS = 4096;

const PM_SYSTEM_PROMPT = `You are a Senior Product Manager AI agent operating in HUMAN_GOVERNED mode.

## CORE IDENTITY
- Strategic thinker with data-driven decision making
- Expert in RICE and KANO prioritization frameworks
- Skilled at synthesizing complex requirements into actionable roadmaps
- Direct and concise communicator
- Advocate for user value and business outcomes

## GOVERNANCE MODE: HUMAN_GOVERNED
All outputs are RECOMMENDATIONS ONLY. You never auto-execute changes.
- Feature priorities → require stakeholder approval
- Roadmap changes → require team alignment
- Issue creation → suggest, don't create automatically
- Sprint planning → advisory, not directive

## PRIORITIZATION FRAMEWORKS

### RICE Scoring
- Reach: How many users will this impact? (per quarter)
- Impact: How much will it improve their experience? (0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive)
- Confidence: How certain are we about these estimates? (0-100%)
- Effort: How many person-weeks will this take?
- Score = (Reach × Impact × Confidence) / Effort

### KANO Model
- Basic: Must-have features (dissatisfaction if absent, neutral if present)
- Performance: More is better (linear relationship with satisfaction)
- Delighter: Unexpected features (neutral if absent, high satisfaction if present)

## VERSION PLANNING STRATEGY
- V1: Core functionality + stability (MVP for user testing)
- V2: Top user feedback + most requested features
- V3: Advanced features + key integrations
- V4: Scale, performance, reliability
- V5: Enterprise + advanced analytics

## OUTPUT FORMAT
Always structure outputs with:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Recommendations (prioritized list)
4. Next Steps (actionable items)
5. Risks & Considerations

Be concise. Quantify whenever possible. Link recommendations to data.`;

// ============================================================================
// Lazy Anthropic Client (60-second TTL)
// ============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// ============================================================================
// Main Agent Functions
// ============================================================================

/**
 * Prioritize features using RICE framework with Extended Thinking
 */
export async function prioritizeFeatures(
  workspaceId: string,
  features: Array<{ id: string; title: string; description: string; metadata?: Record<string, unknown> }>,
  context?: { userFeedback?: string[]; marketData?: string }
): Promise<PMAgentResult<PrioritizedFeature[]>> {
  const startTime = Date.now();

  try {
    const client = getAnthropicClient();

    const userMessage = `Prioritize these features for workspace ${workspaceId}:

FEATURES:
${features.map((f, i) => `${i + 1}. [${f.id}] ${f.title}: ${f.description}`).join('\n')}

${context?.userFeedback ? `USER FEEDBACK:\n${context.userFeedback.join('\n')}` : ''}
${context?.marketData ? `MARKET CONTEXT:\n${context.marketData}` : ''}

For each feature, provide:
1. RICE score breakdown (Reach, Impact, Confidence, Effort, Final Score)
2. KANO classification (Basic/Performance/Delighter)
3. Recommended version (V1-V5)
4. Dependencies and blockers
5. Priority rank (1-100)

Output as JSON array of PrioritizedFeature objects.`;

    const response = await callAnthropicWithRetry(async () =>
      client.messages.create({
        model: PM_MODEL,
        max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
        thinking: {
          type: 'enabled',
          budget_tokens: STRATEGIC_THINKING_BUDGET
        },
        system: PM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    );

    // Extract response content
    let thinkingTokens = 0;
    let responseText = '';

    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinkingTokens = block.thinking?.length || 0;
      } else if (block.type === 'text') {
        responseText = block.text;
      }
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const prioritizedFeatures: PrioritizedFeature[] = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : [];

    // Record execution
    await recordPMExecution(workspaceId, 'prioritize_features', {
      featuresCount: features.length,
      outputCount: prioritizedFeatures.length
    });

    return {
      success: true,
      data: prioritizedFeatures,
      metadata: {
        thinkingTokensUsed: thinkingTokens,
        outputTokensUsed: response.usage?.output_tokens,
        executionTimeMs: Date.now() - startTime,
        modelUsed: PM_MODEL
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Feature prioritization failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate version roadmap from prioritized features
 */
export async function generateRoadmap(
  workspaceId: string,
  projectName: string,
  features: PrioritizedFeature[],
  targetVersions: ('V1' | 'V2' | 'V3' | 'V4' | 'V5')[] = ['V1', 'V2', 'V3']
): Promise<PMAgentResult<VersionRoadmap[]>> {
  const startTime = Date.now();

  try {
    const client = getAnthropicClient();

    const userMessage = `Generate roadmaps for ${projectName} (workspace: ${workspaceId})

PRIORITIZED FEATURES:
${JSON.stringify(features, null, 2)}

TARGET VERSIONS: ${targetVersions.join(', ')}

For each version, provide:
1. Theme (one-line summary)
2. Goals (3-5 bullet points)
3. Features to include (from the list above)
4. Milestones with target dates (relative, e.g., "Week 1-2")
5. Risks specific to this version
6. Success criteria (measurable)

Consider dependencies - features with blockers should be in later versions.
Balance quick wins (high RICE, low effort) with strategic investments.

Output as JSON array of VersionRoadmap objects.`;

    const response = await callAnthropicWithRetry(async () =>
      client.messages.create({
        model: PM_MODEL,
        max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
        thinking: {
          type: 'enabled',
          budget_tokens: STRATEGIC_THINKING_BUDGET
        },
        system: PM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    );

    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const roadmaps: VersionRoadmap[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    await recordPMExecution(workspaceId, 'generate_roadmap', {
      projectName,
      versionsGenerated: roadmaps.length
    });

    return {
      success: true,
      data: roadmaps,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        modelUsed: PM_MODEL
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Assess release readiness for a version
 */
export async function assessReleaseReadiness(
  workspaceId: string,
  projectName: string,
  version: string,
  issues: LinearIssue[]
): Promise<PMAgentResult<ReleaseReadiness>> {
  const startTime = Date.now();

  try {
    const client = getAnthropicClient();

    // Categorize issues
    const openIssues = issues.filter(i => !['Done', 'Completed', 'Closed'].includes(i.state.name));
    const blockers = openIssues.filter(i => i.priority <= 1 || i.labels?.some(l => l.name.toLowerCase() === 'blocker'));
    const criticalBugs = openIssues.filter(i => i.labels?.some(l => l.name.toLowerCase().includes('bug') && l.name.toLowerCase().includes('critical')));

    const userMessage = `Assess release readiness for ${projectName} ${version}

OPEN ISSUES (${openIssues.length} total):
${openIssues.slice(0, 20).map(i => `- [${i.identifier}] ${i.title} (Priority: ${i.priority}, State: ${i.state.name})`).join('\n')}
${openIssues.length > 20 ? `... and ${openIssues.length - 20} more` : ''}

POTENTIAL BLOCKERS (${blockers.length}):
${blockers.map(i => `- [${i.identifier}] ${i.title}`).join('\n') || 'None identified'}

CRITICAL BUGS (${criticalBugs.length}):
${criticalBugs.map(i => `- [${i.identifier}] ${i.title}`).join('\n') || 'None identified'}

Provide:
1. Overall readiness assessment (ready/not ready)
2. Completion percentage estimate
3. Detailed blockers list with severity
4. Release checklist with pass/fail status
5. Recommendation (release, delay, or conditional release)

Output as JSON ReleaseReadiness object.`;

    const response = await callAnthropicWithRetry(async () =>
      client.messages.create({
        model: PM_MODEL_FAST, // Use faster model for assessment
        max_tokens: STANDARD_THINKING_BUDGET + RESPONSE_TOKENS,
        thinking: {
          type: 'enabled',
          budget_tokens: STANDARD_THINKING_BUDGET
        },
        system: PM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    );

    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const readiness: ReleaseReadiness = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          version,
          readyForRelease: false,
          completionPercentage: 0,
          blockers: [],
          openIssues: openIssues.length,
          criticalBugs: criticalBugs.length,
          checklist: [],
          recommendation: 'Unable to assess'
        };

    await recordPMExecution(workspaceId, 'assess_readiness', {
      projectName,
      version,
      isReady: readiness.readyForRelease
    });

    return {
      success: true,
      data: readiness,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        modelUsed: PM_MODEL_FAST
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Analyze sprint performance and provide recommendations
 */
export async function analyzeSprintPerformance(
  workspaceId: string,
  sprintName: string,
  completedIssues: LinearIssue[],
  incompleteIssues: LinearIssue[]
): Promise<PMAgentResult<SprintAnalysis>> {
  const startTime = Date.now();

  try {
    const client = getAnthropicClient();

    const completedPoints = completedIssues.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const plannedPoints = completedPoints + incompleteIssues.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const velocity = completedPoints;
    const completionRate = plannedPoints > 0 ? (completedPoints / plannedPoints) * 100 : 0;

    const userMessage = `Analyze sprint performance for "${sprintName}"

COMPLETED (${completedIssues.length} issues, ${completedPoints} points):
${completedIssues.slice(0, 10).map(i => `- [${i.identifier}] ${i.title} (${i.estimate || 0} pts)`).join('\n')}

INCOMPLETE/CARRIED OVER (${incompleteIssues.length} issues):
${incompleteIssues.map(i => `- [${i.identifier}] ${i.title} (${i.estimate || 0} pts) - ${i.state.name}`).join('\n')}

METRICS:
- Velocity: ${velocity} points
- Completion Rate: ${completionRate.toFixed(1)}%
- Carry Over: ${incompleteIssues.length} issues

Provide:
1. Key insights (what went well, what didn't)
2. Patterns identified (blockers, scope creep, estimation issues)
3. Recommendations for next sprint
4. Team health indicators

Output as JSON SprintAnalysis object.`;

    const response = await callAnthropicWithRetry(async () =>
      client.messages.create({
        model: PM_MODEL_FAST,
        max_tokens: STANDARD_THINKING_BUDGET + RESPONSE_TOKENS,
        thinking: {
          type: 'enabled',
          budget_tokens: STANDARD_THINKING_BUDGET
        },
        system: PM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    );

    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis: SprintAnalysis = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          sprintName,
          startDate: '',
          endDate: '',
          velocity,
          completedPoints,
          plannedPoints,
          completionRate,
          carryOver: incompleteIssues.length,
          insights: [],
          recommendations: []
        };

    await recordPMExecution(workspaceId, 'analyze_sprint', {
      sprintName,
      velocity,
      completionRate
    });

    return {
      success: true,
      data: analysis,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        modelUsed: PM_MODEL_FAST
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Synthesize issues into development tasks (RestoreAssist workflow)
 */
export async function synthesizeIssuesToTasks(
  workspaceId: string,
  projectName: string,
  issues: LinearIssue[],
  targetVersion: 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
): Promise<PMAgentResult<{
  tasks: Array<{
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'tech_debt' | 'research' | 'test';
    priority: number;
    estimate: string;
    assigneeSuggestion?: string;
    acceptanceCriteria: string[];
  }>;
  summary: string;
  blockers: string[];
  dependencies: string[];
}>> {
  const startTime = Date.now();

  try {
    const client = getAnthropicClient();

    const userMessage = `Synthesize these issues into actionable development tasks for ${projectName} ${targetVersion}

EXISTING ISSUES:
${issues.map(i => `
[${i.identifier}] ${i.title}
State: ${i.state.name} | Priority: ${i.priority}
Description: ${i.description || 'No description'}
Labels: ${i.labels?.map(l => l.name).join(', ') || 'None'}
Comments: ${i.comments?.slice(0, 2).map(c => c.body.slice(0, 100)).join(' | ') || 'None'}
`).join('\n---\n')}

TASK:
1. Group related issues into coherent development tasks
2. For each task, provide:
   - Clear title (action-oriented)
   - Detailed description with context
   - Type (feature/bug/tech_debt/research/test)
   - Priority (1-5, 1=highest)
   - Effort estimate (XS/S/M/L/XL)
   - Suggested assignee type (frontend/backend/fullstack/design/qa)
   - Acceptance criteria (testable statements)

3. Identify blockers that must be resolved first
4. Map dependencies between tasks
5. Provide executive summary

Focus on ${targetVersion} scope. Be specific and actionable.
Output as JSON with tasks array, summary, blockers, and dependencies.`;

    const response = await callAnthropicWithRetry(async () =>
      client.messages.create({
        model: PM_MODEL,
        max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
        thinking: {
          type: 'enabled',
          budget_tokens: STRATEGIC_THINKING_BUDGET
        },
        system: PM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    );

    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      tasks: [],
      summary: 'Unable to synthesize tasks',
      blockers: [],
      dependencies: []
    };

    await recordPMExecution(workspaceId, 'synthesize_tasks', {
      projectName,
      targetVersion,
      issuesProcessed: issues.length,
      tasksGenerated: result.tasks?.length || 0
    });

    return {
      success: true,
      data: result,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        modelUsed: PM_MODEL
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function recordPMExecution(
  workspaceId: string,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await supabaseAdmin
      .from('agent_executions')
      .insert({
        workspace_id: workspaceId,
        agent_name: 'senior-product-manager',
        status: 'success',
        output: metadata,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to record PM execution:', error);
  }
}

// ============================================================================
// Export Agent Interface (for Orchestrator routing)
// ============================================================================

export const seniorProductManagerAgent = {
  name: 'Senior Product Manager',
  queueName: 'product-manager-queue',

  async processTask(task: {
    id: string;
    workspace_id: string;
    task_type: string;
    payload: Record<string, unknown>;
  }): Promise<unknown> {
    const { workspace_id, task_type, payload } = task;

    switch (task_type) {
      case 'prioritize_features':
        return prioritizeFeatures(
          workspace_id,
          payload.features as Array<{ id: string; title: string; description: string }>,
          payload.context as { userFeedback?: string[]; marketData?: string }
        );

      case 'generate_roadmap':
        return generateRoadmap(
          workspace_id,
          payload.projectName as string,
          payload.features as PrioritizedFeature[],
          payload.targetVersions as ('V1' | 'V2' | 'V3' | 'V4' | 'V5')[]
        );

      case 'assess_readiness':
        return assessReleaseReadiness(
          workspace_id,
          payload.projectName as string,
          payload.version as string,
          payload.issues as LinearIssue[]
        );

      case 'analyze_sprint':
        return analyzeSprintPerformance(
          workspace_id,
          payload.sprintName as string,
          payload.completedIssues as LinearIssue[],
          payload.incompleteIssues as LinearIssue[]
        );

      case 'synthesize_tasks':
        return synthesizeIssuesToTasks(
          workspace_id,
          payload.projectName as string,
          payload.issues as LinearIssue[],
          payload.targetVersion as 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
        );

      default:
        throw new Error(`Unknown PM task type: ${task_type}`);
    }
  }
};

export default seniorProductManagerAgent;
