// src/app/api/knowledge/notes/route.ts
// GET /api/knowledge/notes — list knowledge notes (paginated, filterable)
// POST /api/knowledge/notes — create a new knowledge note (Phase 1: manual seed only)

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectKey = searchParams.get('project')
  const searchQuery = searchParams.get('q')
  const noteType = searchParams.get('type')
  const tag = searchParams.get('tag')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const supabase = await createClient()

  let query = supabase
    .from('knowledge_notes')
    .select('id, vault_path, title, slug, project_key, note_type, tags, word_count, confidence, quality, ai_optimized, created_at, updated_at', { count: 'exact' })
    .eq('founder_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (projectKey) {
    query = query.eq('project_key', projectKey)
  }

  if (noteType) {
    query = query.eq('note_type', noteType)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (searchQuery) {
    // Use the full-text search helper function
    const { data: searchData, error: searchError } = await supabase.rpc('search_knowledge_notes', {
      p_founder_id: user.id,
      p_query: searchQuery,
      p_project_key: projectKey,
      p_limit: limit,
    })

    if (searchError) {
      // Fallback to ILIKE if RPC fails
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      const { data, error, count } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ notes: data ?? [], count: count ?? 0, offset, limit })
    }

    return NextResponse.json({
      notes: searchData ?? [],
      count: searchData?.length ?? 0,
      offset,
      limit,
    })
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notes: data ?? [], count: count ?? 0, offset, limit })
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json() as {
    project_key: string
    vault_path: string
    title: string
    content?: string
    content_html?: string
    note_type?: string
    tags?: string[]
    frontmatter?: Record<string, unknown>
    sources?: Array<{ title: string; url: string }>
    confidence?: string
    quality?: string
    ai_optimized?: boolean
    obsidian_source?: string
    obsidian_mtime?: string
  }

  if (!body.project_key || !body.vault_path || !body.title) {
    return NextResponse.json({ error: 'project_key, vault_path, and title are required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify project exists
  const { data: project } = await supabase
    .from('knowledge_projects')
    .select('id')
    .eq('founder_id', user.id)
    .eq('key', body.project_key)
    .single()

  if (!project) {
    return NextResponse.json({ error: `Project '${body.project_key}' not found` }, { status: 404 })
  }

  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const wordCount = (body.content ?? '').split(/\s+/).filter(Boolean).length

  const { data, error } = await supabase
    .from('knowledge_notes')
    .insert({
      founder_id: user.id,
      project_key: body.project_key,
      vault_path: body.vault_path,
      title: body.title,
      slug,
      content: body.content ?? '',
      content_html: body.content_html ?? null,
      word_count: wordCount,
      note_type: body.note_type ?? 'concept',
      tags: body.tags ?? [],
      frontmatter: body.frontmatter ?? {},
      sources: body.sources ?? [],
      confidence: body.confidence ?? 'medium',
      quality: body.quality ?? 'draft',
      ai_optimized: body.ai_optimized ?? false,
      obsidian_source: body.obsidian_source ?? null,
      obsidian_mtime: body.obsidian_mtime ? new Date(body.obsidian_mtime).toISOString() : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
