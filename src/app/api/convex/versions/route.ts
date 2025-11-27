/**
 * API Route: /api/convex/versions
 *
 * Handles strategy version operations:
 * - GET: Fetch version history, get specific version, compare versions
 * - POST: Save new version, restore previous version
 * - DELETE: Remove a version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const strategyId = req.nextUrl.searchParams.get('strategyId');
    const versionNumber = req.nextUrl.searchParams.get('version');
    const compareWith = req.nextUrl.searchParams.get('compareWith');

    if (!workspaceId || !strategyId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get specific version
    if (versionNumber) {
      const { data, error } = await supabase
        .from('convex_strategy_versions')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('workspace_id', workspaceId)
        .eq('version', parseInt(versionNumber))
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    // Compare two versions
    if (compareWith) {
      const v1 = versionNumber ? parseInt(versionNumber) : undefined;
      const v2 = parseInt(compareWith);

      if (!v1) {
        return NextResponse.json(
          { error: 'Missing version parameter for comparison' },
          { status: 400 }
        );
      }

      const [version1Data, version2Data] = await Promise.all([
        supabase
          .from('convex_strategy_versions')
          .select('*')
          .eq('strategy_id', strategyId)
          .eq('workspace_id', workspaceId)
          .eq('version', v1)
          .single(),
        supabase
          .from('convex_strategy_versions')
          .select('*')
          .eq('strategy_id', strategyId)
          .eq('workspace_id', workspaceId)
          .eq('version', v2)
          .single(),
      ]);

      if (version1Data.error || !version1Data.data || version2Data.error || !version2Data.data) {
        return NextResponse.json(
          { error: 'One or both versions not found' },
          { status: 404 }
        );
      }

      // Calculate diffs (basic implementation)
      const diffs = calculateDiffs(version1Data.data, version2Data.data);
      const similarity = calculateSimilarity(version1Data.data, version2Data.data);
      const scoreChange =
        (version2Data.data.convex_score || 0) - (version1Data.data.convex_score || 0);

      return NextResponse.json({
        version1: version1Data.data,
        version2: version2Data.data,
        diffs,
        scoreChange,
        similarityScore: similarity,
      });
    }

    // Get all versions for strategy
    const { data, error } = await supabase
      .from('convex_strategy_versions')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: false });

    if (error) {
      logger.error('[VERSIONS] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
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
    const {
      strategyId,
      workspaceId,
      title,
      description,
      strategy_content,
      convex_score,
      compliance_status,
      frameworks,
      execution_plan,
      success_metrics,
      changeSummary,
      restore,
    } = body;

    if (!strategyId || !workspaceId || !strategy_content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    if (restore) {
      // Restore from previous version
      const oldVersion = await supabase
        .from('convex_strategy_versions')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('workspace_id', workspaceId)
        .eq('version', restore)
        .single();

      if (oldVersion.error || !oldVersion.data) {
        return NextResponse.json(
          { error: 'Version to restore not found' },
          { status: 404 }
        );
      }

      // Get next version number
      const { data: lastVersion } = await supabase
        .from('convex_strategy_versions')
        .select('version')
        .eq('strategy_id', strategyId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = ((lastVersion?.version as number) || 0) + 1;

      // Create new version from old data
      const { data: newVersion, error: insertError } = await supabase
        .from('convex_strategy_versions')
        .insert([
          {
            strategy_id: strategyId,
            workspace_id: workspaceId,
            version: nextVersion,
            title: `${oldVersion.data.title} (Restored)`,
            description: oldVersion.data.description,
            strategy_content: oldVersion.data.strategy_content,
            convex_score: oldVersion.data.convex_score,
            compliance_status: oldVersion.data.compliance_status,
            frameworks: oldVersion.data.frameworks,
            execution_plan: oldVersion.data.execution_plan,
            success_metrics: oldVersion.data.success_metrics,
            change_summary: `Restored from version ${restore}. ${changeSummary || ''}`,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        logger.error('[VERSIONS] Restore error:', insertError);
        return NextResponse.json(
          { error: 'Failed to restore version' },
          { status: 500 }
        );
      }

      // Log activity
      await supabase
        .from('convex_strategy_activity')
        .insert([
          {
            strategy_id: strategyId,
            activity_type: 'restored',
            user_id: userId,
            user_name: 'User',
            description: `Restored version ${restore}`,
            metadata: { restoredVersion: restore, newVersion: nextVersion },
          },
        ]);

      logger.info(
        `[VERSIONS] Version ${restore} restored as v${nextVersion} for strategy ${strategyId}`
      );

      return NextResponse.json(newVersion, { status: 201 });
    }

    // Create new version
    const { data: lastVersion } = await supabase
      .from('convex_strategy_versions')
      .select('version')
      .eq('strategy_id', strategyId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = ((lastVersion?.version as number) || 0) + 1;

    const { data: newVersion, error: insertError } = await supabase
      .from('convex_strategy_versions')
      .insert([
        {
          strategy_id: strategyId,
          workspace_id: workspaceId,
          version: newVersionNumber,
          title: title || 'Untitled Version',
          description,
          strategy_content,
          convex_score: convex_score || 0,
          compliance_status: compliance_status || 'needs_revision',
          frameworks: frameworks || [],
          execution_plan: execution_plan || [],
          success_metrics: success_metrics || [],
          change_summary: changeSummary,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('[VERSIONS] Create error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('convex_strategy_activity')
      .insert([
        {
          strategy_id: strategyId,
          activity_type: 'updated',
          user_id: userId,
          user_name: 'User',
          description: `Created version ${newVersionNumber}`,
          metadata: { version: newVersionNumber },
        },
      ]);

    logger.info(
      `[VERSIONS] Version ${newVersionNumber} created for strategy ${strategyId}`
    );

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    logger.error('[VERSIONS] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDiffs(
  v1: any,
  v2: any
): Array<{ field: string; oldValue: any; newValue: any; changeType: string }> {
  const diffs = [];

  const scalarFields = ['title', 'convex_score', 'compliance_status'];
  scalarFields.forEach((field) => {
    if (v1[field] !== v2[field]) {
      diffs.push({
        field,
        oldValue: v1[field],
        newValue: v2[field],
        changeType: 'modified',
      });
    }
  });

  const arrayFields = ['frameworks', 'execution_plan', 'success_metrics'];
  arrayFields.forEach((field) => {
    const arr1 = v1[field] || [];
    const arr2 = v2[field] || [];

    const added = arr2.filter((item: any) => !arr1.includes(item));
    const removed = arr1.filter((item: any) => !arr2.includes(item));

    added.forEach((item: any) => {
      diffs.push({
        field: `${field}.added`,
        oldValue: undefined,
        newValue: item,
        changeType: 'added',
      });
    });

    removed.forEach((item: any) => {
      diffs.push({
        field: `${field}.removed`,
        oldValue: item,
        newValue: undefined,
        changeType: 'removed',
      });
    });
  });

  return diffs;
}

function calculateSimilarity(v1: any, v2: any): number {
  const diffs = calculateDiffs(v1, v2);

  if (diffs.length === 0) return 100;

  let diffWeight = 0;
  diffs.forEach((diff) => {
    switch (diff.changeType) {
      case 'modified':
        diffWeight += diff.field === 'convex_score' ? 20 : 10;
        break;
      case 'added':
      case 'removed':
        diffWeight += 5;
        break;
    }
  });

  return Math.max(0, Math.round(100 - diffWeight));
}
