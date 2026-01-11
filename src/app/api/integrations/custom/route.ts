/**
 * Custom Integrations API (Elite Tier Only)
 * Manage custom webhooks, REST APIs, and third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { customIntegrationFramework } from '@/lib/integrations/custom-integration-framework';
import { getSupabaseServer } from '@/lib/supabase';

// Verify Elite tier access
async function verifyEliteTier(workspaceId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .single();

  return subscription?.tier === 'elite';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const isElite = await verifyEliteTier(workspaceId);
    if (!isElite) {
      return NextResponse.json({
        error: 'Custom integrations are only available for Elite tier'
      }, { status: 403 });
    }

    const integrations = await customIntegrationFramework.getIntegrations(workspaceId);

    return NextResponse.json({
      success: true,
      integrations
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch integrations'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, name, type, config, description } = body;

    if (!workspaceId || !name || !type || !config) {
      return NextResponse.json({
        error: 'workspaceId, name, type, and config are required'
      }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const isElite = await verifyEliteTier(workspaceId);
    if (!isElite) {
      return NextResponse.json({
        error: 'Custom integrations are only available for Elite tier'
      }, { status: 403 });
    }

    const integration = await customIntegrationFramework.createIntegration({
      workspace_id: workspaceId,
      name,
      type,
      config,
      description,
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      integration
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create integration:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create integration'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');
    const integrationId = searchParams.get('integrationId');

    if (!workspaceId || !integrationId) {
      return NextResponse.json({
        error: 'workspaceId and integrationId are required'
      }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const isElite = await verifyEliteTier(workspaceId);
    if (!isElite) {
      return NextResponse.json({
        error: 'Custom integrations are only available for Elite tier'
      }, { status: 403 });
    }

    await customIntegrationFramework.deleteIntegration(integrationId, workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to delete integration:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete integration'
    }, { status: 500 });
  }
}
