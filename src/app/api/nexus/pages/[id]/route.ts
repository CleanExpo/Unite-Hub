/**
 * GET    /api/nexus/pages/:id — get single page with sub-pages
 * PATCH  /api/nexus/pages/:id — update page (auto-save endpoint)
 * DELETE /api/nexus/pages/:id — archive page
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data: page, error } = await supabase
      .from('nexus_pages')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .is('archived_at', null)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Fetch sub-pages
    const { data: subPages } = await supabase
      .from('nexus_pages')
      .select('id, title, icon, page_type, sort_order, updated_at')
      .eq('parent_id', id)
      .eq('owner_id', user.id)
      .is('archived_at', null)
      .order('sort_order', { ascending: true });

    // Fetch breadcrumb chain
    const breadcrumbs: { id: string; title: string; icon: string | null }[] = [];
    let currentParentId = page.parent_id;
    while (currentParentId) {
      const { data: parent } = await supabase
        .from('nexus_pages')
        .select('id, title, icon, parent_id')
        .eq('id', currentParentId)
        .eq('owner_id', user.id)
        .single();

      if (!parent) break;
      breadcrumbs.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
      currentParentId = parent.parent_id;
    }

    return NextResponse.json({ page, subPages: subPages ?? [], breadcrumbs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/nexus/pages/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const allowed = ['title', 'body', 'icon', 'cover_url', 'properties', 'page_type', 'business_id', 'is_favorite', 'is_template', 'sort_order'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nexus_pages')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ page: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PATCH /api/nexus/pages/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { error } = await supabase
      .from('nexus_pages')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[DELETE /api/nexus/pages/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
