/**
 * Website Preview API Route
 *
 * GET /api/synthex/preview - Get latest preview for tenant
 * POST /api/synthex/preview - Generate new preview
 * PATCH /api/synthex/preview - Approve or request revision
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  generateWebsitePreview,
  getLatestPreview,
  approvePreview,
  requestPreviewRevision,
} from '@/lib/synthex/preview-generator';

// ============================================================================
// GET /api/synthex/preview - Get latest preview for a tenant
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    // Verify user owns this tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    const preview = await getLatestPreview(tenantId);

    if (!preview) {
      return NextResponse.json({ preview: null, message: 'No preview generated yet' });
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('GET /api/synthex/preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/synthex/preview - Generate new preview
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, forceRegenerate, customPromptHints, colorOverrides } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing required field: tenantId' }, { status: 400 });
    }

    // Verify user owns this tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    // Generate preview
    const preview = await generateWebsitePreview(tenantId, {
      forceRegenerate: forceRegenerate ?? false,
      customPromptHints,
      colorOverrides,
    });

    return NextResponse.json({ preview, success: true });
  } catch (error) {
    console.error('POST /api/synthex/preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/synthex/preview - Approve or request revision
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { previewId, action, revisionNotes } = body;

    if (!previewId || !action) {
      return NextResponse.json({ error: 'Missing required fields: previewId, action' }, { status: 400 });
    }

    if (!['approve', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "request_revision"' }, { status: 400 });
    }

    // Verify user owns the tenant that owns this preview
    const { data: previewData, error: previewError } = await supabase
      .from('synthex_website_previews')
      .select('tenant_id')
      .eq('id', previewId)
      .single();

    if (previewError || !previewData) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', previewData.tenant_id)
      .eq('owner_user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Unauthorized to modify this preview' }, { status: 403 });
    }

    let preview;

    if (action === 'approve') {
      preview = await approvePreview(previewId);
    } else {
      if (!revisionNotes) {
        return NextResponse.json({ error: 'Revision notes required for revision request' }, { status: 400 });
      }
      preview = await requestPreviewRevision(previewId, revisionNotes);
    }

    return NextResponse.json({ preview, success: true });
  } catch (error) {
    console.error('PATCH /api/synthex/preview error:', error);
    return NextResponse.json(
      { error: 'Failed to update preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
