import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/crm/activity';

async function handlePOST(req, userId) (req: NextRequest) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check permission to create tasks
  if (!await checkPermission(user, 'crm.tasks.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const taskData = await req.json();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log the activity
  await logActivity({
    user_id: user.id,
    action: 'create',
    entity_type: 'tasks',
    entity_id: data.id,
    new_values: data
  });

  return NextResponse.json(data);
}

async function handleGET(req, userId) (req: NextRequest) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check permission to view tasks
  if (!await checkPermission(user, 'crm.tasks.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  if ( error ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);