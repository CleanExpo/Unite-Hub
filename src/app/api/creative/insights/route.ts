/**
 * Creative Insights API
 * Phase 61: Get creative director insights and briefings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreativeDirectorEngine } from '@/lib/creative/creativeDirectorEngine';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const clientId = searchParams.get('client_id');

    const director = new CreativeDirectorEngine();

    switch (type) {
      case 'briefing':
        const briefing = await director.generateDailyBriefing();
        return NextResponse.json({ data: briefing });

      case 'client':
        if (!clientId) {
          return NextResponse.json(
            { error: 'client_id required' },
            { status: 400 }
          );
        }
        const insights = await director.getClientInsights(clientId);
        return NextResponse.json({ data: insights });

      case 'signature':
        if (!clientId) {
          return NextResponse.json(
            { error: 'client_id required' },
            { status: 400 }
          );
        }
        const signature = await director.getBrandSignature(clientId);
        return NextResponse.json({ data: signature });

      default:
        const defaultBriefing = await director.generateDailyBriefing();
        return NextResponse.json({
          data: defaultBriefing,
          available_types: ['briefing', 'client', 'signature'],
        });
    }
  } catch (error) {
    console.error('Creative insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { client_id, signature } = body;

    if (!client_id || !signature) {
      return NextResponse.json(
        { error: 'client_id and signature required' },
        { status: 400 }
      );
    }

    const director = new CreativeDirectorEngine();
    const saved = await director.saveBrandSignature({
      client_id,
      ...signature,
    });

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error('Creative insights POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
