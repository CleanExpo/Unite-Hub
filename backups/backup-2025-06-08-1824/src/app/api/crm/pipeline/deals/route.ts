import { createApiClient } from '@/lib/supabase/api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createApiClient();
    
    const { data: deals, error } = await supabase
      .from('pipeline_deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createApiClient();
    const dealData = await request.json();

    const { data, error } = await supabase
      .from('pipeline_deals')
      .insert([dealData])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createApiClient();
    const { id, ...updateData } = await request.json();

    const { data, error } = await supabase
      .from('pipeline_deals')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}
