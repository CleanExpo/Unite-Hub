import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// GET - List all client sites for workspace
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: userError } = await supabaseBrowser.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const { data: sites, error } = await supabase
      .from('client_sites')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
throw error;
}

    return NextResponse.json({ success: true, sites });
  } catch (error) {
    console.error('[Sites API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

// POST - Create new client site
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: userError } = await supabaseBrowser.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, name, domain, url, siteType, cmsType, accessMethod } = body;

    if (!workspaceId || !name || !domain || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const { data: site, error } = await supabase
      .from('client_sites')
      .insert({
        workspace_id: workspaceId,
        name,
        domain,
        url,
        site_type: siteType || 'website',
        cms_type: cmsType,
        access_method: accessMethod || 'api',
        status: 'pending_setup'
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return NextResponse.json({ success: true, site });
  } catch (error) {
    console.error('[Sites API] Create error:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
