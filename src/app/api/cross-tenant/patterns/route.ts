import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getGlobalPatterns, submitPattern } from '@/lib/crossTenant/patternHub';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = req.nextUrl.searchParams.get('category') || undefined;
    const patterns = await getGlobalPatterns(category);

    return NextResponse.json({
      patterns,
      confidence: 0.85,
      uncertaintyNotes: 'Patterns anonymised and untraceable to individual tenants'
    });
  } catch (error) {
    console.error('Pattern hub API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, patternName, patternData, category } = await req.json();

    const result = await submitPattern(tenantId, patternName, patternData, category);

    return NextResponse.json({
      result,
      confidence: 0.8,
      uncertaintyNotes: 'Pattern submitted with anonymisation. Confidence capped at 95%.'
    });
  } catch (error) {
    console.error('Pattern submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
