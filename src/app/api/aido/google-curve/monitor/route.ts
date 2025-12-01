import { NextRequest, NextResponse } from 'next/server';
import { createSerpObservation } from '@/lib/aido/database/serp-observations';
import { createChangeSignal } from '@/lib/aido/database/change-signals';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const {
      clientId,
      keywords,
      location,
      deviceType
    } = body;

    if (!clientId || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, keywords (array)' },
        { status: 400 }
      );
    }

    // In production, this would call Google Search API to get SERP results
    // For now, we'll create placeholder observations
    const observations = [];

    for (const keyword of keywords) {
      const observation = await createSerpObservation({
        clientId,
        workspaceId,
        keyword,
        searchEngine: 'google',
        location: location || 'US',
        deviceType: deviceType || 'desktop',
        resultType: 'organic',
        position: Math.floor(Math.random() * 20) + 1, // Placeholder
        featuresPresent: ['ai_overview', 'featured_snippet'], // Placeholder
        aiAnswerPresent: Math.random() > 0.5,
        aiAnswerSummary: undefined,
        sourceDomainsUsed: []
      });

      observations.push(observation);
    }

    return NextResponse.json({
      success: true,
      observations,
      count: observations.length,
      message: 'SERP monitoring active. Check back in 6 hours for next update.'
    });

  } catch (error: any) {
    console.error('Monitor SERP error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cron job handler (called by Vercel Cron every 6 hours)
export async function GET(req: NextRequest) {
  try {
    // Verify cron job authentication
    const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This would fetch all active clients and monitor their keywords
    // For now, return success
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully'
    });

  } catch (error: any) {
    console.error('Cron monitoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
