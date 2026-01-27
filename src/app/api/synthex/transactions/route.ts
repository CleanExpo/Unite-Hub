/**
 * GET  /api/synthex/transactions?tenantId=...
 * POST /api/synthex/transactions (internal — log a transaction)
 *
 * Transaction ledger for Synthex tenants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const type = req.nextUrl.searchParams.get('type');

    let query = supabaseAdmin
      .from('synthex_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Transactions GET error:', error);
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    return NextResponse.json({ transactions: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId, transactionType, amount, currency,
      description, referenceId, referenceType, metadata,
    } = body;

    if (!tenantId || !transactionType || amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_transactions')
      .insert({
        tenant_id: tenantId,
        transaction_type: transactionType,
        amount,
        currency: currency || 'AUD',
        status: 'completed',
        description: description || null,
        reference_id: referenceId || null,
        reference_type: referenceType || 'manual',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Transaction create error:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
