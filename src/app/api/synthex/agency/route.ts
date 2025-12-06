/**
 * Synthex Agency API
 * Phase B32: Agency Multi-Workspace + Brand Switcher
 *
 * GET  - List agencies for current user
 * POST - Create a new agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserAgencies,
  createAgency,
  getAgencyPortfolioSummary,
} from '@/lib/synthex/agencyWorkspaceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agencyId = searchParams.get('agencyId');

    // Get portfolio summary for a specific agency
    if (action === 'portfolio' && agencyId) {
      const portfolio = await getAgencyPortfolioSummary(agencyId);
      return NextResponse.json({ portfolio });
    }

    // List all agencies for the current user
    const agencies = await getUserAgencies(user.id);

    return NextResponse.json({
      agencies,
      count: agencies.length,
    });
  } catch (error) {
    console.error('Error in agency GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Agency name is required' },
        { status: 400 }
      );
    }

    const agency = await createAgency(user.id, name, description);

    return NextResponse.json({ agency }, { status: 201 });
  } catch (error) {
    console.error('Error in agency POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
