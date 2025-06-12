import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// REAL SERVICES API - NO MOCK DATA
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        type,
        status,
        description,
        last_check,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Apply limit
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: services || [],
      count: services?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in services API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Prepare service data
    const serviceData = {
      name: body.name.trim(),
      type: body.type,
      status: body.status || 'healthy',
      description: body.description?.trim() || null,
      last_check: new Date().toISOString()
    };

    // Insert into database
    const { data: service, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json(
        { error: 'Failed to create service', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: service, message: 'Service created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in service creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
