import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// =============================================================================
// REAL DEALS API - NO MOCK DATA
// =============================================================================
// This replaces all fake/mock deal data with actual database operations

// GET /api/crm/deals - Fetch all deals from database
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get URL parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const clientId = searchParams.get('client_id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with client information
    let query = supabase
      .from('deals')
      .select(`
        id,
        title,
        description,
        value,
        stage,
        probability,
        expected_close_date,
        actual_close_date,
        lost_reason,
        next_action,
        competitor,
        created_at,
        updated_at,
        client_id,
        clients!inner(
          id,
          name,
          email,
          company,
          status
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (stage) {
      query = query.eq('stage', stage);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: deals, error } = await query;

    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });

    // Calculate pipeline statistics
    const { data: pipelineStats } = await supabase
      .from('deals')
      .select('stage, value, probability')
      .neq('stage', 'closed_lost');

    const stats = {
      totalValue: pipelineStats?.reduce((sum, deal) => sum + parseFloat(deal.value), 0) || 0,
      weightedValue: pipelineStats?.reduce((sum, deal) => 
        sum + (parseFloat(deal.value) * (deal.probability / 100)), 0) || 0,
      averageDealSize: pipelineStats?.length > 0 ? 
        (pipelineStats.reduce((sum, deal) => sum + parseFloat(deal.value), 0) / pipelineStats.length) : 0
    };

    return NextResponse.json({
      data: deals || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      stats
    });

  } catch (error) {
    console.error('Unexpected error in deals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/crm/deals - Create new deal in database
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.client_id || !body.value) {
      return NextResponse.json(
        { error: 'Title, client_id, and value are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(parseFloat(body.value)) || parseFloat(body.value) < 0) {
      return NextResponse.json(
        { error: 'Value must be a positive number' },
        { status: 400 }
      );
    }

    if (body.probability && (isNaN(parseInt(body.probability)) || 
        parseInt(body.probability) < 0 || parseInt(body.probability) > 100)) {
      return NextResponse.json(
        { error: 'Probability must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Check if client exists
    const { data: clientExists, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', body.client_id)
      .single();

    if (clientError || !clientExists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Prepare deal data
    const dealData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      client_id: body.client_id,
      value: parseFloat(body.value),
      stage: body.stage || 'prospecting',
      probability: parseInt(body.probability) || 0,
      expected_close_date: body.expected_close_date || null,
      next_action: body.next_action?.trim() || null,
      competitor: body.competitor?.trim() || null
    };

    // Insert into database
    const { data: deal, error } = await supabase
      .from('deals')
      .insert([dealData])
      .select(`
        *,
        clients!inner(
          id,
          name,
          email,
          company
        )
      `)
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      return NextResponse.json(
        { error: 'Failed to create deal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: deal, message: 'Deal created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in deal creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
