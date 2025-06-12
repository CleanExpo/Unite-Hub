import { createApiClient } from '@/lib/supabase/api';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createApiClient();
  
  const { data: stages, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(stages);
}

export async function POST(request: Request) {
  const supabase = await createApiClient();
  const stageData = await request.json();

  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert([stageData])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0], { status: 201 });
}
