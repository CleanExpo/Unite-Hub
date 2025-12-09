/**
 * Search Reindex API
 *
 * Phase: D58 - Global Search & Knowledge Graph
 *
 * Routes:
 * - POST /api/unite/search/reindex - Reindex all entities of a type
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reindexAllEntities } from '@/lib/unite/searchService';

// =============================================================================
// POST - Reindex entities
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { entity_type } = body;

    if (!entity_type) {
      return NextResponse.json({ error: 'entity_type is required' }, { status: 400 });
    }

    const count = await reindexAllEntities(tenantId, entity_type);

    return NextResponse.json({
      success: true,
      entity_type,
      count,
      message: `Reindexed ${count} entities of type ${entity_type}`,
    });
  } catch (error: unknown) {
    console.error('POST /api/unite/search/reindex error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reindex' },
      { status: 500 }
    );
  }
}
