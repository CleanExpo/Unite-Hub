/**
 * GET /api/guardian/meta/backups/[id] - Get backup metadata and manifest
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBackupSet, listBackupItems } from '@/lib/guardian/meta/metaBackupService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const backup = await getBackupSet(workspaceId, id);
  if (!backup) throw new Error('Backup not found');

  const items = await listBackupItems(workspaceId, id);

  return successResponse({
    backup: {
      id: backup.id,
      backupKey: backup.backup_key,
      label: backup.label,
      description: backup.description,
      scope: backup.scope,
      status: backup.status,
      createdAt: backup.created_at,
      createdBy: backup.created_by,
      manifest: backup.manifest,
    },
    items: items.map((item) => ({
      id: item.id,
      itemKey: item.item_key,
      contentType: item.content_type,
      checksum: item.checksum,
      createdAt: item.created_at,
    })),
  });
});
