import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getProfiles, getActiveProfile } from '@/lib/governance/meta';

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
    const activeOnly = req.nextUrl.searchParams.get('activeOnly') === 'true';
    if (!tenantId) {
return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
}

    if (activeOnly) {
      const profile = await getActiveProfile(tenantId);
      return NextResponse.json({ success: true, profile });
    }

    const profiles = await getProfiles(tenantId);

    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
