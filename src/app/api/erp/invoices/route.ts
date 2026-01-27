import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as invoicingService from '@/lib/erp/invoicingService';

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
    const customerId = request.nextUrl.searchParams.get('customer_id');
    const status = request.nextUrl.searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const filters: any = {};
    if (customerId) filters.customer_id = customerId;
    if (status) filters.status = status;

    const invoices = await invoicingService.listInvoices(workspaceId, filters);

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
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
    const { workspace_id, customer_id, line_items, ...invoiceData } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json(
        { error: 'line_items must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate line items
    for (const item of line_items) {
      if (!item.description || item.quantity === undefined || item.unit_price === undefined) {
        return NextResponse.json(
          { error: 'Each line item must have description, quantity, and unit_price' },
          { status: 400 }
        );
      }
    }

    const invoice = await invoicingService.createInvoice({
      workspace_id,
      customer_id,
      line_items,
      created_by: user.id,
      ...invoiceData,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
