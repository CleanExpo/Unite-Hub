/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Orchestrator Dashboard - Evidence Package API
 *
 * GET /api/orchestrator/dashboard/tasks/[id]/evidence
 * Returns evidence package with checksums, HMAC, and Merkle proof
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';
import { promises as fs } from 'fs';
import { resolve } from 'path';

const logger = createApiLogger({ context: 'OrchestratorDashboard' });

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('orchestrator_tasks')
      .select('evidence_package, trace')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const evidencePackage = task.evidence_package as any;

    if (!evidencePackage) {
      logger.warn('No evidence package found', { taskId });
      return NextResponse.json({
        taskId,
        evidence: null,
        message: 'No evidence package collected for this task',
      });
    }

    // Try to load evidence files from disk (if stored)
    let executionLog = null;
    let stateSnapshots = [];

    try {
      const evidenceDir = `audit-reports/evidence/${taskId}`;

      // Try to read execution log
      try {
        const logPath = resolve(evidenceDir, 'execution-log.json');
        const logContent = await fs.readFile(logPath, 'utf-8');
        executionLog = JSON.parse(logContent);
      } catch {
        // Log file not found - use embedded evidence
        executionLog = evidencePackage.execution_log;
      }

      // Try to read state snapshots
      try {
        const snapshotFiles = await fs.readdir(evidenceDir);
        for (const file of snapshotFiles) {
          if (file.startsWith('state-snapshot-')) {
            const snapshotPath = resolve(evidenceDir, file);
            const snapshotContent = await fs.readFile(snapshotPath, 'utf-8');
            stateSnapshots.push(JSON.parse(snapshotContent));
          }
        }
      } catch {
        // Snapshot files not found - use embedded evidence
        stateSnapshots = evidencePackage.state_snapshots || [];
      }
    } catch (error) {
      logger.warn('Failed to load evidence files from disk', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fall back to embedded evidence
      executionLog = evidencePackage.execution_log;
      stateSnapshots = evidencePackage.state_snapshots || [];
    }

    // Extract proof information
    const proof = evidencePackage.proof || {};

    logger.info('Evidence package fetched', {
      taskId,
      hasExecutionLog: !!executionLog,
      snapshotCount: stateSnapshots.length,
      hasMerkleRoot: !!proof.merkle_root,
    });

    return NextResponse.json({
      taskId,
      evidence: {
        collectionTime: evidencePackage.collected_at,
        storagePath: evidencePackage.storage_path,
        executionLog,
        stateSnapshots,
        verificationEvidence: evidencePackage.verification_evidence || [],
      },
      proof: {
        checksums: proof.checksums || {},
        hmac: proof.hmac,
        merkleRoot: proof.merkle_root,
        merkleTree: proof.merkle_tree || [],
      },
      metadata: {
        verificationStatus: evidencePackage.verification_status,
        verifierId: evidencePackage.verifier_id,
        collectedBy: evidencePackage.collected_by,
      },
    });
  } catch (error) {
    logger.error('Evidence endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
