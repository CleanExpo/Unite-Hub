import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getDigests,
  generateDigest,
  type DigestType,
} from '@/lib/founderOS/cognitiveTwinService';

/**
 * GET /api/founder-os/cognitive-twin/digests
 * Get periodic digests for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/digests] GET request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get query parameters
    const digestType = req.nextUrl.searchParams.get('type') as DigestType | undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    // Get digests
    const result = await getDigests(userId, digestType, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/digests] Retrieved', result.data?.length || 0, 'digests');

    return NextResponse.json({
      success: true,
      digests: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/digests] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder-os/cognitive-twin/digests
 * Generate a new periodic digest (daily, weekly, monthly)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/digests] POST request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { digestType } = body;

    // Validate required fields
    if (!digestType) {
      return NextResponse.json({ error: 'Missing required field: digestType' }, { status: 400 });
    }

    // Generate digest with AI
    console.log('[founder-os/cognitive-twin/digests] Generating digest:', digestType);
    const result = await generateDigest(userId, digestType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/digests] Digest generated:', result.data?.id);

    return NextResponse.json({
      success: true,
      digest: result.data,
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/digests] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
