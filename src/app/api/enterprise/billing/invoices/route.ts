/**
 * Invoices API
 * GET /api/enterprise/billing/invoices - Get org invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { billingEngine } from '@/lib/services/billing';

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
return null;
}
    return data.user;
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
return null;
}
  return data.user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const invoices = await billingEngine.getInvoices(orgId, limit);

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
