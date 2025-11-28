import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  listBusinesses,
  createBusiness,
  type CreateBusinessInput,
} from '@/lib/founderOS/founderBusinessRegistryService';

/**
 * GET /api/founder-os/businesses
 * List all businesses for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/businesses] GET request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      console.log('[founder-os/businesses] Rate limit exceeded');
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        console.error('[founder-os/businesses] Token validation error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        console.error('[founder-os/businesses] Cookie auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get query parameters
    const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true';

    // List businesses
    const result = await listBusinesses(userId, includeInactive);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/businesses] Retrieved', result.data?.length || 0, 'businesses');

    return NextResponse.json({
      success: true,
      businesses: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/businesses] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder-os/businesses
 * Register a new business for the authenticated founder
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/businesses] POST request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      console.log('[founder-os/businesses] Rate limit exceeded');
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        console.error('[founder-os/businesses] Token validation error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        console.error('[founder-os/businesses] Cookie auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('[founder-os/businesses] Request body fields:', Object.keys(body));

    const { code, display_name, description, industry, region, primary_domain } = body;

    // Validate required fields
    if (!code || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: code, display_name' },
        { status: 400 }
      );
    }

    // Create business input
    const businessData: CreateBusinessInput = {
      code,
      display_name,
      description,
      industry,
      region,
      primary_domain,
    };

    // Create the business
    const result = await createBusiness(userId, businessData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[founder-os/businesses] Business created:', result.data?.id);

    return NextResponse.json({
      success: true,
      business: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
