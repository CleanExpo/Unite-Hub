/**
 * Feature Flags API
 * Phase: D69
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listFeatureFlags,
  createFeatureFlag,
  getFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  evaluateFlag,
  evaluateFlags,
} from '@/lib/unite/featureFlagService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const filters = {
      tenant_id: tenantId || undefined,
      is_active: request.nextUrl.searchParams.get('is_active') === 'true' ? true : undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const flags = await listFeatureFlags(filters);
    return NextResponse.json({ flags });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Evaluate flag
    if (action === 'evaluate') {
      const { flag_key, context } = body;
      if (!flag_key || !context) {
        return NextResponse.json(
          { error: 'flag_key and context required' },
          { status: 400 }
        );
      }

      const result = await evaluateFlag(flag_key, context);
      return NextResponse.json(result);
    }

    // Batch evaluate flags
    if (action === 'evaluate_batch') {
      const { flag_keys, context } = body;
      if (!flag_keys || !Array.isArray(flag_keys) || !context) {
        return NextResponse.json(
          { error: 'flag_keys array and context required' },
          { status: 400 }
        );
      }

      const results = await evaluateFlags(flag_keys, context);
      return NextResponse.json(results);
    }

    // Update existing flag
    if (action === 'update') {
      const { flag_key, ...updates } = body;
      if (!flag_key) {
        return NextResponse.json({ error: 'flag_key required' }, { status: 400 });
      }

      const flag = await updateFeatureFlag(flag_key, updates);
      return NextResponse.json({ flag });
    }

    // Delete flag
    if (action === 'delete') {
      const { flag_key } = body;
      if (!flag_key) {
        return NextResponse.json({ error: 'flag_key required' }, { status: 400 });
      }

      await deleteFeatureFlag(flag_key);
      return NextResponse.json({ success: true });
    }

    // Create new flag
    const flag = await createFeatureFlag({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
