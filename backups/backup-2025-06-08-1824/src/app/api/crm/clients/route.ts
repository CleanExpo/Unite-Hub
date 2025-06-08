import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/crm/activity';

export async function GET() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to view CRM clients
  if (!await checkPermission(user, 'crm.clients.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch CRM clients from database
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Return the clients data
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to create CRM clients
  if (!await checkPermission(user, 'crm.clients.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientData = await req.json();
  
  // Validate required fields
  if (!clientData.company_name || !clientData.email) {
    return NextResponse.json({ error: 'Company name and email are required' }, { status: 400 });
  }

  // Create new client
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log the activity
  await logActivity({
    user_id: user.id,
    action: 'create',
    entity_type: 'clients',
    entity_id: newClient.id,
    new_values: newClient
  });

  return NextResponse.json(newClient, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to delete CRM clients
  if (!await checkPermission(user, 'crm.clients.delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('id');
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  // Get client data before deletion
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  // Delete client
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log the activity
  await logActivity({
    user_id: user.id,
    action: 'delete',
    entity_type: 'clients',
    entity_id: clientId,
    old_values: client
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
