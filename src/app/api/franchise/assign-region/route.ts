/**
 * Assign Region API
 * Phase 91: Assign region + tier to an agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { assignRegion, validateParentAccess } from '@/lib/franchise';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { agencyId, regionId, tierId, expiresOn } = body;

    if (!agencyId || !regionId || !tierId || !expiresOn) {
      return NextResponse.json(
        { error: 'agencyId, regionId, tierId, and expiresOn are required' },
        { status: 400 }
      );
    }

    // Check if user is owner of the agency or its parent
    const supabase = await getSupabaseServer();

    // Check direct ownership
    const { data: directOwnership } = await supabase
      .from('agency_users')
      .select('role')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .eq('role', 'owner')
      .single();

    if (!directOwnership) {
      // Check parent ownership
      const { data: agency } = await supabase
        .from('agencies')
        .select('parent_agency_id')
        .eq('id', agencyId)
        .single();

      if (agency?.parent_agency_id) {
        const { data: parentOwnership } = await supabase
          .from('agency_users')
          .select('role')
          .eq('user_id', userId)
          .eq('agency_id', agency.parent_agency_id)
          .eq('role', 'owner')
          .single();

        if (!parentOwnership) {
          return NextResponse.json(
            { error: 'Not authorized to assign region to this agency' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Not authorized to assign region to this agency' },
          { status: 403 }
        );
      }
    }

    const license = await assignRegion({
      agencyId,
      regionId,
      tierId,
      expiresOn,
    });

    return NextResponse.json({
      success: true,
      license,
    });
  } catch (error: any) {
    console.error('Assign region error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
