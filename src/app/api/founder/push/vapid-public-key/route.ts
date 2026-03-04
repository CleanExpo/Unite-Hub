import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getVapidPublicKey } from '@/lib/push/webPushService';

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
