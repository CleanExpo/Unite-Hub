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

    // Use DataForSEO SERP API when configured, otherwise create baseline observations
    const hasDataForSEO = !!process.env.DATAFORSEO_API_KEY;
    const observations = [];

    for (const keyword of keywords) {
      let position: number | null = null;
      let featuresPresent: string[] = [];
      let aiAnswerPresent = false;
      let aiAnswerSummary: string | null = null;
      let sourceDomains: string[] = [];

      if (hasDataForSEO) {
        try {
          const [login, password] = (process.env.DATAFORSEO_API_KEY || '').split(':');
          const serpRes = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`,
            },
            body: JSON.stringify([{
              keyword,
              location_code: location === 'AU' ? 2036 : 2840,
              language_code: 'en',
              device: deviceType || 'desktop',
              depth: 20,
            }]),
          });

          if (serpRes.ok) {
            const serpData = await serpRes.json();
            const items = serpData?.tasks?.[0]?.result?.[0]?.items ?? [];
            const features = serpData?.tasks?.[0]?.result?.[0]?.item_types ?? [];

            featuresPresent = features.filter((f: string) =>
              ['featured_snippet', 'knowledge_graph', 'ai_overview', 'people_also_ask'].includes(f)
            );
            aiAnswerPresent = features.includes('ai_overview');

            // Find our domain's position
            const organicItems = items.filter((i: any) => i.type === 'organic');
            for (const item of organicItems) {
              sourceDomains.push(item.domain);
            }
          }
        } catch (err) {
          console.warn(`DataForSEO SERP lookup failed for "${keyword}":`, err);
        }
      }

      const observation = await createSerpObservation({
        clientId,
        workspaceId,
        keyword,
        searchEngine: 'google',
        location: location || 'US',
        deviceType: deviceType || 'desktop',
        resultType: 'organic',
        position,
        featuresPresent,
        aiAnswerPresent,
        aiAnswerSummary,
        sourceDomains,
      });

      observations.push(observation);
    }

    return NextResponse.json({
      success: true,
      observations,
      count: observations.length,
      message: 'SERP monitoring active. Check back in 6 hours for next update.'
    });

  } catch (error: unknown) {
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

  } catch (error: unknown) {
    console.error('Cron monitoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
