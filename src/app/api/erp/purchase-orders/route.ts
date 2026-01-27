import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as purchaseOrderService from '@/lib/erp/purchaseOrderService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const supplierId = request.nextUrl.searchParams.get('supplier_id') || undefined;
    const warehouseId = request.nextUrl.searchParams.get('warehouse_id') || undefined;
    const status = request.nextUrl.searchParams.get('status') as any;

    const purchaseOrders = await purchaseOrderService.listPurchaseOrders(workspaceId, {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      status,
    });

    return NextResponse.json({ purchase_orders: purchaseOrders });
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspace_id,
      supplier_id,
      warehouse_id,
      line_items,
      order_date,
      expected_delivery_date,
      payment_terms_days,
      notes,
    } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!supplier_id || !warehouse_id) {
      return NextResponse.json(
        { error: 'supplier_id and warehouse_id required' },
        { status: 400 }
      );
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json(
        { error: 'line_items must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate line items
    for (const item of line_items) {
      if (!item.product_id || item.quantity_ordered === undefined || item.unit_cost === undefined) {
        return NextResponse.json(
          { error: 'Each line item must have product_id, quantity_ordered, and unit_cost' },
          { status: 400 }
        );
      }
    }

    const result = await purchaseOrderService.createPurchaseOrder({
      workspace_id,
      supplier_id,
      warehouse_id,
      line_items,
      order_date: order_date ? new Date(order_date) : undefined,
      expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : undefined,
      payment_terms_days,
      notes,
      created_by: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
