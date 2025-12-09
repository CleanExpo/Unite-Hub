/**
 * Synthex API Keys API
 * Phase B43: Governance, Audit Logging & Export
 *
 * GET - List API keys
 * POST - Create new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listApiKeys, createApiKey } from '@/lib/synthex/auditService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const keys = await listApiKeys(tenantId, includeRevoked);

    // Remove sensitive hash from response
    const sanitizedKeys = keys.map(({ ...key }) => ({
      ...key,
      key_hash: undefined,
    }));

    return NextResponse.json({
      keys: sanitizedKeys,
      count: keys.length,
    });
  } catch (error) {
    console.error('Error in api-keys GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      name,
      description,
      permissions,
      allowed_origins,
      rate_limit_per_minute,
      expires_in_days,
    } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'tenantId and name are required' },
        { status: 400 }
      );
    }

    const result = await createApiKey(tenantId, user.id, {
      name,
      description,
      permissions,
      allowed_origins,
      rate_limit_per_minute,
      expires_in_days,
    });

    // Return the key and plain text key (only shown once)
    return NextResponse.json(
      {
        key: {
          ...result.apiKey,
          key_hash: undefined,
        },
        plainTextKey: result.plainTextKey,
        warning: 'Save this key now. It will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in api-keys POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
