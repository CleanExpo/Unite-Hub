/**
 * GET /api/guardian/meta/backups - List backup sets
 * POST /api/guardian/meta/backups - Create backup (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { createBackupSet, listBackupSets } from '@/lib/guardian/meta/metaBackupService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  const status = req.nextUrl.searchParams.get('status') || undefined;

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const { backups, total } = await listBackupSets(workspaceId, { limit, offset, status });

  return successResponse({
    backups: backups.map((b) => ({
      id: b.id,
      backupKey: b.backup_key,
      label: b.label,
      description: b.description,
      scope: b.scope,
      status: b.status,
      createdAt: b.created_at,
      createdBy: b.created_by,
    })),
    total,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { backupKey, label, description, scope, includeNotes } = body;

  if (!backupKey || !label || !description || !scope || !Array.isArray(scope)) {
    throw new Error('backupKey, label, description, and scope (array) required');
  }

  const result = await createBackupSet({
    tenantId: workspaceId,
    backupKey,
    label,
    description,
    scope,
    includeNotes: includeNotes || false,
    actor: 'admin',
  });

  return successResponse({
    message: 'Backup created',
    ...result,
  });
});
