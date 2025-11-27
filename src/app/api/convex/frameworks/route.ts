/**
 * API Route: /api/convex/frameworks
 *
 * Handles custom framework operations:
 * - GET: List frameworks, get framework details
 * - POST: Create new framework
 * - PATCH: Update framework
 * - DELETE: Remove framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';
import {
  createCustomFramework,
  getCustomFramework,
  listCustomFrameworks,
  updateCustomFramework,
  deleteCustomFramework,
  publishFramework,
  validateFramework,
  getFrameworkMetrics,
} from '@/lib/convex/framework-builder';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const frameworkId = req.nextUrl.searchParams.get('id');
    const action = req.nextUrl.searchParams.get('action');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Get metrics for specific framework
    if (action === 'metrics' && frameworkId) {
      const metrics = await getFrameworkMetrics(frameworkId, workspaceId);
      return NextResponse.json(metrics);
    }

    // Get specific framework
    if (frameworkId) {
      const framework = await getCustomFramework(frameworkId, workspaceId);

      if (!framework) {
        return NextResponse.json(
          { error: 'Framework not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(framework);
    }

    // List all frameworks
    const frameworks = await listCustomFrameworks(workspaceId, limit, offset);

    return NextResponse.json({
      frameworks,
      total: frameworks.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[FRAMEWORKS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const {
      workspaceId,
      name,
      description,
      framework_type,
      components,
      rules,
      reasoning_patterns,
      action,
      frameworkId,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (action === 'publish') {
      // Publish framework
      if (!frameworkId) {
        return NextResponse.json(
          { error: 'Missing frameworkId' },
          { status: 400 }
        );
      }

      const framework = await publishFramework(frameworkId, workspaceId, userId);

      if (!framework) {
        return NextResponse.json(
          { error: 'Failed to publish framework' },
          { status: 500 }
        );
      }

      logger.info(`[FRAMEWORKS] Framework published: ${frameworkId}`);
      return NextResponse.json(framework);
    }

    // Create new framework
    if (!name || !components) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate framework
    const validation = validateFramework({
      components,
      rules,
      reasoning_patterns,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Framework validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const framework = await createCustomFramework(
      workspaceId,
      userId,
      name,
      description || '',
      framework_type || 'custom',
      components,
      rules,
      reasoning_patterns
    );

    if (!framework) {
      return NextResponse.json(
        { error: 'Failed to create framework' },
        { status: 500 }
      );
    }

    logger.info(`[FRAMEWORKS] Framework created: ${name}`);
    return NextResponse.json(framework, { status: 201 });
  } catch (error) {
    logger.error('[FRAMEWORKS] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const {
      workspaceId,
      frameworkId,
      name,
      description,
      components,
      rules,
      reasoning_patterns,
      is_public,
    } = body;

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate if components changed
    if (components) {
      const validation = validateFramework({
        components,
        rules,
        reasoning_patterns,
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Framework validation failed',
            details: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    const framework = await updateCustomFramework(
      frameworkId,
      workspaceId,
      userId,
      {
        name,
        description,
        components,
        rules,
        reasoning_patterns,
        is_public,
      }
    );

    if (!framework) {
      return NextResponse.json(
        { error: 'Failed to update framework' },
        { status: 500 }
      );
    }

    logger.info(`[FRAMEWORKS] Framework updated: ${frameworkId}`);
    return NextResponse.json(framework);
  } catch (error) {
    logger.error('[FRAMEWORKS] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const { workspaceId, frameworkId } = body;

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || orgData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can delete frameworks' },
        { status: 403 }
      );
    }

    const success = await deleteCustomFramework(
      frameworkId,
      workspaceId,
      userId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete framework' },
        { status: 500 }
      );
    }

    logger.info(`[FRAMEWORKS] Framework deleted: ${frameworkId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[FRAMEWORKS] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
