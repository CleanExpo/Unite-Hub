import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleGET(req, userId) () {
  const supabase = await createClient();
  
  const { data: stages, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(stages);
}

async function handlePOST(req, userId) (request: Request) {
  const supabase = await createClient();
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

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);