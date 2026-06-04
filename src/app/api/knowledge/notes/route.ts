// GET /api/knowledge/notes - list founder-scoped knowledge notes.

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
