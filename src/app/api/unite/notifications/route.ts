/**
 * Notifications API
 * Phase: D59
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification, listNotifications, markAsRead } from '@/lib/unite/notificationService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const unread = request.nextUrl.searchParams.get('unread') === 'true';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const notifications = await listNotifications(tenantId, user.id, { unread, limit });
    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    if (action === 'mark_read') {
      await markAsRead(body.notification_id);
      return NextResponse.json({ success: true });
    }

    const notification = await createNotification({ tenant_id: tenantId, user_id: user.id, ...body });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
