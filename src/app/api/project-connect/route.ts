import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/project-connect/api-keys';

interface ProjectConnectPayload {
  type: 'event' | 'health' | 'revenue';
  event?: { type: string; payload: Record<string, unknown> };
  health?: { status: 'healthy' | 'degraded' | 'down'; data?: Record<string, unknown> };
  revenue?: { mrr: number; customers: number; currency: 'AUD' };
}

async function authenticateProject(apiKey: string) {
  // Extract prefix for lookup (first 12 chars)
  const prefix = apiKey.slice(0, 12);

  const { data: projects, error } = await supabaseAdmin
    .from('connected_projects')
    .select('id, api_key_hash, slug')
    .eq('api_key_prefix', prefix);

  if (error || !projects?.length) return null;

  // Verify full hash
  for (const project of projects) {
    if (project.api_key_hash && verifyApiKey(apiKey, project.api_key_hash)) {
      return project;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });
    }

    const project = await authenticateProject(apiKey);
    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body: ProjectConnectPayload = await req.json();

    if (!body.type || !['event', 'health', 'revenue'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid payload type' }, { status: 400 });
    }

    // Update last_seen_at on every request
    await supabaseAdmin
      .from('connected_projects')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', project.id);

    switch (body.type) {
      case 'event': {
        if (!body.event?.type) {
          return NextResponse.json({ error: 'Missing event.type' }, { status: 400 });
        }
        const { error } = await supabaseAdmin
          .from('project_events')
          .insert({
            project_id: project.id,
            event_type: body.event.type,
            payload: body.event.payload || {},
          });
        if (error) {
          return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, type: 'event' });
      }

      case 'health': {
        if (!body.health?.status) {
          return NextResponse.json({ error: 'Missing health.status' }, { status: 400 });
        }
        const { error } = await supabaseAdmin
          .from('connected_projects')
          .update({
            health_status: body.health.status,
            health_data: body.health.data || {},
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);
        if (error) {
          return NextResponse.json({ error: 'Failed to update health' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, type: 'health' });
      }

      case 'revenue': {
        if (body.revenue?.mrr === undefined) {
          return NextResponse.json({ error: 'Missing revenue.mrr' }, { status: 400 });
        }
        const { error } = await supabaseAdmin
          .from('project_events')
          .insert({
            project_id: project.id,
            event_type: 'revenue.update',
            payload: body.revenue,
          });
        if (error) {
          return NextResponse.json({ error: 'Failed to store revenue event' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, type: 'revenue' });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
