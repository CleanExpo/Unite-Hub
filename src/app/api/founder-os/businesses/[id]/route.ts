import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getBusiness,
  updateBusiness,
  archiveBusiness,
  type UpdateBusinessInput,
} from '@/lib/founderOS/founderBusinessRegistryService';

/**
 * GET /api/founder-os/businesses/[id]
 * Get a single business by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]] GET request for business:', businessId);

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get the business
    const result = await getBusiness(businessId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Verify ownership
    if (result.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      business: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]] GET error:', error);
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
 * PUT /api/founder-os/businesses/[id]
 * Update a business
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]] PUT request for business:', businessId);

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Verify ownership before update
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const updateData: UpdateBusinessInput = {};

    // Only include fields that were provided
    if (body.code !== undefined) {
updateData.code = body.code;
}
    if (body.display_name !== undefined) {
updateData.display_name = body.display_name;
}
    if (body.description !== undefined) {
updateData.description = body.description;
}
    if (body.industry !== undefined) {
updateData.industry = body.industry;
}
    if (body.region !== undefined) {
updateData.region = body.region;
}
    if (body.primary_domain !== undefined) {
updateData.primary_domain = body.primary_domain;
}
    if (body.status !== undefined) {
updateData.status = body.status;
}

    // Update the business
    const result = await updateBusiness(businessId, updateData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[founder-os/businesses/[id]] Business updated:', businessId);

    return NextResponse.json({
      success: true,
      business: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]] PUT error:', error);
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
 * DELETE /api/founder-os/businesses/[id]
 * Archive a business (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]] DELETE request for business:', businessId);

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Verify ownership before delete
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Archive the business
    const result = await archiveBusiness(businessId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/businesses/[id]] Business archived:', businessId);

    return NextResponse.json({
      success: true,
      business: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]] DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
