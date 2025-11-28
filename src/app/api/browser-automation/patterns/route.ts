/**
 * Browser Automation Patterns API
 *
 * Manage learned automation patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { patternLearnerService, PatternCategory, PatternStatus } from '@/lib/browserAutomation';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const type = req.nextUrl.searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    if (type === 'stats') {
      const stats = await patternLearnerService.getPatternStats(workspaceId);
      return NextResponse.json({ stats });
    }

    if (type === 'match') {
      const url = req.nextUrl.searchParams.get('url');
      const intent = req.nextUrl.searchParams.get('intent') || undefined;

      if (!url) {
        return NextResponse.json({ error: 'url required for pattern matching' }, { status: 400 });
      }

      const matches = await patternLearnerService.findMatchingPatterns(workspaceId, url, intent);
      return NextResponse.json({ matches });
    }

    // List patterns
    const category = req.nextUrl.searchParams.get('category')?.split(',') as PatternCategory[] | undefined;
    const domain = req.nextUrl.searchParams.get('domain') || undefined;
    const minConfidence = req.nextUrl.searchParams.get('minConfidence');
    const status = req.nextUrl.searchParams.get('status')?.split(',') as PatternStatus[] | undefined;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const result = await patternLearnerService.getPatterns(
      workspaceId,
      {
        category,
        domain,
        minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
        status,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[BrowserAutomation] Error fetching patterns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { action, workspaceId, sessionId, patternId, name, options, updates } = body;

    if (action === 'learn') {
      if (!workspaceId || !sessionId || !name) {
        return NextResponse.json(
          { error: 'workspaceId, sessionId, and name required' },
          { status: 400 }
        );
      }

      const pattern = await patternLearnerService.learnFromActions(workspaceId, sessionId, name, options);
      return NextResponse.json({ pattern });
    }

    if (action === 'recordUse') {
      if (!patternId || body.success === undefined) {
        return NextResponse.json({ error: 'patternId and success required' }, { status: 400 });
      }

      await patternLearnerService.recordPatternUse(patternId, body.success, body.actualSteps);
      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      if (!patternId || !updates) {
        return NextResponse.json({ error: 'patternId and updates required' }, { status: 400 });
      }

      await patternLearnerService.updatePattern(patternId, updates);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!patternId) {
        return NextResponse.json({ error: 'patternId required' }, { status: 400 });
      }

      await patternLearnerService.deletePattern(patternId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[BrowserAutomation] Error processing pattern action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
