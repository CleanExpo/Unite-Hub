import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiKeyService } from '@/lib/security/apiKeyService';

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

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, scopes, last_used_at, created_at, revoked_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/security/api-keys] error', error);
    return NextResponse.json({ error: 'Failed to load keys' }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { tenantId, name, scopes } = body;

  if (!tenantId || !name) {
    return NextResponse.json({ error: 'tenantId and name required' }, { status: 400 });
  }

  const { rawKey, recordId } = await apiKeyService.createApiKey(supabase, tenantId, name, scopes ?? []);

  if (!recordId) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }

  return NextResponse.json({ id: recordId, apiKey: rawKey });
}

export async function DELETE(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const id = searchParams.get('id');

  if (!tenantId || !id) {
    return NextResponse.json({ error: 'tenantId and id required' }, { status: 400 });
  }

  const ok = await apiKeyService.revokeApiKey(supabase, tenantId, id);

  if (!ok) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
