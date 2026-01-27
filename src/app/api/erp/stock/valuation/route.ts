import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as inventoryService from '@/lib/erp/inventoryService';

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

    const warehouseId = request.nextUrl.searchParams.get('warehouse_id') || undefined;

    const valuation = await inventoryService.getInventoryValuation(
      workspaceId,
      warehouseId
    );

    return NextResponse.json({ valuation });
  } catch (error: any) {
    console.error('Error calculating inventory valuation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate inventory valuation' },
      { status: 500 }
    );
  }
}
