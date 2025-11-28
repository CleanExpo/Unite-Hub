/**
 * Social Playbook Service
 *
 * CRUD operations for social media playbooks.
 * Used by the founder marketing dashboard.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SocialPlaybook {
  id: string;
  workspace_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  primary_goal: string | null;
  primary_persona: string | null;
  platforms: string[];
  status: 'draft' | 'active' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlaybookInput {
  workspace_id: string;
  name: string;
  description?: string;
  primary_goal?: string;
  primary_persona?: string;
  platforms?: string[];
  client_id?: string;
  created_by?: string;
}

export interface UpdatePlaybookInput {
  name?: string;
  description?: string;
  primary_goal?: string;
  primary_persona?: string;
  platforms?: string[];
  status?: 'draft' | 'active' | 'archived';
  client_id?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export async function listSocialPlaybooks(workspaceId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_playbooks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
}

export async function getSocialPlaybook(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_playbooks')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createSocialPlaybook(data: CreatePlaybookInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_playbooks')
    .insert({
      ...data,
      status: 'draft',
    })
    .select()
    .single();
}

export async function updateSocialPlaybook(id: string, data: UpdatePlaybookInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_playbooks')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteSocialPlaybook(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_playbooks')
    .delete()
    .eq('id', id);
}

export async function archiveSocialPlaybook(id: string) {
  return updateSocialPlaybook(id, { status: 'archived' });
}

export async function activateSocialPlaybook(id: string) {
  return updateSocialPlaybook(id, { status: 'active' });
}

export async function countPlaybooksByStatus(workspaceId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('social_playbooks')
    .select('status')
    .eq('workspace_id', workspaceId);

  if (error) return { data: null, error };

  const counts = {
    draft: 0,
    active: 0,
    archived: 0,
    total: data.length,
  };

  data.forEach((playbook) => {
    counts[playbook.status as keyof typeof counts]++;
  });

  return { data: counts, error: null };
}
