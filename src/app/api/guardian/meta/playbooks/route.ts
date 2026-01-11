import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET /api/guardian/meta/playbooks
 * Fetch playbooks for workspace, with optional filtering
 * Query params: workspaceId, domain, complexity
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
return errorResponse('workspaceId required', 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const domain = req.nextUrl.searchParams.get('domain');
  const complexity = req.nextUrl.searchParams.get('complexity');

  const supabase = await createClient();

  let query = supabase
    .from('guardian_playbooks')
    .select(`
      id,
      key,
      title,
      summary,
      complexity,
      category,
      is_global,
      is_active,
      estimated_duration_minutes,
      metadata,
      guardian_playbook_tags (tag_key, source_domain),
      guardian_playbook_sections (id, order_index, heading)
    `)
    .eq('is_active', true);

  if (domain) {
query = query.eq('category', domain);
}
  if (complexity) {
query = query.eq('complexity', complexity);
}

  const { data, error } = await query;
  if (error) {
throw error;
}

  return successResponse({ playbooks: data || [] });
});

/**
 * POST /api/guardian/meta/playbooks
 * Create a new playbook with sections and tags
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
return errorResponse('workspaceId required', 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { key, title, summary, category, complexity, sections, tags } = body;

  // Validate required fields
  if (!key || !title || !summary || !category) {
    return errorResponse(
      'Missing required fields: key, title, summary, category',
      400
    );
  }

  const supabase = await createClient();

  // Create playbook
  const { data: playbook, error: playbookError } = await supabase
    .from('guardian_playbooks')
    .insert([
      {
        tenant_id: workspaceId,
        key,
        title,
        summary,
        category,
        complexity: complexity || 'medium',
        is_global: false,
        is_active: true,
      },
    ])
    .select('*')
    .single();

  if (playbookError) {
throw playbookError;
}

  // Create sections if provided
  if (sections && Array.isArray(sections)) {
    const sectionRows = sections.map((s: any, idx: number) => ({
      playbook_id: playbook.id,
      order_index: idx,
      heading: s.heading,
      body: s.body,
      section_type: s.section_type || 'guide',
    }));
    const { error: sectionsError } = await supabase
      .from('guardian_playbook_sections')
      .insert(sectionRows);
    if (sectionsError) {
throw sectionsError;
}
  }

  // Create tags if provided
  if (tags && Array.isArray(tags)) {
    const tagRows = tags.map((t: any) => ({
      playbook_id: playbook.id,
      tag_key: t.tag_key,
      source_domain: t.source_domain,
    }));
    const { error: tagsError } = await supabase
      .from('guardian_playbook_tags')
      .insert(tagRows);
    if (tagsError) {
throw tagsError;
}
  }

  return successResponse({ playbook }, { status: 201 });
});
