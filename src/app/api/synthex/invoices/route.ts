/**
 * GET  /api/synthex/invoices?tenantId=...
 * POST /api/synthex/invoices (generate invoice)
 *
 * Invoice management for Synthex tenants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  generateInvoiceNumber,
  buildLineItems,
  calculateInvoiceTotals,
} from '@/lib/synthex/financialTrackingEngine';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const status = req.nextUrl.searchParams.get('status');

    let query = supabaseAdmin
      .from('synthex_invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Invoices GET error:', error);
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    return NextResponse.json({ invoices: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, planCode, offerTier, jobCount, periodStart, periodEnd, notes } = body;

    if (!tenantId || !planCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get next invoice sequence
    const { count } = await supabaseAdmin
      .from('synthex_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const invoiceNumber = generateInvoiceNumber((count ?? 0) + 1);
    const lineItems = buildLineItems(planCode, offerTier || 'standard', jobCount || 0);
    const totals = calculateInvoiceTotals(lineItems);

    const now = new Date();
    const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabaseAdmin
      .from('synthex_invoices')
      .insert({
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        period_start: start,
        period_end: end,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        currency: 'AUD',
        status: 'issued',
        plan_code: planCode,
        offer_tier: offerTier || 'standard',
        line_items: lineItems,
        due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Invoice create error:', error);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({ invoice: data }, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
