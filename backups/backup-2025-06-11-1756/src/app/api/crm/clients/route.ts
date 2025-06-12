import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// REAL CLIENTS API - NO MOCK DATA
// =============================================================================
// This replaces all fake/mock client data with actual database operations

// GET /api/crm/clients - Fetch all clients from database
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get URL parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        phone,
        company,
        status,
        industry,
        website,
        address,
        notes,
        source,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      data: clients || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    });

  } catch (error) {
    console.error('Unexpected error in clients API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/crm/clients - Create new client in database
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare client data
    const clientData = {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      status: body.status || 'active',
      industry: body.industry?.trim() || null,
      website: body.website?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
      source: body.source?.trim() || null
    };

    // Insert into database
    const { data: client, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505' && error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Email address already exists' },
          { status: 409 }
        );
      }

      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: 'Failed to create client', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: client, message: 'Client created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in client creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
