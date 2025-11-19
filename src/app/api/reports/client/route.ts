/**
 * Client Reports API - Phase 3 Step 9
 *
 * Returns client-level reports (client-facing):
 * - GET /api/reports/client?type=billing - Billing summary
 * - GET /api/reports/client?type=pnl - Client P&L
 * - GET /api/reports/client?type=hours - Hours breakdown
 * - GET /api/reports/client?type=payments - Payment history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getClientBilling } from '@/lib/reports/financialReportEngine';
import { generateClientPnL } from '@/lib/reports/pnlGenerator';

// ============================================================================
// GET - Fetch Client Reports
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get contact ID from query params
    const contactId = req.nextUrl.searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this contact
    const supabase = await getSupabaseServer();
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, organization_id, workspace_id')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if user is in the same organization
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', contact.organization_id)
      .single();

    if (orgError || !userOrgs) {
      return NextResponse.json(
        { error: 'Access denied to this contact' },
        { status: 403 }
      );
    }

    // Get report type
    const reportType = req.nextUrl.searchParams.get('type') || 'billing';
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    // Route to appropriate report function
    switch (reportType) {
      case 'billing': {
        const result = await getClientBilling(contact.organization_id, contactId);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to fetch billing summary' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'billing',
          data: result.data?.[0] || null,
        });
      }

      case 'pnl': {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        const result = await generateClientPnL(contactId, start, end);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to generate client P&L' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'pnl',
          data: result.data,
        });
      }

      case 'hours': {
        // Fetch time entries for this contact
        let query = supabase
          .from('time_entries')
          .select('*')
          .eq('contact_id', contactId)
          .eq('status', 'approved')
          .order('date', { ascending: false });

        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data: entries, error: entriesError } = await query.limit(500);

        if (entriesError) {
          return NextResponse.json(
            { error: 'Failed to fetch time entries' },
            { status: 500 }
          );
        }

        // Calculate summary
        const billableEntries = entries?.filter((e) => e.billable) || [];
        const nonBillableEntries = entries?.filter((e) => !e.billable) || [];

        const billableHours = billableEntries.reduce((sum, e) => sum + e.hours, 0);
        const nonBillableHours = nonBillableEntries.reduce((sum, e) => sum + e.hours, 0);
        const totalAmount = billableEntries.reduce((sum, e) => sum + e.hours * e.hourly_rate, 0);

        return NextResponse.json({
          success: true,
          type: 'hours',
          data: {
            entries: entries || [],
            summary: {
              billableHours,
              nonBillableHours,
              totalHours: billableHours + nonBillableHours,
              totalAmount,
              averageRate: billableHours > 0 ? totalAmount / billableHours : 0,
              entryCount: entries?.length || 0,
            },
          },
        });
      }

      case 'payments': {
        // Fetch payment records for this contact
        let query = supabase
          .from('payment_records')
          .select('*')
          .eq('contact_id', contactId)
          .order('payment_date', { ascending: false });

        if (startDate) {
          query = query.gte('payment_date', startDate);
        }
        if (endDate) {
          query = query.lte('payment_date', endDate);
        }

        const { data: payments, error: paymentsError } = await query.limit(500);

        if (paymentsError) {
          return NextResponse.json(
            { error: 'Failed to fetch payment records' },
            { status: 500 }
          );
        }

        // Calculate summary
        const succeededPayments = payments?.filter((p) => p.status === 'succeeded') || [];
        const refundedPayments = payments?.filter((p) => p.status === 'refunded') || [];

        const totalPaid = succeededPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalRefunded = refundedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        return NextResponse.json({
          success: true,
          type: 'payments',
          data: {
            payments: payments || [],
            summary: {
              totalPaid,
              totalRefunded,
              netPaid: totalPaid - totalRefunded,
              paymentCount: succeededPayments.length,
              refundCount: refundedPayments.length,
            },
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${reportType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[CLIENT REPORTS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
