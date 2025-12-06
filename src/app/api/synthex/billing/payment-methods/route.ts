/**
 * Synthex Billing - Payment Methods API
 * GET /api/synthex/billing/payment-methods - List payment methods
 * POST /api/synthex/billing/payment-methods - Add payment method
 * DELETE /api/synthex/billing/payment-methods - Remove payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
} from '@/lib/synthex/invoicingService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenantId from query params
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    // Verify user has access to tenant
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get payment methods
    const paymentMethods = await listPaymentMethods(tenantId);

    return NextResponse.json({ paymentMethods });
  } catch (error: any) {
    console.error('[Synthex Payment Methods] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { tenantId, paymentMethodId, action } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify user has admin access
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Handle action
    if (action === 'set_default') {
      if (!paymentMethodId) {
        return NextResponse.json({ error: 'Missing paymentMethodId' }, { status: 400 });
      }

      const paymentMethod = await setDefaultPaymentMethod(tenantId, paymentMethodId);
      return NextResponse.json({ paymentMethod });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Synthex Payment Methods] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from query
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!tenantId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing tenantId or paymentMethodId parameter' },
        { status: 400 }
      );
    }

    // Verify user has admin access
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Remove payment method
    await removePaymentMethod(tenantId, paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Synthex Payment Methods] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
