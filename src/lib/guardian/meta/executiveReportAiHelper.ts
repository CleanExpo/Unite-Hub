import Anthropic from '@anthropic-ai/sdk';
import { ExecutiveReport } from '@/lib/guardian/meta/executiveReportService';

// Lazy Anthropic client pattern
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * AI-generated narrative for executive report
 */
export interface ExecutiveReportNarrative {
  introParagraph: string;
  keyFindings: string[];
  recommendationsProse: string;
  conclusion: string;
}

/**
 * Generate AI narrative for executive report using Claude Sonnet
 * Optional feature; gracefully degrades if Claude unavailable
 */
export async function generateExecutiveReportNarrative(
  report: ExecutiveReport,
  enableAiNarrative: boolean = false
): Promise<ExecutiveReportNarrative | null> {
  if (!enableAiNarrative) return null;

  try {
    const client = getAnthropicClient();

    // Format report data for prompt
    const reportSummary = formatReportForNarrative(report);

    const prompt = `You are an executive business analyst. Generate a professional executive narrative for this Guardian health report.

Report Summary:
${reportSummary}

Generate a JSON response with:
{
  "introParagraph": "1-2 sentence executive overview",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendationsProse": "2-3 sentence narrative of key recommendations",
  "conclusion": "1-2 sentence forward-looking statement"
}

Requirements:
- Use formal executive tone (no marketing language, no emojis)
- Focus on business impact and risk
- No PII or sensitive data in narrative
- Base recommendations on metrics in the report
- Keep recommendations actionable and prioritized
- Use percentages and scores from report data

Return ONLY valid JSON.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Failed to parse AI narrative JSON response');
      return null;
    }

    const narrative = JSON.parse(jsonMatch[0]) as ExecutiveReportNarrative;
    return narrative;
  } catch (error) {
    console.error('Failed to generate AI narrative:', error);
    // Graceful degradation: return null if AI fails
    return null;
  }
}

/**
 * Generate key highlights for report (AI-powered)
 */
export async function generateReportHighlights(
  report: ExecutiveReport,
  enableAiHighlights: boolean = false
): Promise<string[] | null> {
  if (!enableAiHighlights) return null;

  try {
    const client = getAnthropicClient();

    const summaryStr = `
Readiness: ${report.summary.readinessScore}/100 (${report.summary.readinessDelta > 0 ? '+' : ''}${report.summary.readinessDelta})
Edition Alignment: ${report.summary.editionAlignmentScore}/100
Uplift Progress: ${report.summary.upliftProgressPct}% (${report.summary.upliftTasksCompletedCount}/${report.summary.upliftTasksTotalCount} tasks)
Risk Level: ${report.summary.riskLevel}
Network Health: ${report.summary.networkHealthStatus}
`;

    const prompt = `Generate 3-4 concise executive highlights from this Guardian health report data. Format as a JSON array of strings.

Data:
${summaryStr}

Sections: ${report.sections.map((s) => s.sectionTitle).join(', ')}

Return ONLY a JSON array of strings, no other text. Example: ["Highlight 1", "Highlight 2"]`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON array
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('Failed to parse highlights JSON');
      return null;
    }

    const highlights = JSON.parse(jsonMatch[0]) as string[];
    return highlights;
  } catch (error) {
    console.error('Failed to generate highlights:', error);
    return null;
  }
}

/**
 * Generate risk assessment narrative (AI-powered)
 */
export async function generateRiskAssessmentNarrative(
  report: ExecutiveReport,
  enableAiRiskAnalysis: boolean = false
): Promise<string | null> {
  if (!enableAiRiskAnalysis) return null;

  try {
    const client = getAnthropicClient();

    const criticalGaps = report.sections
      .find((s) => s.sectionKey === 'gaps_and_recommendations')
      ?.metrics.top_gaps || [];

    const blockedTasks =
      report.sections
        .find((s) => s.sectionKey === 'uplift_progress')
        ?.metrics.blocked_count || 0;

    const prompt = `Write a 1-paragraph executive risk assessment for this Guardian health report. Keep to 3-4 sentences. Focus on: readiness gaps, uplift blockers, and mitigation priorities.

Risk Level: ${report.summary.riskLevel}
Readiness: ${report.summary.readinessScore}/100
Critical Gaps: ${criticalGaps.join(', ') || 'None identified'}
Blocked Tasks: ${blockedTasks}

Guidelines:
- Use clear, direct language
- Focus on business impact
- Suggest specific mitigation actions
- No technical jargon

Return only the paragraph text, no JSON or formatting.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative =
      message.content[0].type === 'text' ? message.content[0].text : '';
    return narrative.trim();
  } catch (error) {
    console.error('Failed to generate risk assessment:', error);
    return null;
  }
}

