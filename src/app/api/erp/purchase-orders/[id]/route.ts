import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as purchaseOrderService from '@/lib/erp/purchaseOrderService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const purchaseOrder = await purchaseOrderService.getPurchaseOrder(workspaceId, id);

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    return NextResponse.json(purchaseOrder);
  } catch (error: unknown) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { workspace_id, status, action } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    let result;

    // Handle special actions
    if (action === 'cancel') {
      result = await purchaseOrderService.cancelPurchaseOrder(workspace_id, id);
    } else if (status) {
      // Update status
      const validStatuses = [
        'draft',
        'submitted',
        'confirmed',
        'partially_received',
        'received',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      result = await purchaseOrderService.updatePOStatus(workspace_id, id, status);
    } else {
      return NextResponse.json(
        { error: 'status or action required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ purchase_order: result });
  } catch (error: unknown) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}
