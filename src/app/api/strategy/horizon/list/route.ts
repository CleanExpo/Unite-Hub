/**
 * GET /api/strategy/horizon/list
 * List horizon plans for an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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

    const organizationId = req.nextUrl.searchParams.get('organization_id');
    const status = req.nextUrl.searchParams.get('status');
    const horizonType = req.nextUrl.searchParams.get('horizon_type');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('horizon_plans')
      .select(`
        *,
        horizon_steps (count)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (horizonType) {
      query = query.eq('horizon_type', horizonType);
    }

    const { data: plans, error } = await query;

    if (error) {
      throw new Error(`Failed to list plans: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
      total: plans?.length || 0,
    });
  } catch (error) {
    console.error('Horizon list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list horizon plans' },
      { status: 500 }
    );
  }
}
