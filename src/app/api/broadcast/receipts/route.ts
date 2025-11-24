/**
 * Broadcast Receipts API
 * Phase 109: Get broadcast delivery receipts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getReceipts } from '@/lib/broadcastEngine';

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

    const recipientAgencyId = req.nextUrl.searchParams.get('recipientAgencyId');
    if (!recipientAgencyId) {
      return NextResponse.json({ error: 'recipientAgencyId required' }, { status: 400 });
    }

    const receipts = await getReceipts(recipientAgencyId);

    return NextResponse.json({ success: true, receipts });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