/**
 * Format report data into summarized text for prompt
 */
function formatReportForNarrative(report: ExecutiveReport): string {
  const sections = report.sections
    .map(
      (s) =>
        `${s.sectionTitle}: ${s.highlights.join('; ')}. Recommendations: ${s.recommendations.join('; ')}`
    )
    .join('\n\n');

  return `
Period: ${report.periodStart.toDateString()} to ${report.periodEnd.toDateString()}
Readiness Score: ${report.summary.readinessScore}/100 (delta: ${report.summary.readinessDelta > 0 ? '+' : ''}${report.summary.readinessDelta})
Edition Alignment: ${report.summary.editionAlignmentScore}/100 (${report.summary.editionAlignmentStatus})
Uplift Progress: ${report.summary.upliftProgressPct}% complete
Risk Level: ${report.summary.riskLevel}

${sections}
`;
}

/**
 * Enrich report with AI narratives (batch operation)
 */
export async function enrichReportWithAiNarratives(
  report: ExecutiveReport,
  options?: {
    enableNarrative?: boolean;
    enableHighlights?: boolean;
    enableRiskAnalysis?: boolean;
  }
): Promise<ExecutiveReport> {
  const enriched = { ...report };

  try {
    // Generate narrative
    if (options?.enableNarrative !== false) {
      const narrative = await generateExecutiveReportNarrative(report, true);
      if (narrative) {
        enriched.narrative = narrative;
      }
    }

    // Generate highlights (store in metadata)
    if (options?.enableHighlights !== false) {
      const highlights = await generateReportHighlights(report, true);
      if (highlights) {
        enriched.metadata = {
          ...enriched.metadata,
          ai_highlights: highlights,
        };
      }
    }

    // Generate risk assessment (store in metadata)
    if (options?.enableRiskAnalysis !== false) {
      const riskAssessment = await generateRiskAssessmentNarrative(report, true);
      if (riskAssessment) {
        enriched.metadata = {
          ...enriched.metadata,
          ai_risk_assessment: riskAssessment,
        };
      }
    }
  } catch (error) {
    console.error('Error enriching report with AI narratives:', error);
    // Return unenriched report on failure
  }

  return enriched;
}

/**
 * Format report for presentation (narrative + visual cues)
 */
export function formatReportForPresentation(
  report: ExecutiveReport
): {
  title: string;
  executiveSummary: string;
  mainFindings: string[];
  recommendations: string[];
  riskSummary: string;
} {
  const narrative = report.narrative;
  const mainFindings = report.sections.flatMap((s) => s.highlights).slice(0, 5);
  const recommendations = report.sections.flatMap((s) => s.recommendations).slice(0, 5);

  const riskSummary =
    report.metadata?.ai_risk_assessment ||
    `Risk Level: ${report.summary.riskLevel}. Readiness: ${report.summary.readinessScore}/100. Focus: address top gaps and unblock uplift tasks.`;

  return {
    title: report.title,
    executiveSummary:
      narrative?.introParagraph ||
      `Guardian health report for ${report.periodStart.toDateString()} to ${report.periodEnd.toDateString()}`,
    mainFindings,
    recommendations,
    riskSummary,
  };
}
