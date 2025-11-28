/**
 * SEO Audit API Route
 * POST - Create new audit job
 * GET - Get audit history or specific job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { seoAuditService } from '@/lib/seoEnhancement';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, url, auditType, clientId, scheduledAt } = body;

    if (!workspaceId || !url) {
      return NextResponse.json(
        { error: 'workspaceId and url are required' },
        { status: 400 }
      );
    }

    const job = await seoAuditService.createAuditJob({
      workspaceId,
      url,
      auditType,
      clientId,
      scheduledAt,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[API] SEO Audit POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const jobId = searchParams.get('jobId');
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (jobId) {
      // Get specific job with results
      const [job, results] = await Promise.all([
        seoAuditService.getAuditJob(jobId),
        seoAuditService.getAuditResults(jobId),
      ]);

      return NextResponse.json({ job, results });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get audit history
    const history = await seoAuditService.getAuditHistory(workspaceId, {
      limit,
      domain: domain || undefined,
    });

    return NextResponse.json({ audits: history });
  } catch (error) {
    console.error('[API] SEO Audit GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
