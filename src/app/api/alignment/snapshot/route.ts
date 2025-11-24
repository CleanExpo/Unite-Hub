/**
 * Strategic Alignment Snapshot API
 * Phase 104: Get and generate alignment snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getAlignmentSnapshot, generateAlignmentSnapshot } from '@/lib/alignmentEngine';

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

    const snapshot = await getAlignmentSnapshot(tenantId);

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('Failed to get alignment snapshot:', error);
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

    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const snapshot = await generateAlignmentSnapshot(tenantId);

    if (!snapshot) {
      return NextResponse.json({ error: 'Failed to generate alignment snapshot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('Failed to generate alignment snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
