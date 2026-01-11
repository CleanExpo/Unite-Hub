import Anthropic from '@anthropic-ai/sdk';
import { GuardianUpliftTaskDraft } from './upliftPlaybookModel';

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

export interface EnrichedUpliftHints {
  steps: string[];
  success_criteria: string[];
  time_estimate_minutes: number;
  resources: string[];
  common_pitfalls: string[];
  validation_checklist: string[];
}

/**
 * Refine uplift task hints using Claude Sonnet
 * Generates actionable steps, success criteria, and checklists
 * Privacy-preserving: no PII, only generic instructions
 */
export async function enrichUpliftTaskHints(
  task: GuardianUpliftTaskDraft,
  tenantContext?: {
    currentScore?: number;
    targetScore?: number;
    category?: string;
  }
): Promise<EnrichedUpliftHints> {
  const client = getAnthropicClient();

  const prompt = `You are a Guardian adoption expert. Enrich the following uplift task with detailed, actionable guidance.

Task: ${task.title}
Description: ${task.description}
Category: ${task.category}
Priority: ${task.priority}
Effort: ${task.effortEstimate}
${tenantContext?.currentScore !== undefined ? `Current Score: ${tenantContext.currentScore}` : ''}
${tenantContext?.targetScore !== undefined ? `Target Score: ${tenantContext.targetScore}` : ''}

Generate a JSON response with:
- steps: Array of 3-6 concrete implementation steps (no PII, generic instructions)
- success_criteria: Array of 2-4 measurable success criteria (counts, flags, not sensitive data)
- time_estimate_minutes: Estimated time in minutes (be realistic)
- resources: Array of relevant documentation links, modules, or tools (generic, no URLs with IDs)
- common_pitfalls: Array of 2-3 common mistakes to avoid
- validation_checklist: Array of 3-5 verification steps

Respond ONLY with valid JSON, no markdown, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const hints = JSON.parse(responseText);

    // Validate structure
    if (
      !Array.isArray(hints.steps) ||
      !Array.isArray(hints.success_criteria) ||
      !Array.isArray(hints.resources) ||
      !Array.isArray(hints.common_pitfalls) ||
      !Array.isArray(hints.validation_checklist) ||
      typeof hints.time_estimate_minutes !== 'number'
    ) {
      throw new Error('Invalid hints structure');
    }

    return hints as EnrichedUpliftHints;
  } catch (error) {
    console.error('Failed to parse AI hints:', error);
    // Return default hints if parsing fails
    return {
      steps: ['Configure module', 'Enable feature', 'Validate setup'],
      success_criteria: ['Feature is enabled', 'No configuration errors'],
      time_estimate_minutes: 30,
      resources: ['Guardian documentation', 'Configuration guides'],
      common_pitfalls: ['Incomplete configuration', 'Missing prerequisites'],
      validation_checklist: ['Check logs', 'Verify settings', 'Test functionality'],
    };
  }
}

/**
 * Batch enrich multiple uplift tasks
 * Returns map of task ID -> enriched hints
 */
export async function enrichMultipleUpliftTasks(
  tasks: (GuardianUpliftTaskDraft & { id?: string })[],
  enableAiHints: boolean = false
): Promise<Map<string, EnrichedUpliftHints>> {
  const result = new Map<string, EnrichedUpliftHints>();

  if (!enableAiHints) {
    // Return basic hints without AI enrichment
    tasks.forEach((task) => {
      result.set(task.id || task.title, {
        steps: ['Configure', 'Enable', 'Validate'],
        success_criteria: ['Feature enabled'],
        time_estimate_minutes: 30,
        resources: ['Documentation'],
        common_pitfalls: ['Missing setup'],
        validation_checklist: ['Verify configuration'],
      });
    });
    return result;
  }

  // Enrich with AI (respect rate limits)
  for (const task of tasks) {
    try {
      const hints = await enrichUpliftTaskHints(task);
      result.set(task.id || task.title, hints);

      // Add small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to enrich task "${task.title}":`, error);
      // Use default hints on error
      result.set(task.id || task.title, {
        steps: ['Configure', 'Enable', 'Validate'],
        success_criteria: ['Feature enabled'],
        time_estimate_minutes: 30,
        resources: ['Documentation'],
        common_pitfalls: ['Missing setup'],
        validation_checklist: ['Verify configuration'],
      });
    }
  }

  return result;
}

/**
 * Generate a readable summary of enriched hints for display
 */
export function formatEnrichedHints(hints: EnrichedUpliftHints): string {
  const lines: string[] = [
    `⏱️ Estimated time: ${hints.time_estimate_minutes} minutes`,
    '',
    '📋 Steps:',
    ...hints.steps.map((step, i) => `  ${i + 1}. ${step}`),
    '',
    '✅ Success Criteria:',
    ...hints.success_criteria.map((criterion) => `  • ${criterion}`),
    '',
    '⚠️ Common Pitfalls:',
    ...hints.common_pitfalls.map((pitfall) => `  • ${pitfall}`),
    '',
    '📚 Resources:',
    ...hints.resources.map((resource) => `  • ${resource}`),
    '',
    '🔍 Validation Checklist:',
    ...hints.validation_checklist.map((item) => `  ☐ ${item}`),
  ];

  return lines.join('\n');
}
