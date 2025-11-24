/**
 * Broadcast Messages API
 * Phase 109: Get and create broadcast messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getBroadcasts, createBroadcast } from '@/lib/broadcastEngine';

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

    const senderAgencyId = req.nextUrl.searchParams.get('senderAgencyId');
    if (!senderAgencyId) {
      return NextResponse.json({ error: 'senderAgencyId required' }, { status: 400 });
    }

    const messages = await getBroadcasts(senderAgencyId);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Failed:', error);
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
    const { senderAgencyId, messageType, targetScope, payload, confidence } = body;

    if (!senderAgencyId || !messageType || !targetScope || !payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await createBroadcast(senderAgencyId, messageType, targetScope, payload, confidence);

    if (!message) {
      return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
