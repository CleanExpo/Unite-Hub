import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as apiKeyService from '@/lib/security/apiKeyService';

/**
 * GET /api/security/api-keys
 * List all API keys for a tenant
 */
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

    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const apiKeys = await apiKeyService.listApiKeys(tenantId);

    return NextResponse.json({ items: apiKeys });
  } catch (error: any) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/api-keys
 * Create a new API key
 */
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
    const { tenantId, name, scopes } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'tenantId and name required' },
        { status: 400 }
      );
    }

    const result = await apiKeyService.createApiKey({
      tenantId,
      name,
      scopes: scopes || [],
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apiKey: result.apiKey,
      rawKey: result.rawKey, // Only returned once!
      warning: 'Save this key now - it will not be shown again',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/security/api-keys
 * Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const keyId = request.nextUrl.searchParams.get('keyId');

    if (!tenantId || !keyId) {
      return NextResponse.json(
        { error: 'tenantId and keyId required' },
        { status: 400 }
      );
    }

    const revokedKey = await apiKeyService.revokeApiKey(tenantId, keyId, user.id);

    if (!revokedKey) {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: revokedKey });
  } catch (error: any) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
