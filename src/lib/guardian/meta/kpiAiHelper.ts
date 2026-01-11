import Anthropic from '@anthropic-ai/sdk';

/**
 * Guardian Z08: KPI AI Helper
 *
 * Generates AI-powered goal and KPI suggestions based on Z-series context.
 * Uses Claude Sonnet 4.5 for fast, advisory-only generation.
 *
 * Pattern: Follow successNarrativeAiHelper.ts (flag-gated, graceful degradation)
 */

export interface GuardianGoalAiContext {
  readinessSummary: { score: number; trend: 'up' | 'down' | 'flat' };
  editionSummary: Array<{ key: string; fitScore: number; status: string }>;
  adoptionSummary: Array<{ dimension: string; status: string }>;
  upliftSummary: { activePlans: number; tasksDone: number; tasksTotal: number };
  executiveSummary: { reportsLast90d: number };
  timeframeLabel: string;
}

export interface GoalAiSuggestion {
  goal_key: string;
  title: string;
  description: string;
  category: string;
  suggested_okrs: Array<{
    objective_key: string;
    objective: string;
  }>;
  suggested_kpis: Array<{
    okr_objective_key: string;
    kpi_key: string;
    label: string;
    description: string;
    target_value: number;
    target_direction: 'increase' | 'decrease' | 'maintain';
    unit: string;
    source_metric: string;
    source_path: { domain: string; metric: string; [key: string]: unknown };
  }>;
}

export interface GoalAiSuggestions {
  goals: GoalAiSuggestion[];
}

/**
 * Get lazy Anthropic client (60-second TTL)
 */
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    anthropicClient = new Anthropic({ apiKey });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Generate goal and KPI suggestions from Z-series context
 *
 * Uses Claude Sonnet to create 2-3 advisory goals with OKRs and KPIs
 * mapped to Z-series metrics (readiness, adoption, uplift, editions, executive, lifecycle).
 */
