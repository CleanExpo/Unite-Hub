import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/crm/activity';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to create notes
  if (!await checkPermission(user, 'crm.communications.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const noteData = await req.json();
  
  // Validate required fields
  if (!noteData.content || !noteData.entity_type || !noteData.entity_id) {
    return NextResponse.json({ error: 'Content, entity type, and entity ID are required' }, { status: 400 });
  }

  // Create note
  const { data: newNote, error } = await supabase
    .from('crm_notes')
    .insert({
      content: noteData.content,
      entity_type: noteData.entity_type,
      entity_id: noteData.entity_id,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log activity
  await logActivity({
    user_id: user.id,
    action: 'create',
    entity_type: 'notes',
    entity_id: newNote.id,
    new_values: { entity_type: newNote.entity_type, entity_id: newNote.entity_id }
  });

  return NextResponse.json(newNote, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to view communications
  if (!await checkPermission(user, 'crm.communications.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');

  let query = supabase
    .from('crm_notes')
    .select('*, profiles:user_id(email, full_name)')
    .order('created_at', { ascending: false });

  if (entityType && entityId) {
    query = query.eq('entity_type', entityType).eq('entity_id', entityId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('id');
  
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  const noteData = await req.json();

  // Check if user owns the note
  const { data: existingNote } = await supabase
    .from('crm_notes')
    .select('user_id')
    .eq('id', noteId)
    .single();

  if (!existingNote || existingNote.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update note
  const { data: updatedNote, error } = await supabase
    .from('crm_notes')
    .update({ content: noteData.content })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(updatedNote);
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('id');
  
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // Check if user owns the note
  const { data: existingNote } = await supabase
    .from('crm_notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (!existingNote || existingNote.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete note
  const { error } = await supabase
    .from('crm_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log activity
  await logActivity({
    user_id: user.id,
    action: 'delete',
    entity_type: 'notes',
    entity_id: noteId,
    old_values: existingNote
  });

  return NextResponse.json({ success: true });
}
