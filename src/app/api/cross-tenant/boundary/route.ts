import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseBrowser } from '@/lib/supabase';
import { validateBoundaryCrossing, getBoundaryCrossings } from '@/lib/crossTenant/boundary';

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

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const crossings = await getBoundaryCrossings(tenantId);

    return NextResponse.json({
      crossings,
      confidence: 0.85,
      uncertaintyNotes: 'Boundary crossings logged based on detected data flows'
    });
  } catch (error) {
    console.error('Boundary API error:', error);
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

    const { tenantId, dataType, targetScope } = await req.json();

    const result = await validateBoundaryCrossing(tenantId, dataType, targetScope);

    return NextResponse.json({
      result,
      confidence: 0.9,
      uncertaintyNotes: 'Validation based on current boundary rules'
    });
  } catch (error) {
    console.error('Boundary validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
