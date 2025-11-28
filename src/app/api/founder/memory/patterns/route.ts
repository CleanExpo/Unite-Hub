/**
 * Cross-Client Patterns API
 *
 * GET: Return cross-client patterns with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { patternExtractionService, type PatternType, type PatternStatus } from '@/lib/founderMemory';

export async function GET(req: NextRequest) {
  try {
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const patternTypesParam = req.nextUrl.searchParams.get('patternTypes');
    const minStrength = req.nextUrl.searchParams.get('minStrength');
    const status = req.nextUrl.searchParams.get('status') as PatternStatus | null;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const patternTypes = patternTypesParam
      ? (patternTypesParam.split(',') as PatternType[])
      : undefined;

    const patterns = await patternExtractionService.getPatterns(userId, workspaceId, {
      patternTypes,
      minStrength: minStrength ? parseFloat(minStrength) : undefined,
      status: status || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      patterns: patterns.map((p) => ({
        id: p.id,
        patternType: p.patternType,
        title: p.title,
        description: p.description,
        strengthScore: p.strengthScore,
        recurrenceCount: p.recurrenceCount,
        affectedClientIds: p.affectedClientIds,
        affectedPreClientIds: p.affectedPreClientIds,
        firstDetectedAt: p.firstDetectedAt.toISOString(),
        lastSeenAt: p.lastSeenAt.toISOString(),
        status: p.status,
      })),
      count: patterns.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/patterns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
