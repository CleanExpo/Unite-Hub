// src/app/api/kanban/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moveTaskFile, deleteTaskFile, writeTaskToVault } from '@/server/obsidian-sync';
import { Task } from '@/types/kanban';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const workspaceId = (user.user_metadata?.workspace_id ?? user.id) as string;

  const body = await req.json();

  const { data: existing } = await supabase.from('tasks').select('*').eq('id', id).eq('workspace_id', workspaceId).single();
  const { data: task, error } = await supabase.from('tasks').update(body).eq('id', id).eq('workspace_id', workspaceId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If status changed, move file in vault
  const { data: vaultConfig } = await supabase
    .from('workspace_vault_config').select('vault_path, sync_enabled')
    .eq('workspace_id', workspaceId).single();

  if (vaultConfig?.sync_enabled && existing?.obsidian_path) {
    if (body.status && body.status !== existing.status) {
      const newPath = await moveTaskFile(existing.obsidian_path, body.status, vaultConfig.vault_path);
      await supabase.from('tasks').update({ obsidian_path: newPath }).eq('id', id).eq('workspace_id', workspaceId);
      task.obsidian_path = newPath;
    } else if (body.title || body.description) {
      await writeTaskToVault(task as Task, vaultConfig.vault_path);
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const workspaceId = (user.user_metadata?.workspace_id ?? user.id) as string;

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).eq('workspace_id', workspaceId).single();
  await supabase.from('tasks').delete().eq('id', id).eq('workspace_id', workspaceId);

  if (task?.obsidian_path) {
    const { data: vaultConfig } = await supabase
      .from('workspace_vault_config').select('vault_path').eq('workspace_id', workspaceId).single();
    if (vaultConfig) await deleteTaskFile(task.obsidian_path, vaultConfig.vault_path);
  }

  return new NextResponse(null, { status: 204 });
}
