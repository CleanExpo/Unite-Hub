/**
 * Create Agency API
 * Phase 90: Create a new agency tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createAgency } from '@/lib/tenancy';
import { withErrorBoundary } from '@/lib/error-boundary';
import { strictRateLimit } from '@/lib/rate-limit';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Strict rate limit for agency creation (sensitive operation)
  const rateLimitResult = await strictRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let userId: string;

  if (token) {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = data.user.id;
  } else {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = data.user.id;
  }

  const body = await req.json();

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: 'name and slug are required' },
      { status: 400 }
    );
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json(
      { error: 'slug must be lowercase alphanumeric with hyphens only' },
      { status: 400 }
    );
  }

  const agency = await createAgency(
    {
      name: body.name,
      slug: body.slug,
      parentAgencyId: body.parentAgencyId,
      settings: body.settings,
    },
    userId
  );

  return NextResponse.json({
    success: true,
    agency,
  });
});
