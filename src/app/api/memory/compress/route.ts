/**
 * Compress Memory API
 * Phase 100: Create compressed memory packets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { compressAndStore } from '@/lib/memoryCompression';

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
    const { sourceType, tenantId, regionId } = body;

    if (!sourceType) {
      return NextResponse.json({ error: 'sourceType required' }, { status: 400 });
    }

    const packet = await compressAndStore(sourceType, tenantId, regionId);

    if (!packet) {
      return NextResponse.json({ error: 'Failed to compress memory' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      packet,
    });
  } catch (error) {
    console.error('Failed to compress memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
