import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { getBusiness } from '@/lib/founderOS/founderBusinessRegistryService';
import {
  getSecrets,
  addSecret,
  type SecretType,
} from '@/lib/founderOS/founderBusinessVaultService';

/**
 * GET /api/founder-os/businesses/[id]/vault
 * List vault entries for a business (metadata only, not secret values)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/vault] GET request for business:', businessId);

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

    // Verify business ownership
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const secretType = req.nextUrl.searchParams.get('type') as SecretType | undefined;

    // Get secrets (full data for now - consider redacting payload in production)
    const result = await getSecrets(businessId, secretType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return secrets with payload redacted (only metadata)
    const secretsMetadata = (result.data || []).map((secret) => ({
      id: secret.id,
      secret_label: secret.secret_label,
      secret_type: secret.secret_type,
      metadata: secret.metadata,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
      // Do NOT return secret_payload in list view
    }));

    console.log('[founder-os/businesses/[id]/vault] Retrieved', secretsMetadata.length, 'secrets');

    return NextResponse.json({
      success: true,
      secrets: secretsMetadata,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/vault] GET error:', error);
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
 * POST /api/founder-os/businesses/[id]/vault
 * Add a secret to the business vault
 *
 * NOTE: Secrets are stored as-is. For production, implement encryption
 * at the application level before calling this endpoint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/vault] POST request for business:', businessId);

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

    // Verify business ownership
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { label, type, payload, metadata } = body;

    // Validate required fields
    if (!label || !type || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: label, type, payload' },
        { status: 400 }
      );
    }

    // Add the secret
    const result = await addSecret(businessId, label, type, payload, metadata);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[founder-os/businesses/[id]/vault] Secret created:', result.data?.id);

    // Return created secret without payload for security
    const responseSecret = result.data
      ? {
          id: result.data.id,
          secret_label: result.data.secret_label,
          secret_type: result.data.secret_type,
          metadata: result.data.metadata,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
        }
      : null;

    return NextResponse.json({
      success: true,
      secret: responseSecret,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/vault] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
