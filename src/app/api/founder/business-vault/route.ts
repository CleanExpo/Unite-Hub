import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listFounderBusinesses,
  upsertBusinessProfile,
  getPortfolioStats
} from '@/lib/founder/businessVaultService';

/**
 * GET /api/founder/business-vault
 * List all businesses for the current founder
 * Optional: ?stats=true to include portfolio statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get('stats') === 'true';

    if (includeStats) {
      const stats = await getPortfolioStats();
      return NextResponse.json({ success: true, ...stats });
    }

    const businesses = await listFounderBusinesses();
    return NextResponse.json({ success: true, businesses });
  } catch (error) {
    console.error('[business-vault] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder/business-vault
 * Create or update a business profile
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.business_key || !body.display_name) {
      return NextResponse.json(
        { success: false, error: 'business_key and display_name are required' },
        { status: 400 }
      );
    }

    const business = await upsertBusinessProfile({
      business_key: body.business_key,
      display_name: body.display_name,
      legal_name: body.legal_name,
      primary_domain: body.primary_domain,
      primary_gmb_location: body.primary_gmb_location,
      primary_region: body.primary_region,
      industry: body.industry,
      notes: body.notes
    });

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error('[business-vault] POST error:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save business' },
      { status: 500 }
    );
  }
}
