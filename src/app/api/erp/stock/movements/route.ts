import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as inventoryService from '@/lib/erp/inventoryService';

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
      product_id,
      warehouse_id,
      movement_type,
      quantity,
      unit_cost,
      reason,
      notes,
    } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!product_id || !warehouse_id || !movement_type || quantity === undefined) {
      return NextResponse.json(
        { error: 'product_id, warehouse_id, movement_type, and quantity required' },
        { status: 400 }
      );
    }

    const validMovementTypes = [
      'purchase_receipt',
      'sale',
      'adjustment_increase',
      'adjustment_decrease',
      'transfer_out',
      'transfer_in',
      'return_from_customer',
      'return_to_supplier',
    ];

    if (!validMovementTypes.includes(movement_type)) {
      return NextResponse.json(
        { error: `movement_type must be one of: ${validMovementTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await inventoryService.recordStockMovement({
      workspace_id,
      product_id,
      warehouse_id,
      movement_type,
      quantity,
      unit_cost,
      reason,
      notes,
      created_by: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error recording stock movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record stock movement' },
      { status: 500 }
    );
  }
}
