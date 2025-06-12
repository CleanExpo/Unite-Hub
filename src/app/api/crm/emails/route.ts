import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/crm/activity';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to create emails
  if (!await checkPermission(user.id, 'crm.communications.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const emailData = await req.json();
  
  // Validate required fields
  if (!emailData.subject || !emailData.body || !emailData.to_emails?.length) {
    return NextResponse.json({ error: 'Subject, body, and recipients are required' }, { status: 400 });
  }

  // Create email
  const { data: newEmail, error } = await supabase
    .from('crm_emails')
    .insert({
      ...emailData,
      user_id: user.id,
      from_email: user.email || emailData.from_email,
      status: emailData.status || 'draft'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log activity if email was sent
  if (newEmail.status === 'sent') {
    await logActivity({
      user_id: user.id,
      action: 'create',
      entity_type: 'emails',
      entity_id: newEmail.id,
      new_values: { subject: newEmail.subject, to: newEmail.to_emails }
    });
  }

  return NextResponse.json(newEmail, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to view communications
  if (!await checkPermission(user.id, 'crm.communications.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const threadId = searchParams.get('thread_id');
  const status = searchParams.get('status');

  let query = supabase
    .from('crm_emails')
    .select('*, profiles:user_id(email, full_name)')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  if (threadId) {
    query = query.eq('thread_id', threadId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
