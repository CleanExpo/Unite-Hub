/**
 * GET  /api/nexus/pages — list pages for current user
 * POST /api/nexus/pages — create a new page
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const parentId = searchParams.get('parent_id');
    const pageType = searchParams.get('page_type');
    const businessId = searchParams.get('business_id');
    const favoritesOnly = searchParams.get('favorites') === 'true';

    let query = supabase
      .from('nexus_pages')
      .select('id, parent_id, title, icon, page_type, business_id, is_favorite, is_template, sort_order, created_at, updated_at')
      .eq('owner_id', user.id)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (parentId === 'null' || parentId === '') {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    if (pageType) query = query.eq('page_type', pageType);
    if (businessId) query = query.eq('business_id', businessId);
    if (favoritesOnly) query = query.eq('is_favorite', true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ pages: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/nexus/pages]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { title, parent_id, icon, page_type, business_id, is_template, body: pageBody } = body;

    const { data, error } = await supabase
      .from('nexus_pages')
      .insert({
        title: title || 'Untitled',
        parent_id: parent_id || null,
        icon: icon || null,
        page_type: page_type || 'page',
        business_id: business_id || null,
        is_template: is_template || false,
        body: pageBody || {},
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ page: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/nexus/pages]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
