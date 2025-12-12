/**
 * GET /api/guardian/meta/backups/[id]/items/[itemKey] - Get backup item (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBackupItem } from '@/lib/guardian/meta/metaBackupService';

type RouteContext = {
  params: Promise<{ id: string; itemKey: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id, itemKey } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const item = await getBackupItem(workspaceId, id, itemKey);
  if (!item) throw new Error('Backup item not found');

  return successResponse({
    item: {
      id: item.id,
      itemKey: item.item_key,
      contentType: item.content_type,
      checksum: item.checksum,
      createdAt: item.created_at,
      content: item.content,
    },
  });
});
