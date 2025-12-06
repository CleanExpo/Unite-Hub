/**
 * Synthex Integrations API
 * GET: List all integrations for a tenant
 * POST: Create or update an integration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listIntegrations,
  upsertIntegration,
  UpsertIntegrationInput,
} from '@/lib/synthex/integrationHubService';

export const dynamic = 'force-dynamic';

// GET /api/synthex/integrations?tenantId=xxx&provider=resend&channel=email&status=connected
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const provider = searchParams.get('provider');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    const filters: { provider?: string; channel?: string; status?: string } = {};
    if (provider) filters.provider = provider;
    if (channel) filters.channel = channel;
    if (status) filters.status = status;

    const result = await listIntegrations(tenantId, filters);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list integrations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integrations: result.data || [],
    });
  } catch (error) {
    console.error('[API] GET /api/synthex/integrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/synthex/integrations
// Body: { tenantId, provider, channel, displayName?, status?, config?, metadata? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, ...input } = body as { tenantId: string } & UpsertIntegrationInput;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId in request body' },
        { status: 400 }
      );
    }

    if (!input.provider || !input.channel) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, channel' },
        { status: 400 }
      );
    }

    const result = await upsertIntegration(tenantId, input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upsert integration' },
        { status: 500 }
      );
    }

    // Never expose sensitive fields like access tokens
    return NextResponse.json({
      success: true,
      integration: result.data,
    });
  } catch (error) {
    console.error('[API] POST /api/synthex/integrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
