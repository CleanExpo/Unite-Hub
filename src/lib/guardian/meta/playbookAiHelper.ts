import Anthropic from '@anthropic-ai/sdk';
import { GuardianPlaybookTagDomain } from './playbookMappingService';

// ===== TYPES =====

export interface GuardianPlaybookDraftContext {
  domain: GuardianPlaybookTagDomain;
  patternKey: string;
  patternLabel: string;
  metaSummary: {
    readinessScore?: number;
    adoptionStatus?: string;
    editionStatus?: string;
    upliftStatus?: string;
  };
  targetComplexity: 'intro' | 'medium' | 'advanced';
}

export interface GuardianPlaybookDraftSection {
  heading: string;
  body: string;
  section_type: 'guide' | 'checklist' | 'scenario' | 'faq' | 'reference';
}

export interface GuardianPlaybookDraft {
  title: string;
  summary: string;
  sections: GuardianPlaybookDraftSection[];
}

// ===== ANTHROPIC CLIENT MANAGEMENT =====

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

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

// ===== DRAFT GENERATION =====

/**
 * Generate playbook draft using Claude Sonnet
 * Flag-gated: Only call if AI playbook drafting is enabled
 */
export async function generatePlaybookDraft(
  ctx: GuardianPlaybookDraftContext
): Promise<GuardianPlaybookDraft> {
  const client = getAnthropicClient();

  const prompt = `
You are a Guardian playbook author. Generate a practical, actionable playbook based on the following context.

**Pattern**: ${ctx.patternLabel} (${ctx.patternKey})
**Domain**: ${ctx.domain}
**Complexity Level**: ${ctx.targetComplexity}
**Meta Summary**:
${ctx.metaSummary.readinessScore !== undefined ? `- Readiness Score: ${ctx.metaSummary.readinessScore}` : ''}
${ctx.metaSummary.adoptionStatus ? `- Adoption Status: ${ctx.metaSummary.adoptionStatus}` : ''}
${ctx.metaSummary.editionStatus ? `- Edition Status: ${ctx.metaSummary.editionStatus}` : ''}
${ctx.metaSummary.upliftStatus ? `- Uplift Status: ${ctx.metaSummary.upliftStatus}` : ''}

**Guidelines**:
1. This is ADVISORY ONLY. Do not claim it will automatically configure anything.
2. Use meta signals (scores, statuses, labels) only. No PII, no tenant identifiers.
3. Provide step-by-step implementation guidance, best practices, common pitfalls.
4. Write for complexity level: ${ctx.targetComplexity === 'intro' ? 'beginners, no prior knowledge' : ctx.targetComplexity === 'medium' ? 'intermediate users, familiar with basics' : 'advanced users, understand Guardian internals'}
5. Output valid JSON only (no markdown wrapper).

Generate sections covering:
- "Why this matters" (guide type)
- "Step-by-step implementation" (checklist type)
- "Common pitfalls" (faq type)

Output format (JSON only):
{
  "title": "Concise, actionable title",
  "summary": "2-3 sentence summary of the playbook",
  "sections": [
    {
      "heading": "Section heading",
      "body": "Markdown-formatted content with clear structure",
      "section_type": "guide|checklist|scenario|faq|reference"
    }
  ]
}
`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (in case of wrapper text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const draft = JSON.parse(jsonMatch[0]) as GuardianPlaybookDraft;

    // Validate structure
    if (!draft.title || !draft.summary || !Array.isArray(draft.sections)) {
      throw new Error('Invalid playbook draft structure');
    }

    // Validate sections
    draft.sections.forEach((section) => {
      if (!section.heading || !section.body || !section.section_type) {
        throw new Error('Invalid section structure');
      }
    });

    return draft;
  } catch (error) {
    console.error('Failed to generate playbook draft:', error);
    throw error;
  }
}

/**
 * Generate multiple playbook draft suggestions
 */
export async function generatePlaybookDraftSuggestions(
  contexts: GuardianPlaybookDraftContext[]
): Promise<GuardianPlaybookDraft[]> {
  const drafts = await Promise.all(
    contexts.map((ctx) => generatePlaybookDraft(ctx))
  );
  return drafts;
}

// ===== VALIDATION =====

/**
 * Validate playbook draft has required content
 */
export function validatePlaybookDraft(draft: GuardianPlaybookDraft): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!draft.title || draft.title.trim().length === 0) {
    errors.push('Playbook title is required');
  }

  if (!draft.summary || draft.summary.trim().length === 0) {
    errors.push('Playbook summary is required');
  }

  if (!draft.sections || draft.sections.length === 0) {
    errors.push('At least one section is required');
  }

  draft.sections.forEach((section, idx) => {
    if (!section.heading || section.heading.trim().length === 0) {
      errors.push(`Section ${idx + 1}: heading is required`);
    }
    if (!section.body || section.body.trim().length === 0) {
      errors.push(`Section ${idx + 1}: body is required`);
    }
    const validTypes = ['guide', 'checklist', 'scenario', 'faq', 'reference'];
    if (!validTypes.includes(section.section_type)) {
      errors.push(`Section ${idx + 1}: invalid section_type "${section.section_type}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get suggested contexts for playbook drafting based on patterns
 */
export function getSuggestedDraftContexts(
  patterns: Array<{ domain: GuardianPlaybookTagDomain; key: string; label: string; details?: Record<string, unknown> }>,
  maxComplexity: 'intro' | 'medium' | 'advanced' = 'medium'
): GuardianPlaybookDraftContext[] {
  // Select high-priority patterns (high severity or high-impact)
  const highPriority = patterns
    .filter((p) => p.domain && p.key && p.label)
    .slice(0, 3);

  return highPriority.map((pattern) => ({
    domain: pattern.domain,
    patternKey: pattern.key,
    patternLabel: pattern.label,
    metaSummary: pattern.details ? {
      readinessScore: pattern.details.score ? Number(pattern.details.score) : undefined,
      adoptionStatus: String(pattern.details.status || ''),
      editionStatus: String(pattern.details.edition_key || ''),
      upliftStatus: String(pattern.details.status || ''),
    } : {},
    targetComplexity: maxComplexity,
  }));
}
