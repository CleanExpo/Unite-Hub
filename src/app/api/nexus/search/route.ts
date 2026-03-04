/**
 * GET /api/nexus/search?q=term&limit=10
 * Semantic search across NEXUS pages and databases using PostgreSQL full-text search.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

interface PageResult {
  id: string;
  title: string;
  icon: string | null;
  page_type: string;
  updated_at: string;
  snippet: string;
}

interface DatabaseResult {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

function extractSnippet(body: unknown, maxLen = 120): string {
  if (!body) return '';
  try {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    // Strip JSON syntax noise
    const clean = text
      .replace(/[{}\[\]"]/g, ' ')
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean;
  } catch {
    return '';
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    if (!q || q.length < 1) {
      return NextResponse.json({ pages: [], databases: [] });
    }

    // Search pages — use ilike for partial matching (more forgiving than full-text)
    const likePattern = `%${q}%`;

    const { data: pages, error: pagesError } = await supabase
      .from('nexus_pages')
      .select('id, title, icon, page_type, updated_at, body')
      .eq('owner_id', user.id)
      .is('archived_at', null)
      .or(`title.ilike.${likePattern}`)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (pagesError) throw pagesError;

    // Also search body content via a secondary query if fewer results
    let bodyPages: typeof pages = [];
    if ((pages?.length ?? 0) < limit) {
      const pageIds = new Set((pages ?? []).map((p) => p.id));
      const { data: bodyResults } = await supabase
        .from('nexus_pages')
        .select('id, title, icon, page_type, updated_at, body')
        .eq('owner_id', user.id)
        .is('archived_at', null)
        .ilike('body', likePattern)
        .order('updated_at', { ascending: false })
        .limit(limit);

      bodyPages = (bodyResults ?? []).filter((p) => !pageIds.has(p.id));
    }

    const allPages = [...(pages ?? []), ...bodyPages].slice(0, limit);

    const pageResults: PageResult[] = allPages.map((p) => ({
      id: p.id,
      title: p.title || 'Untitled',
      icon: p.icon,
      page_type: p.page_type,
      updated_at: p.updated_at,
      snippet: extractSnippet(p.body),
    }));

    // Search databases — name and description
    const { data: databases, error: dbError } = await supabase
      .from('nexus_databases')
      .select('id, name, icon, description')
      .or(`name.ilike.${likePattern},description.ilike.${likePattern}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) throw dbError;

    const dbResults: DatabaseResult[] = (databases ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      icon: d.icon,
      description: d.description,
    }));

    return NextResponse.json({ pages: pageResults, databases: dbResults });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/nexus/search]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
