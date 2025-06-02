import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleGET(req, userId) () {
  const supabase = await createClient();
  
  const { data: deals, error } = await supabase
    .from('pipeline_deals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(deals);
}

async function handlePOST(req, userId) (request: Request) {
  const supabase = await createClient();
  const dealData = await request.json();

  const { data, error } = await supabase
    .from('pipeline_deals')
    .insert([dealData])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0], { status: 201 });
}

async function handlePUT(req, userId) (request: Request) {
  const supabase = await createClient();
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
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
export const PUT = withApiAuth(handlePUT);