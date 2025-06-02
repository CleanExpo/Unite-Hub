import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function handleGET(req, userId) (req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

async function handlePUT(req, userId) (req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const taskData = await req.json();

  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export const GET = withApiAuth(handleGET);
export const PUT = withApiAuth(handlePUT);