import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const taskData = await req.json();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const supabase = createClient();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const clientId = searchParams.get('client_id');

  let query = supabase
    .from('tasks')
    .select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
