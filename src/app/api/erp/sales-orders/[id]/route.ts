import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as salesOrderService from '@/lib/erp/salesOrderService';

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

    const salesOrder = await salesOrderService.getSalesOrder(workspaceId, id);

    if (!salesOrder) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
    }

    return NextResponse.json(salesOrder);
  } catch (error: unknown) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales order' },
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
      result = await salesOrderService.cancelSalesOrder(workspace_id, id);
    } else if (status) {
      // Update status
      const validStatuses = [
        'draft',
        'confirmed',
        'picking',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      result = await salesOrderService.updateSOStatus(workspace_id, id, status);
    } else {
      return NextResponse.json(
        { error: 'status or action required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ sales_order: result });
  } catch (error: unknown) {
    console.error('Error updating sales order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sales order' },
      { status: 500 }
    );
  }
}
