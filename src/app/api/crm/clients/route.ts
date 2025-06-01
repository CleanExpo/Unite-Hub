import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';

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
    .from('crm_clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

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
  if (!clientData.name || !clientData.email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Create new client
  const { data: newClient, error } = await supabase
    .from('crm_clients')
    .insert({
      ...clientData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

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

  // Delete client
  const { error } = await supabase
    .from('crm_clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
