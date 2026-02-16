/**
 * Agency Tree API
 * Phase 91: Return agency hierarchy tree
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getAgencyTree,
  getChildAgencies,
  getAgencyLicense,
  rollUpToParent
} from '@/lib/franchise';

export async function GET(req: NextRequest) {
  try {
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

    const agencyId = req.nextUrl.searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to agency
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('agency_users')
      .select('role')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to view this agency' },
        { status: 403 }
      );
    }

    // Get full tree
    const tree = await getAgencyTree(agencyId);

    // Get license details
    const license = await getAgencyLicense(agencyId);

    // Get children with details
    const children = await getChildAgencies(agencyId);

    // Get rollup if has children
    let rollup = null;
    if (children.length > 0) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      rollup = await rollUpToParent(agencyId, periodStart, periodEnd);
    }

    return NextResponse.json({
      success: true,
      tree,
      license,
      children,
      rollup,
    });
  } catch (error: unknown) {
    console.error('Agency tree error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
