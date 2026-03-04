import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { generateApiKey } from '@/lib/project-connect/api-keys';

// GET: list connected projects for the current user
export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('connected_projects')
      .select('id, name, slug, api_key_prefix, webhook_url, last_seen_at, health_status, health_data, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create a new connected project
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { name, slug, webhookUrl } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
    }

    // Generate API key
    const { key, hash, prefix } = generateApiKey(slug);

    const { data, error } = await supabaseAdmin
      .from('connected_projects')
      .insert({
        name,
        slug,
        api_key_hash: hash,
        api_key_prefix: prefix,
        webhook_url: webhookUrl || null,
        owner_id: user.id,
        health_status: 'unknown',
      })
      .select('id, name, slug, api_key_prefix, health_status, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A project with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the full API key ONCE — it cannot be retrieved again
    return NextResponse.json({ project: data, apiKey: key });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a connected project
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('connected_projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: regenerate API key for a project
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('connected_projects')
      .select('slug')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { key, hash, prefix } = generateApiKey(project.slug);

    const { error } = await supabaseAdmin
      .from('connected_projects')
      .update({
        api_key_hash: hash,
        api_key_prefix: prefix,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ apiKey: key, prefix });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
