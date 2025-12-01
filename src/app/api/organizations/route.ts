import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Get userId from query params
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Verify auth token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin client to bypass RLS
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the token is valid (optional security check)
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: userError } = await supabaseBrowser.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user organizations using service role
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('id, org_id, role, joined_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (userOrgsError) {
      console.error('[API] User organizations fetch error:', userOrgsError);
      return NextResponse.json({ error: userOrgsError.message }, { status: 500 });
    }

    if (!userOrgs || userOrgs.length === 0) {
      return NextResponse.json([]);
    }

    // Get organization details for each org_id
    const orgIds = userOrgs.map((uo: any) => uo.org_id);
    console.log('[API] Fetching org details for IDs:', orgIds);

    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    if (orgsError) {
      console.error('[API] Organizations details fetch error:', orgsError);
      // Continue with limited data
    } else {
      console.log('[API] Organizations data fetched:', orgsData);
    }

    // Combine the data
    const orgs = userOrgs.map((userOrg: any) => ({
      id: userOrg.id,
      org_id: userOrg.org_id,
      role: userOrg.role,
      organization: orgsData?.find((o: any) => o.id === userOrg.org_id) || {
        id: userOrg.org_id,
        name: 'Unknown Organization',
        logo_url: null
      }
    }));

    return NextResponse.json(orgs);
  } catch (error) {
    console.error('[API] Organizations route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
