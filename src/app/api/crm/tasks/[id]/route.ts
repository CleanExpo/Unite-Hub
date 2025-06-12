import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const resolvedParams = await params;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const resolvedParams = await params;
  const taskData = await req.json();

  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', resolvedParams.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
