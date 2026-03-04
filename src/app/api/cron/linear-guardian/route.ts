/**
 * Cron: Linear Guardian
 * GET /api/cron/linear-guardian
 *
 * Runs daily at 09:00 UTC via Vercel Cron.
 * Checks for stale P0/P1 issues in the Unite-Hub Linear team.
 * Creates alerts for any P0 issue open >7 days without activity.
 *
 * Auth: CRON_SECRET header
 * Related to: UNI-1390
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const LINEAR_TEAM_ID = 'ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b';
const STALE_DAYS_THRESHOLD = 7;

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  updatedAt: string;
  createdAt: string;
  state: { name: string; type: string };
  assignee?: { name: string } | null;
}

async function linearGql(
  query: string,
  variables?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const token = process.env.LINEAR_API_KEY;
  if (!token) throw new Error('LINEAR_API_KEY not configured');

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch open P0 (Urgent) and P1 (High) issues
    const result = (await linearGql(
      `query($teamId: String!) {
        issues(
          filter: {
            team: { id: { eq: $teamId } }
            priority: { lte: 2 }
            state: { type: { nin: ["completed", "canceled"] } }
          }
          first: 50
          orderBy: updatedAt
        ) {
          nodes {
            id
            identifier
            title
            priority
            updatedAt
            createdAt
            state { name type }
            assignee { name }
          }
        }
      }`,
      { teamId: LINEAR_TEAM_ID }
    )) as { data: { issues: { nodes: LinearIssue[] } } };

    const issues = result.data?.issues?.nodes ?? [];
    const now = Date.now();
    const staleThreshold = STALE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
    let alertsCreated = 0;

    for (const issue of issues) {
      const updatedAt = new Date(issue.updatedAt).getTime();
      const daysSinceUpdate = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));

      // Alert for P0 issues stale >7 days, or P1 issues stale >14 days
      const threshold = issue.priority <= 1 ? staleThreshold : staleThreshold * 2;

      if (now - updatedAt > threshold) {
        // Check if we already have a recent alert for this issue (avoid duplicates)
        const { data: existing } = await supabaseAdmin
          .from('alerts')
          .select('id')
          .eq('type', 'linear_guardian')
          .eq('service', issue.identifier)
          .gte('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue;

        const priorityLabel = issue.priority <= 1 ? 'P0 (Urgent)' : 'P1 (High)';
        const assignee = issue.assignee?.name ?? 'Unassigned';

        await supabaseAdmin.from('alerts').insert({
          workspace_id:
            process.env.DEFAULT_WORKSPACE_ID ??
            '00000000-0000-0000-0000-000000000000',
          type: 'linear_guardian',
          severity: issue.priority <= 1 ? 'critical' : 'warning',
          message: `${priorityLabel} issue ${issue.identifier} "${issue.title}" has been stale for ${daysSinceUpdate} days. Assignee: ${assignee}. State: ${issue.state.name}.`,
          service: issue.identifier,
          sent_at: new Date().toISOString(),
          acknowledged: false,
        });

        alertsCreated++;
      }
    }

    return NextResponse.json({
      ok: true,
      issuesChecked: issues.length,
      alertsCreated,
    });
  } catch (err) {
    console.error('[cron/linear-guardian]', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 200 }
    );
  }
}
