import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { conductStrategicDialogue } from '@/lib/agents/aiPhillAgent';

/**
 * POST /api/founder-os/ai-phill/chat
 * Send a message to AI Phill and receive a strategic dialogue response
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/ai-phill/chat] POST request received');

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
    const { message } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    console.log('[founder-os/ai-phill/chat] Processing message for user:', userId);

    // Call AI Phill strategic dialogue
    const result = await conductStrategicDialogue(userId, message.trim());

    if (!result.success) {
      console.error('[founder-os/ai-phill/chat] Dialogue error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/ai-phill/chat] Dialogue completed successfully');

    return NextResponse.json({
      success: true,
      response: result.data?.response || '',
      followUpQuestions: result.data?.followUpQuestions || [],
      relatedInsights: result.data?.relatedInsights || [],
      suggestedActions: result.data?.suggestedActions || [],
      confidenceLevel: result.data?.confidenceLevel || 0,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[founder-os/ai-phill/chat] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
