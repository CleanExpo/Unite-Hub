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

    // Get workspace_id from query params or user metadata
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const customers = await invoicingService.listCustomers(workspaceId);

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
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
    const { workspace_id, customer_type, ...customerData } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!customer_type || !['individual', 'company'].includes(customer_type)) {
      return NextResponse.json(
        { error: 'customer_type must be "individual" or "company"' },
        { status: 400 }
      );
    }

    // Validate required fields based on type
    if (customer_type === 'individual') {
      if (!customerData.first_name || !customerData.last_name) {
        return NextResponse.json(
          { error: 'first_name and last_name required for individual customers' },
          { status: 400 }
        );
      }
    } else if (customer_type === 'company') {
      if (!customerData.company_name) {
        return NextResponse.json(
          { error: 'company_name required for company customers' },
          { status: 400 }
        );
      }
    }

    const customer = await invoicingService.createCustomer({
      workspace_id,
      customer_type,
      created_by: user.id,
      ...customerData,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
