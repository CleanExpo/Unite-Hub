import { NextRequest, NextResponse } from 'next/server';
import { DealPipelineWorkflows } from '@/lib/crm/business-logic/DealPipelineWorkflows';

// =============================================================================
// DEALS API - USING BUSINESS LOGIC LAYER
// =============================================================================
// This uses the DealPipelineWorkflows business logic for consistent operations

// GET /api/crm/deals - Fetch deals using business logic
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Deals API: Fetching deals using business logic layer...');
    
    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const stage = searchParams.get('stage'); // Legacy support
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use business logic to get deals
    const dealStatus = status || stage; // Support both 'status' and 'stage' params
    const result = await DealPipelineWorkflows.getDealsByStage(dealStatus as any);

    if (!result.success) {
      console.error('❌ Failed to fetch deals:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch deals', details: result.error },
        { status: 500 }
      );
    }

    const deals = result.deals || [];
    const analytics = result.analytics;

    // Apply pagination to results
    const paginatedDeals = deals.slice(offset, offset + limit);
    const totalCount = deals.length;

    console.log(`✅ Fetched ${paginatedDeals.length} deals (${totalCount} total)`);

    return NextResponse.json({
      data: paginatedDeals,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      analytics: analytics ? {
        totalValue: analytics.totalValue,
        weightedValue: analytics.weightedValue,
        averageDealSize: analytics.averageValue,
        dealCount: analytics.count
      } : null
    });

  } catch (error) {
    console.error('❌ Unexpected error in deals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/crm/deals - Create new deal using business logic
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Deals API: Creating deal using business logic layer...');
    
    const body = await request.json();
    
    // For now, use a placeholder user ID - this will be replaced with proper auth later
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';

    // Prepare input for business logic
    const dealInput = {
      title: body.title,
      description: body.description,
      value: parseFloat(body.value),
      clientId: body.client_id,
      status: body.status || body.stage || 'lead', // Support both field names
      expectedCloseDate: body.expected_close_date,
      probability: body.probability || undefined,
      userId: body.userId || placeholderUserId // Allow override or use placeholder
    };

    // Use business logic to create deal
    const result = await DealPipelineWorkflows.createDeal(dealInput);

    if (!result.success) {
      console.error('❌ Failed to create deal:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Deal created successfully:', result.deal?.id);

    return NextResponse.json(
      { 
        data: result.deal, 
        message: 'Deal created successfully',
        success: true 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in deal creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/deals - Update deal status using business logic workflows
export async function PUT(request: NextRequest) {
  try {
    console.log('🎯 Deals API: Updating deal status using business logic layer...');
    
    const body = await request.json();
    
    // For now, use a placeholder user ID - this will be replaced with proper auth later
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';

    // Validate required fields for status update
    if (!body.dealId || !body.fromStatus || !body.toStatus) {
      return NextResponse.json(
        { error: 'dealId, fromStatus, and toStatus are required' },
        { status: 400 }
      );
    }

    // Prepare input for business logic
    const statusUpdateInput = {
      dealId: body.dealId,
      fromStatus: body.fromStatus,
      toStatus: body.toStatus,
      notes: body.notes,
      userId: body.userId || placeholderUserId // Allow override or use placeholder
    };

    // Use business logic to update deal status
    const result = await DealPipelineWorkflows.moveDealsStatus(statusUpdateInput);

    if (!result.success) {
      console.error('❌ Failed to update deal status:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Deal status updated successfully:', result.deal?.id);

    return NextResponse.json({
      data: result.deal,
      message: 'Deal status updated successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Unexpected error in deal status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
