import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as invoicingService from '@/lib/erp/invoicingService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const payments = await invoicingService.listPayments(workspaceId, { invoice_id: id });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await context.params;
    const body = await request.json();
    const { workspace_id, amount, payment_method, payment_date, reference, notes } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
    }

    if (!payment_method) {
      return NextResponse.json({ error: 'payment_method required' }, { status: 400 });
    }

    const validMethods = [
      'cash',
      'credit_card',
      'debit_card',
      'bank_transfer',
      'cheque',
      'paypal',
      'stripe',
      'other',
    ];

    if (!validMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: `payment_method must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const payment = await invoicingService.recordPayment({
      workspace_id,
      invoice_id: invoiceId,
      amount,
      payment_method,
      payment_date,
      reference,
      notes,
      created_by: user.id,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
