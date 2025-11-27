/**
 * API Route: /api/convex/framework-versions
 *
 * Handles framework versioning operations:
 * - GET: List versions, get version details, compare versions
 * - POST: Save new version, restore version
 * - DELETE: Remove version (if not current)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

interface FrameworkVersion {
  id: string;
  framework_id: string;
  version_number: number;
  name: string;
  description: string;
  framework_state: any;
  change_summary: string;
  created_by: string;
  created_at: string;
  component_count: number;
  rule_count: number;
  pattern_count: number;
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const frameworkId = req.nextUrl.searchParams.get('frameworkId');
    const versionId = req.nextUrl.searchParams.get('versionId');
    const action = req.nextUrl.searchParams.get('action') || 'list';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing workspaceId or frameworkId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'list') {
      // List all versions for framework
      const { data, error } = await supabase
        .from('convex_framework_versions')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('version_number', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('[VERSIONS] List error:', error);
        return NextResponse.json(
          { error: 'Failed to list versions' },
          { status: 500 }
        );
      }

      const total = await supabase
        .from('convex_framework_versions')
        .select('id', { count: 'exact' })
        .eq('framework_id', frameworkId)
        .then((r) => r.count || 0);

      logger.info(`[VERSIONS] Listed ${data?.length || 0} versions`);

      return NextResponse.json({
        versions: data || [],
        total,
        limit,
        offset,
      });
    }

    if (action === 'get' && versionId) {
      // Get specific version
      const { data, error } = await supabase
        .from('convex_framework_versions')
        .select('*')
        .eq('id', versionId)
        .eq('framework_id', frameworkId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[VERSIONS] GET error:', error);
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
    const { workspaceId, frameworkId, action, label, description, versionId, versionNumber } = body;

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing workspaceId or frameworkId' },
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

    if (action === 'saveVersion') {
      // Save current framework as new version
      // Get current framework
      const { data: framework, error: fwError } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .single();

      if (fwError || !framework) {
        return NextResponse.json(
          { error: 'Framework not found' },
          { status: 404 }
        );
      }

      // Get next version number
      const { data: lastVersion } = await supabase
        .from('convex_framework_versions')
        .select('version_number')
        .eq('framework_id', frameworkId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = (lastVersion?.version_number || 0) + 1;

      // Create version entry
      const { data: version, error: versionError } = await supabase
        .from('convex_framework_versions')
        .insert([
          {
            framework_id: frameworkId,
            version_number: nextVersionNumber,
            name: label || `Version ${nextVersionNumber}`,
            description: description || '',
            framework_state: framework,
            change_summary: description || 'Updated framework',
            created_by: userId,
            component_count: framework.components?.length || 0,
            rule_count: framework.rules?.length || 0,
            pattern_count: framework.reasoning_patterns?.length || 0,
          },
        ])
        .select()
        .single();

      if (versionError) {
        logger.error('[VERSIONS] Save version error:', versionError);
        return NextResponse.json(
          { error: 'Failed to save version' },
          { status: 500 }
        );
      }

      logger.info(`[VERSIONS] Version saved: v${nextVersionNumber}`);
      return NextResponse.json(version, { status: 201 });
    }

    if (action === 'restore') {
      // Restore previous version
      if (!versionId) {
        return NextResponse.json(
          { error: 'Missing versionId' },
          { status: 400 }
        );
      }

      // Get version to restore
      const { data: versionToRestore, error: getError } = await supabase
        .from('convex_framework_versions')
        .select('*')
        .eq('id', versionId)
        .eq('framework_id', frameworkId)
        .single();

      if (getError || !versionToRestore) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      // Save current as backup
      const { data: currentFramework } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .single();

      if (currentFramework) {
        const { data: lastVersion } = await supabase
          .from('convex_framework_versions')
          .select('version_number')
          .eq('framework_id', frameworkId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        const nextVersionNumber = (lastVersion?.version_number || 0) + 1;

        await supabase.from('convex_framework_versions').insert([
          {
            framework_id: frameworkId,
            version_number: nextVersionNumber,
            name: 'Backup before restore',
            description: `Backup before restoring to v${versionToRestore.version_number}`,
            framework_state: currentFramework,
            change_summary: `Restored from v${versionToRestore.version_number}`,
            created_by: userId,
            component_count: currentFramework.components?.length || 0,
            rule_count: currentFramework.rules?.length || 0,
            pattern_count: currentFramework.reasoning_patterns?.length || 0,
          },
        ]);
      }

      // Restore version
      const { data: restored, error: restoreError } = await supabase
        .from('convex_custom_frameworks')
        .update({
          components: versionToRestore.framework_state.components,
          rules: versionToRestore.framework_state.rules,
          reasoning_patterns: versionToRestore.framework_state.reasoning_patterns,
          updated_at: new Date().toISOString(),
        })
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (restoreError) {
        logger.error('[VERSIONS] Restore error:', restoreError);
        return NextResponse.json(
          { error: 'Failed to restore version' },
          { status: 500 }
        );
      }

      logger.info(`[VERSIONS] Restored to v${versionToRestore.version_number}`);
      return NextResponse.json(restored);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[VERSIONS] POST error:', error);
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
    const { workspaceId, versionId } = body;

    if (!workspaceId || !versionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access (owner only)
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || orgData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can delete versions' },
        { status: 403 }
      );
    }

    // Delete version
    const { error } = await supabase
      .from('convex_framework_versions')
      .delete()
      .eq('id', versionId);

    if (error) {
      logger.error('[VERSIONS] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete version' },
        { status: 500 }
      );
    }

    logger.info(`[VERSIONS] Version deleted: ${versionId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[VERSIONS] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