export async function generateGoalAndKpiSuggestions(ctx: GuardianGoalAiContext): Promise<GoalAiSuggestions> {
  const client = getAnthropicClient();

  const prompt = `You are a Guardian program management advisor. Based on the following Guardian health metrics, generate 2-3 realistic program goals with OKRs and KPIs.

**Current Guardian Health Context**:
- Readiness Score: ${ctx.readinessSummary.score}/100 (trend: ${ctx.readinessSummary.trend})
- Editions: ${ctx.editionSummary.length} editions available
  ${ctx.editionSummary.map((e) => `  • ${e.key}: ${e.fitScore}/100 fit (${e.status})`).join('\n')}
- Adoption Dimensions: ${ctx.adoptionSummary.length} dimensions tracked
  ${ctx.adoptionSummary.map((a) => `  • ${a.dimension}: ${a.status}`).join('\n')}
- Uplift: ${ctx.upliftSummary.activePlans} active plans, ${ctx.upliftSummary.tasksDone}/${ctx.upliftSummary.tasksTotal} tasks completed
- Executive Reports: ${ctx.executiveSummary.reportsLast90d} reports in last 90 days
- Planning Horizon: ${ctx.timeframeLabel}

**Your Task**: Generate 2-3 strategic program goals with measurable OKRs and KPIs.

**Critical Guidelines**:
1. Only suggest goals that can be measured via existing Z-series metrics (readiness, adoption, uplift, edition fit, executive reports, lifecycle)
2. Use realistic, conservative targets (e.g., "increase readiness from ${ctx.readinessSummary.score} to ${Math.min(ctx.readinessSummary.score + 15, 100)}")
3. Map each KPI to a specific Z-series domain and metric path
4. These are ADVISORY ONLY: starting points for discussion, not mandates
5. Provide exactly this JSON structure with no additional text

**Output Format** (valid JSON only):
{
  "goals": [
    {
      "goal_key": "unique_lowercase_identifier",
      "title": "Goal Title",
      "description": "2-3 sentence description",
      "category": "governance|security_posture|operations|compliance|adoption",
      "suggested_okrs": [
        {
          "objective_key": "unique_okr_key",
          "objective": "Measurable outcome statement"
        }
      ],
      "suggested_kpis": [
        {
          "okr_objective_key": "links_to_okr_key",
          "kpi_key": "unique_kpi_key",
          "label": "KPI Display Name",
          "description": "What this KPI measures",
          "target_value": 75,
          "target_direction": "increase|decrease|maintain",
          "unit": "score|count|ratio|percentage|tasks|reports",
          "source_metric": "metric_identifier",
          "source_path": {
            "domain": "readiness|editions|uplift|adoption|executive|lifecycle",
            "metric": "metric_name"
          }
        }
      ]
    }
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract JSON from response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Invalid AI response: Could not extract JSON from Claude response');
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as GoalAiSuggestions;

    // Validate structure
    if (!result.goals || !Array.isArray(result.goals)) {
      throw new Error('Invalid response: goals array missing');
    }

    // Basic validation of goals structure
    result.goals.forEach((goal, idx) => {
      if (!goal.goal_key || !goal.title) {
        throw new Error(`Invalid goal at index ${idx}: missing goal_key or title`);
      }
      if (!goal.suggested_okrs || !Array.isArray(goal.suggested_okrs)) {
        throw new Error(`Invalid goal ${goal.goal_key}: suggested_okrs must be an array`);
      }
      if (!goal.suggested_kpis || !Array.isArray(goal.suggested_kpis)) {
        throw new Error(`Invalid goal ${goal.goal_key}: suggested_kpis must be an array`);
      }
    });

    return result;
  } catch (parseError) {
    throw new Error(`Failed to parse AI suggestions: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

/**
 * Validate goal/OKR/KPI suggestions before persistence
 *
 * Checks:
 * - KPI source paths are valid Z-series domains
 * - Target values are in realistic ranges
 * - References are internally consistent
 */
export function validateGoalSuggestions(suggestions: GoalAiSuggestions): string[] {
  const errors: string[] = [];

  const validDomains = ['readiness', 'editions', 'uplift', 'adoption', 'executive', 'lifecycle'];
  const validDirections = ['increase', 'decrease', 'maintain'];
  const validUnits = ['score', 'count', 'ratio', 'percentage', 'tasks', 'reports'];

  suggestions.goals.forEach((goal, goalIdx) => {
    // Validate goal
    if (!goal.goal_key.match(/^[a-z0-9_]+$/)) {
      errors.push(`Goal ${goalIdx}: goal_key must be lowercase alphanumeric with underscores`);
    }

    // Validate OKRs
    const okrKeys = new Set<string>();
    goal.suggested_okrs.forEach((okr, okrIdx) => {
      if (!okr.objective_key.match(/^[a-z0-9_]+$/)) {
        errors.push(`Goal ${goalIdx} OKR ${okrIdx}: objective_key must be lowercase alphanumeric with underscores`);
      }
      okrKeys.add(okr.objective_key);
    });

    // Validate KPIs
    goal.suggested_kpis.forEach((kpi, kpiIdx) => {
      if (!validDomains.includes(kpi.source_path.domain)) {
        errors.push(
          `Goal ${goalIdx} KPI ${kpiIdx}: invalid domain '${kpi.source_path.domain}'. Must be one of: ${validDomains.join(', ')}`
        );
      }

      if (!validDirections.includes(kpi.target_direction)) {
        errors.push(
          `Goal ${goalIdx} KPI ${kpiIdx}: invalid target_direction '${kpi.target_direction}'. Must be one of: ${validDirections.join(', ')}`
        );
      }

      if (!validUnits.includes(kpi.unit)) {
        errors.push(
          `Goal ${goalIdx} KPI ${kpiIdx}: invalid unit '${kpi.unit}'. Must be one of: ${validUnits.join(', ')}`
        );
      }

      if (kpi.target_value < 0 || kpi.target_value > 10000) {
        errors.push(`Goal ${goalIdx} KPI ${kpiIdx}: target_value must be between 0 and 10000, got ${kpi.target_value}`);
      }

      if (!okrKeys.has(kpi.okr_objective_key)) {
        errors.push(
          `Goal ${goalIdx} KPI ${kpiIdx}: references unknown OKR key '${kpi.okr_objective_key}'`
        );
      }
    });
  });

  return errors;
}
