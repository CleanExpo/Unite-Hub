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
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reason,
      notes,
    } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
      return NextResponse.json(
        {
          error:
            'product_id, from_warehouse_id, to_warehouse_id, and quantity required',
        },
        { status: 400 }
      );
    }

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json(
        { error: 'from_warehouse_id and to_warehouse_id must be different' },
        { status: 400 }
      );
    }

    const result = await inventoryService.transferStock({
      workspace_id,
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reason,
      notes,
      created_by: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error transferring stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer stock' },
      { status: 500 }
    );
  }
}
