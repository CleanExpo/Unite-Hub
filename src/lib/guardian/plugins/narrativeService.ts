/**
 * Guardian Plugin Narrative Service
 * Generates AI-powered narrative summaries for plugin signals
 *
 * Used by industry packs to provide executive-friendly prose explanations
 * of signal clusters and recommended actions.
 *
 * IMPORTANT: Governance-aware. Respects workspace sharing policies.
 */

import { Anthropic } from '@anthropic-ai/sdk';

/**
 * Narrative generation request
 */
export interface NarrativeRequest {
  workspaceId: string;
  pluginKey: string;
  pluginName: string;
  signals: Array<{
    key: string;
    severity: 'low' | 'medium' | 'high';
    rationale: string;
    suggestedAction?: string;
  }>;
  riskLabel: 'low' | 'medium' | 'high' | 'unknown';
  totals: {
    alerts: number;
    incidents: number;
    correlations: number;
  };
  allowExternal: boolean; // governance flag
}

/**
 * Narrative response
 */
export interface NarrativeResponse {
  narrative: string;
  keyTakeaways: string[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
  generatedAt: string;
  disclaimers: string[];
}

/**
 * Compute priority from risk label and signal severity
 */
function computePriority(
  riskLabel: string,
  signalCount: number
): 'urgent' | 'high' | 'normal' | 'low' {
  if (riskLabel === 'high') {
return signalCount > 2 ? 'urgent' : 'high';
}
  if (riskLabel === 'medium') {
return signalCount > 1 ? 'high' : 'normal';
}
  if (signalCount > 3) {
return 'high';
}
  if (signalCount > 0) {
return 'normal';
}
  return 'low';
}

/**
 * Generate mock narrative (used when AI unavailable or governance restricted)
 */
function generateMockNarrative(request: NarrativeRequest): NarrativeResponse {
  const signalCount = request.signals.length;
  const priority = computePriority(request.riskLabel, signalCount);

  let narrative = '';

  if (priority === 'urgent') {
    narrative = `${signalCount} critical signals across ${request.pluginName}. Immediate operational review required.`;
  } else if (priority === 'high') {
    narrative = `${signalCount} operational signals for ${request.pluginName} require attention. Review metrics and recommended actions.`;
  } else if (priority === 'normal') {
    narrative = `${signalCount} operational signal${signalCount === 1 ? '' : 's'} detected. Monitor for escalation.`;
  } else {
    narrative = `Operations appear normal. No high-priority signals detected.`;
  }

  const keyTakeaways = request.signals
    .filter((s) => s.severity === 'high' || s.severity === 'medium')
    .slice(0, 2)
    .map((s) => s.suggestedAction || `Review ${s.key}`)
    .filter(Boolean);

  return {
    narrative,
    keyTakeaways,
    priority,
    generatedAt: new Date().toISOString(),
    disclaimers: [
      'Mock narrative (AI unavailable or governance restricted)',
      'For operational guidance only, not compliance-grade'
    ]
  };
}

/**
 * Generate AI narrative for plugin signals
 *
 * Makes Claude API call to produce executive summary of signal state.
 * Respects governance flags (external sharing, etc).
 *
 * Returns mock response if AI unavailable or governance restrictions prevent generation.
 */
export async function generateNarrative(request: NarrativeRequest): Promise<NarrativeResponse> {
  // Governance check: respect external sharing policy
  if (!request.allowExternal) {
    // Return mock if external sharing disabled (plugin is internal-only)
    return generateMockNarrative(request);
  }

  // Use mock in test environments
  if (process.env.NODE_ENV === 'test') {
    return generateMockNarrative(request);
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const signalSummary = request.signals
      .map((s) => `- **${s.key}** (${s.severity}): ${s.rationale}${s.suggestedAction ? ` → ${s.suggestedAction}` : ''}`)
      .join('\n');

    const prompt = `You are a concise executive operations advisor. Analyze these operational signals and provide a brief, actionable narrative (2-3 sentences max).

**Plugin**: ${request.pluginName}
**Risk Level**: ${request.riskLabel}
**24h Metrics**: ${request.totals.alerts} alerts, ${request.totals.incidents} incidents, ${request.totals.correlations} correlations

**Detected Signals**:
${signalSummary}

Provide:
1. One-sentence executive summary of operational state
2. Top 1-2 priority actions (use format: "Action: ...")
3. One short sentence about confidence level

Keep output concise and actionable.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const narrativeText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    // Parse response
    const lines = narrativeText.split('\n').filter((l) => l.trim());
    const narrative = lines.slice(0, 2).join(' ');
    const keyTakeaways = lines
      .filter((l) => l.includes('Action:'))
      .map((l) => l.replace(/^.*?Action:\s*/, '').trim());

    const priority = computePriority(request.riskLabel, request.signals.length);

    return {
      narrative,
      keyTakeaways,
      priority,
      generatedAt: new Date().toISOString(),
      disclaimers: [
        'Narrative generated by AI; verify with actual operational data',
        'Not suitable for compliance or audit purposes'
      ]
    };
  } catch (err) {
    // Fallback to mock if API fails
    console.warn('Failed to generate narrative via Claude API:', err);
    return generateMockNarrative(request);
  }
}

/**
 * Format narrative for display in UI
 */
export function formatNarrativeForUI(response: NarrativeResponse): string {
  const priorityColor = {
    urgent: '🔴',
    high: '🟠',
    normal: '🟡',
    low: '🟢'
  };

  const priorityLabel = {
    urgent: 'URGENT',
    high: 'HIGH',
    normal: 'NORMAL',
    low: 'LOW'
  };

  let output = `${priorityColor[response.priority]} **Priority: ${priorityLabel[response.priority]}**\n\n`;
  output += `${response.narrative}\n\n`;

  if (response.keyTakeaways.length > 0) {
    output += `**Recommended Actions**:\n`;
    response.keyTakeaways.forEach((action) => {
      output += `- ${action}\n`;
    });
    output += '\n';
  }

  if (response.disclaimers.length > 0) {
    output += `⚠️ **Disclaimers**:\n`;
    response.disclaimers.forEach((disclaimer) => {
      output += `- ${disclaimer}\n`;
    });
  }

  return output;
}
