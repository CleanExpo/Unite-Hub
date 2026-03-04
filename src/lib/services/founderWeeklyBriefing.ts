/**
 * Founder Weekly Briefing Service
 *
 * Generates and stores the Monday 07:00 AEST automated weekly briefing
 * for the Unite-Group founder. Uses Claude Sonnet to produce an
 * executive summary across all 5 business units.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { getStripeKeyForBusiness } from '@/lib/stripe-mrr';

// Business IDs that match the Stripe env-var map
const BUSINESS_IDS = [
  'disaster-recovery',
  'restore-assist',
  'ato',
  'nrpg',
  'unite-group',
] as const;

const BUSINESS_NAMES: Record<string, string> = {
  'disaster-recovery': 'Disaster Recovery',
  'restore-assist': 'Restore Assist',
  ato: 'ATO Consulting',
  nrpg: 'NRPG',
  'unite-group': 'Unite Group',
};

interface BusinessMetrics {
  businessId: string;
  name: string;
  stripeConnected: boolean;
  xeroConnected: boolean;
}

interface AlertEvent {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
}

export interface WeeklyBriefing {
  id: string;
  owner_id: string;
  week_starting: string;
  summary_html: string;
  summary_text: string;
  metrics: Record<string, unknown>;
  alerts: unknown[];
  delivered_email: boolean;
  delivered_push: boolean;
  created_at: string;
}

/**
 * Returns the date string (YYYY-MM-DD) for the Monday of the current week.
 * If today is Sunday (getDay() === 0), returns the previous Monday.
 */
function getCurrentWeekMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, …, 6 = Saturday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  return monday.toISOString().split('T')[0];
}

/**
 * Checks whether the given Xero business tenant mapping is confirmed.
 * Gracefully handles the case where the table does not yet exist (42P01).
 */
async function isXeroConnected(businessId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('xero_business_tenants')
      .select('id')
      .eq('business_key', businessId)
      .not('confirmed_at', 'is', null)
      .limit(1);

    if (error) {
      // 42P01 = undefined_table — treat as not connected
      if ((error as { code?: string }).code === '42P01') return false;
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Fetches recent alert events from the alert_events table.
 * Gracefully handles missing table (42P01).
 */
async function getRecentAlerts(): Promise<AlertEvent[]> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('alert_events')
      .select('id, event_type, severity, message, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if ((error as { code?: string }).code === '42P01') return [];
      return [];
    }

    return (data as AlertEvent[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Converts plain Claude text (with numbered lists and bullet points) into
 * minimal semantic HTML suitable for email delivery.
 */
function textToHtml(text: string): string {
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    const bulletMatch = /^[-*•]\s+(.+)$/.exec(line);
    const numberedMatch = /^\d+[.)]\s+(.+)$/.exec(line);

    if (bulletMatch || numberedMatch) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      htmlParts.push(`<li>${(bulletMatch ?? numberedMatch)![1]}</li>`);
    } else {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      // Bold lines that look like section headers (end with ":" or are short caps)
      if (line.endsWith(':') || /^[A-Z\s]{4,}$/.test(line)) {
        htmlParts.push(`<p><strong>${line}</strong></p>`);
      } else {
        htmlParts.push(`<p>${line}</p>`);
      }
    }
  }

  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('\n');
}

/**
 * Fallback summary when the Anthropic call fails.
 */
function buildFallbackSummary(
  weekStarting: string,
  metricsData: BusinessMetrics[]
): { text: string; html: string } {
  const connectedStripe = metricsData.filter((b) => b.stripeConnected).length;
  const connectedXero = metricsData.filter((b) => b.xeroConnected).length;

  const text = [
    `Weekly Briefing — week of ${weekStarting}`,
    '',
    'Executive Summary:',
    `Portfolio status: ${metricsData.length} business units monitored. ` +
      `${connectedStripe} Stripe integration(s) active, ${connectedXero} Xero integration(s) confirmed.`,
    '',
    'Key Actions:',
    '- Review dashboard for latest KPI updates',
    '- Check Xero sync status for businesses not yet connected',
    '- Monitor Stripe MRR for revenue trends',
    '',
    'Watchlist:',
    metricsData
      .filter((b) => !b.stripeConnected && !b.xeroConnected)
      .map((b) => `- ${b.name}: no integrations connected`)
      .join('\n') || '- All businesses have at least one integration active',
  ].join('\n');

  return { text, html: textToHtml(text) };
}

/**
 * Generates (or retrieves cached) weekly briefing for the given owner.
 */
export async function generateWeeklyBriefing(ownerId: string): Promise<WeeklyBriefing> {
  const weekStarting = getCurrentWeekMonday();

  // Return existing briefing for this week if already generated
  const { data: existing } = await supabaseAdmin
    .from('founder_weekly_briefings')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  if (existing) {
    return existing as WeeklyBriefing;
  }

  // Gather metrics for all 5 businesses in parallel
  const metricsData: BusinessMetrics[] = await Promise.all(
    BUSINESS_IDS.map(async (businessId) => {
      const stripeKey = getStripeKeyForBusiness(businessId);
      const stripeConnected = typeof stripeKey === 'string' && stripeKey.length > 0;
      const xeroConnected = await isXeroConnected(businessId);

      return {
        businessId,
        name: BUSINESS_NAMES[businessId] ?? businessId,
        stripeConnected,
        xeroConnected,
      };
    })
  );

  // Gather recent alert events
  const recentAlerts = await getRecentAlerts();

  // Build integration status summary for metrics JSONB column
  const metricsPayload: Record<string, unknown> = {
    weekStarting,
    businesses: metricsData,
    alertCount: recentAlerts.length,
    generatedAt: new Date().toISOString(),
  };

  // Generate Claude Sonnet summary
  let summaryText: string;
  let summaryHtml: string;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content:
            `Generate a concise weekly briefing for week of ${weekStarting}. Business portfolio:\n` +
            `${JSON.stringify(metricsData, null, 2)}\n` +
            `Recent alerts: ${JSON.stringify(recentAlerts, null, 2)}\n\n` +
            `Provide: 1) Executive summary (2-3 sentences) 2) Key actions for the week (bullet points) ` +
            `3) Watchlist items. Be direct and business-focused. Australian context.`,
        },
      ],
    });

    summaryText =
      response.content[0].type === 'text'
        ? response.content[0].text
        : buildFallbackSummary(weekStarting, metricsData).text;
    summaryHtml = textToHtml(summaryText);
  } catch (err) {
    console.error('[founderWeeklyBriefing] Anthropic call failed, using fallback:', err);
    const fallback = buildFallbackSummary(weekStarting, metricsData);
    summaryText = fallback.text;
    summaryHtml = fallback.html;
  }

  // Persist to database
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('founder_weekly_briefings')
    .insert({
      owner_id: ownerId,
      week_starting: weekStarting,
      summary_html: summaryHtml,
      summary_text: summaryText,
      metrics: metricsPayload,
      alerts: recentAlerts,
      delivered_email: false,
      delivered_push: false,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    throw new Error(
      `[founderWeeklyBriefing] Failed to insert briefing: ${insertError?.message ?? 'unknown error'}`
    );
  }

  return inserted as WeeklyBriefing;
}
