import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityAlertService } from '@/lib/security/securityAlertService';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const alerts = await securityAlertService.listAlerts(supabase, tenantId, 50);
  return NextResponse.json({ items: alerts });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { tenantId, type, severity, message, source, metadata } = body;

  if (!tenantId || !type || !severity || !message) {
    return NextResponse.json({ error: 'tenantId, type, severity, and message are required' }, { status: 400 });
  }

  const alert = await securityAlertService.raiseAlert(supabase, {
    tenantId,
    type,
    severity,
    message,
    source,
    metadata
  });

  if (!alert) {
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }

  return NextResponse.json({ item: alert });
}
