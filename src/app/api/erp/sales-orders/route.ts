import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as salesOrderService from '@/lib/erp/salesOrderService';

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

    const customerId = request.nextUrl.searchParams.get('customer_id') || undefined;
    const warehouseId = request.nextUrl.searchParams.get('warehouse_id') || undefined;
    const status = request.nextUrl.searchParams.get('status') as any;

    const salesOrders = await salesOrderService.listSalesOrders(workspaceId, {
      customer_id: customerId,
      warehouse_id: warehouseId,
      status,
    });

    return NextResponse.json({ sales_orders: salesOrders });
  } catch (error: any) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales orders' },
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
      customer_id,
      warehouse_id,
      line_items,
      order_date,
      requested_delivery_date,
      discount_amount,
      notes,
    } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!customer_id || !warehouse_id) {
      return NextResponse.json(
        { error: 'customer_id and warehouse_id required' },
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
      if (!item.product_id || item.quantity_ordered === undefined || item.unit_price === undefined) {
        return NextResponse.json(
          { error: 'Each line item must have product_id, quantity_ordered, and unit_price' },
          { status: 400 }
        );
      }
    }

    const result = await salesOrderService.createSalesOrder({
      workspace_id,
      customer_id,
      warehouse_id,
      line_items,
      order_date: order_date ? new Date(order_date) : undefined,
      requested_delivery_date: requested_delivery_date ? new Date(requested_delivery_date) : undefined,
      discount_amount,
      notes,
      created_by: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sales order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sales order' },
      { status: 500 }
    );
  }
}
