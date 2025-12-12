import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBundleItem } from '@/lib/guardian/meta/exportBundleService';

/**
 * GET /api/guardian/meta/exports/[id]/items/[itemKey]
 * Retrieve individual bundle item content
 */
export const GET = withErrorBoundary(
  async (req: NextRequest, context: { params: Promise<{ id: string; itemKey: string }> }) => {
    const { id: bundleId, itemKey } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return errorResponse('workspaceId required', 400);
    }

    if (!bundleId || !itemKey) {
      return errorResponse('bundleId and itemKey required', 400);
    }

    await validateUserAndWorkspace(req, workspaceId);

    const item = await getBundleItem(workspaceId, bundleId, itemKey);

    if (!item) {
      return errorResponse('Item not found', 404);
    }

    return successResponse({
      item: {
        itemKey: item.itemKey,
        content: item.content,
        checksum: item.checksum,
      },
    });
  }
);
