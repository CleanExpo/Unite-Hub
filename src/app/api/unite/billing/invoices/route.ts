/**
 * Invoices API
 * Phase: D66
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createInvoice,
  listInvoices,
  updateInvoice,
  markInvoicePaid,
  addLineItem,
  getLineItems,
} from '@/lib/unite/billingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const action = request.nextUrl.searchParams.get('action');
    const invoiceId = request.nextUrl.searchParams.get('invoice_id');

    // Get line items
    if (action === 'line_items' && invoiceId) {
      const lineItems = await getLineItems(invoiceId);
      return NextResponse.json({ lineItems });
    }

    // List invoices
    const filters = {
      status: request.nextUrl.searchParams.get('status') || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
    };

    const invoices = await listInvoices(tenantId, filters);
    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const body = await request.json();
    const action = body.action;

    // Add line item
    if (action === 'add_line_item') {
      const { invoice_id, ...itemInput } = body;
      if (!invoice_id)
        return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });

      const lineItem = await addLineItem(invoice_id, itemInput);
      return NextResponse.json({ lineItem }, { status: 201 });
    }

    // Mark as paid
    if (action === 'mark_paid') {
      const { invoice_id } = body;
      if (!invoice_id)
        return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });

      const invoice = await markInvoicePaid(invoice_id);
      return NextResponse.json({ invoice });
    }

    // Update invoice
    if (action === 'update') {
      const { invoice_id, ...updates } = body;
      if (!invoice_id)
        return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });

      const invoice = await updateInvoice(invoice_id, updates);
      return NextResponse.json({ invoice });
    }

    // Create invoice (default)
    const invoice = await createInvoice(tenantId, body);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
