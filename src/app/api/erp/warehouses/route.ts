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

    const warehouses = await inventoryService.listWarehouses(workspaceId);

    return NextResponse.json({ warehouses });
  } catch (error: unknown) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouses' },
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
    const { workspace_id, code, name, ...warehouseData } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!code || !name) {
      return NextResponse.json({ error: 'code and name required' }, { status: 400 });
    }

    const warehouse = await inventoryService.createWarehouse({
      workspace_id,
      code,
      name,
      ...warehouseData,
    });

    return NextResponse.json({ warehouse }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
