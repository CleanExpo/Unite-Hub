import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleGET(req, userId) () {
  const supabase = await createClient();
  
  const { data: rules, error } = await supabase
    .from('pipeline_automation_rules')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rules);
}

async function handlePOST(req, userId) (request: Request) {
  const supabase = await createClient();
  const ruleData = await request.json();

  const { data, error } = await supabase
    .from('pipeline_automation_rules')
    .insert([ruleData])
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
    .from('pipeline_automation_rules')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}

async function handleDELETE(req, userId) (request: Request) {
  const supabase = await createClient();
  const { id } = await request.json();

  const { error } = await supabase
    .from('pipeline_automation_rules')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
export const PUT = withApiAuth(handlePUT);
export const DELETE = withApiAuth(handleDELETE);