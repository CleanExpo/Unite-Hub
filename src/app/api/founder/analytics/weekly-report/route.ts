/**
 * POST /api/founder/analytics/weekly-report
 *
 * Vercel Cron: 0 22 * * 0  (Sunday 22:00 UTC = Monday 08:00 AEST)
 *
 * Generates a WhatsApp-ready weekly analytics report and sends it via CallMeBot.
 * Falls back to console log when env vars are not configured.
 *
 * Required env vars:
 *   CRON_SECRET        — shared secret in x-cron-secret header
 *   WHATSAPP_PHONE     — international format e.g. 61412345678
 *   WHATSAPP_API_KEY   — CallMeBot API key
 *
 * UNI-1458
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsSummary } from '../summary/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatChange(pct: number): string {
  const arrow = pct >= 0 ? '(+)' : '(-)';
  return `${arrow} ${Math.abs(pct).toFixed(1)}%`;
}

function formatAud(n: number): string {
  return `AUD $${n.toLocaleString('en-AU')}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

/**
 * Build the WhatsApp message text.
 * Uses ASCII symbols for robustness across all WhatsApp clients.
 */
function buildReportMessage(summary: AnalyticsSummary): string {
  const { aggregate, sites, rankings } = summary;

  // Date in AEST (UTC+10 standard / UTC+11 daylight)
  const now = new Date();
  const aestOffset = 10 * 60; // use AEST standard
  const aest = new Date(now.getTime() + aestOffset * 60_000);
  const dateStr = aest.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const lines: string[] = [
    `[UNITE-GROUP] WEEKLY ANALYTICS — ${dateStr} (AEST)`,
    `============================================`,
    ``,
    `[NETWORK SUMMARY]`,
    `Visitors today   : ${formatNumber(aggregate.visitorsToday)}`,
    `Visitors this wk : ${formatNumber(aggregate.visitorsWeek)}  ${formatChange(aggregate.visitorsWeekChange)} vs last wk`,
    `Visitors 30d     : ${formatNumber(aggregate.visitorsMonth)}  ${formatChange(aggregate.visitorsMonthChange)} vs last mo`,
    `Revenue attrib.  : ${formatAud(aggregate.revenueAttributedAud)}  ${formatChange(aggregate.revenueChange)}`,
    ``,
    `[SITE BREAKDOWN]`,
  ];

  for (const site of sites) {
    lines.push(
      ``,
      `>> ${site.name} (${site.domain})`,
      `   Today / 7d / 30d : ${formatNumber(site.visitors.today)} / ${formatNumber(site.visitors.week)} / ${formatNumber(site.visitors.month)}`,
      `   Bounce rate       : ${site.bounceRate.toFixed(1)}%`,
      `   Avg session       : ${formatDuration(site.avgSessionSeconds)}`,
      `   Top page          : ${site.topPage.path} (${formatNumber(site.topPage.views)} views)`,
      `   Traffic mix       : Org ${site.sources.organic}% | Dir ${site.sources.direct}% | Ref ${site.sources.referral}% | Soc ${site.sources.social}%`
    );
  }

  lines.push(
    ``,
    `[TOP SEARCH RANKINGS]`
  );

  const top5 = rankings
    .slice(0, 5)
    .map((r) => {
      const changeStr = r.change > 0 ? `(+${r.change})` : r.change < 0 ? `(${r.change})` : `(=)`;
      return `   #${r.position} ${changeStr}  "${r.keyword}"  — ${r.impressions.toLocaleString()} impr, ${r.clicks} clk`;
    });

  lines.push(...top5);

  lines.push(
    ``,
    `[ACTION ITEMS]`,
    `- Review bounce rate for low-performing sites`,
    `- Check top-page conversions vs last week`,
    `- Monitor keyword positions with negative change`,
    ``,
    `Dashboard: https://unite-group.in/founder/analytics`,
    `----`,
    `Unite-Group Nexus | Auto-generated Monday 08:00 AEST`
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get('x-cron-secret');

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Fetch analytics summary from our own API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://unite-group.in';
    const summaryRes = await fetch(`${baseUrl}/api/founder/analytics/summary`, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!summaryRes.ok) {
      throw new Error(`Summary fetch failed: ${summaryRes.status}`);
    }

    const summary: AnalyticsSummary = await summaryRes.json();
    const messageText = buildReportMessage(summary);

    // Send via CallMeBot if configured
    const phone = process.env.WHATSAPP_PHONE;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!phone || !apiKey) {
      console.log('[weekly-report] WHATSAPP env vars not configured — printing preview:');
      console.log(messageText);
      return NextResponse.json({
        sent: false,
        preview: messageText,
        reason: 'env_not_configured',
      });
    }

    const encodedMsg = encodeURIComponent(messageText);
    const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apiKey}`;

    const sendRes = await fetch(callMeBotUrl, { method: 'POST' });

    if (!sendRes.ok) {
      throw new Error(`CallMeBot responded with ${sendRes.status}`);
    }

    console.log('[weekly-report] WhatsApp report sent successfully');

    return NextResponse.json({
      sent: true,
      preview: messageText,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[weekly-report] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
