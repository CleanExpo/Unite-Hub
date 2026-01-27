import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as purchaseOrderService from '@/lib/erp/purchaseOrderService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: purchaseOrderId } = await context.params;
    const body = await request.json();
    const { workspace_id, line_item_id, quantity_received, notes } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!line_item_id || !quantity_received) {
      return NextResponse.json(
        { error: 'line_item_id and quantity_received required' },
        { status: 400 }
      );
    }

    if (quantity_received <= 0) {
      return NextResponse.json(
        { error: 'quantity_received must be positive' },
        { status: 400 }
      );
    }

    const result = await purchaseOrderService.receiveStock({
      workspace_id,
      purchase_order_id: purchaseOrderId,
      line_item_id,
      quantity_received,
      received_by: user.id,
      notes,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error receiving stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to receive stock' },
      { status: 500 }
    );
  }
}
