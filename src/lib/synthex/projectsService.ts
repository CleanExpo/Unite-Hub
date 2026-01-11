import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type SynthexProjectStage =
  | 'brief'
  | 'strategy'
  | 'production'
  | 'client_review'
  | 'scheduled'
  | 'live'
  | 'optimize'
  | 'archived';

export type SynthexProjectRunStatus = 'awaiting_approval' | 'approved' | 'failed';

export type SynthexApprovalType = 'schedule' | 'launch' | 'content' | 'strategy';

export interface SynthexProject {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  name: string;
  goal: string | null;
  channels: string[];
  stage: SynthexProjectStage;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SynthexProjectRun {
  id: string;
  tenant_id: string;
  project_id: string;
  status: SynthexProjectRunStatus;
  current_stage: SynthexProjectStage;
  artifact_bundle_hash: string | null;
  artifact_json: Record<string, unknown>;
  verification_json: Record<string, unknown>;
  created_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SynthexProjectApproval {
  id: string;
  tenant_id: string;
  project_id: string;
  run_id: string;
  approval_type: SynthexApprovalType;
  artifact_bundle_hash: string;
  approved_by: string;
  approved_at: string;
  notes: string | null;
  created_at: string;
}

export function computeArtifactBundleHash(artifact: unknown): string {
  const payload = JSON.stringify(artifact ?? null);
  return createHash('sha256').update(payload).digest('hex');
}

export async function listProjects(
  tenantId: string
): Promise<{ projects: SynthexProject[]; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('synthex_projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    return { projects: [], error: error.message };
  }

  return { projects: (data as SynthexProject[]) ?? [] };
}

export async function createProject(params: {
  tenantId: string;
  userId: string;
  name: string;
  goal?: string | null;
  brandId?: string | null;
  channels?: string[] | null;
}): Promise<{ project?: SynthexProject; error?: string }> {
  const { tenantId, userId, name, goal, brandId, channels } = params;

  const { data, error } = await supabaseAdmin
    .from('synthex_projects')
    .insert({
      tenant_id: tenantId,
      brand_id: brandId ?? null,
      name,
      goal: goal ?? null,
      channels: channels ?? [],
      stage: 'brief',
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { project: data as SynthexProject };
}

export async function getProjectDetail(params: {
  tenantId: string;
  projectId: string;
}): Promise<{ project?: SynthexProject; latestRun?: SynthexProjectRun; error?: string }> {
  const { tenantId, projectId } = params;

  const { data: project, error: projectError } = await supabaseAdmin
    .from('synthex_projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: projectError?.message ?? 'Project not found' };
  }

  const { data: runs, error: runsError } = await supabaseAdmin
    .from('synthex_project_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (runsError) {
    return { project: project as SynthexProject, error: runsError.message };
  }

  const latestRun = (runs?.[0] as SynthexProjectRun | undefined) ?? undefined;
  return { project: project as SynthexProject, latestRun };
}

function buildDemoDraftBundle(params: {
  projectName: string;
  goal: string | null;
  channels: string[];
}): Record<string, unknown> {
  const { projectName, goal, channels } = params;

  return {
    summary: {
      projectName,
      goal,
      channels,
    },
    drafts: {
      email: {
        subject: `Quick update: ${projectName}`,
        body:
          `Hi {{first_name}},\n\n` +
          `Here’s a draft campaign for: ${projectName}.\n\n` +
          (goal ? `Goal: ${goal}\n\n` : '') +
          `If you approve, we’ll schedule this to go live.\n\n` +
          `— Synthex`,
      },
      social: {
        caption:
          `We’re working on ${projectName}. ` +
          (goal ? `Goal: ${goal}. ` : '') +
          `Reply “INFO” and we’ll send details.`,
      },
    },
  };
}

export async function generateDraftRun(params: {
  tenantId: string;
  projectId: string;
  userId: string;
}): Promise<{ run?: SynthexProjectRun; error?: string }> {
  const { tenantId, projectId, userId } = params;

  const { data: project, error: projectError } = await supabaseAdmin
    .from('synthex_projects')
    .select('id, tenant_id, name, goal, channels')
    .eq('tenant_id', tenantId)
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: projectError?.message ?? 'Project not found' };
  }

  const artifactJson = buildDemoDraftBundle({
    projectName: project.name,
    goal: project.goal ?? null,
    channels: (project.channels as string[]) ?? [],
  });

  const artifactBundleHash = computeArtifactBundleHash(artifactJson);

  const { data: run, error: runError } = await supabaseAdmin
    .from('synthex_project_runs')
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      status: 'awaiting_approval',
      current_stage: 'client_review',
      artifact_bundle_hash: artifactBundleHash,
      artifact_json: artifactJson,
      verification_json: {
        passed: true,
        confidence: 0.8,
        notes: ['Demo verifier: replace with independent verifier pipeline'],
      },
      created_by: userId,
    })
    .select('*')
    .single();

  if (runError || !run) {
    return { error: runError?.message ?? 'Failed to create run' };
  }

  const { error: projectUpdateError } = await supabaseAdmin
    .from('synthex_projects')
    .update({
      stage: 'client_review',
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', projectId);

  if (projectUpdateError) {
    return { error: projectUpdateError.message };
  }

  return { run: run as SynthexProjectRun };
}

export async function approveLatestRun(params: {
  tenantId: string;
  projectId: string;
  userId: string;
  approvalType?: SynthexApprovalType;
  notes?: string | null;
}): Promise<{ approval?: SynthexProjectApproval; error?: string }> {
  const { tenantId, projectId, userId, approvalType, notes } = params;

  const { data: runs, error: runsError } = await supabaseAdmin
    .from('synthex_project_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (runsError) {
    return { error: runsError.message };
  }

  const latestRun = runs?.[0] as SynthexProjectRun | undefined;
  if (!latestRun) {
    return { error: 'No run found to approve' };
  }

  if (latestRun.status !== 'awaiting_approval') {
    return { error: 'Latest run is not awaiting approval' };
  }

  if (!latestRun.artifact_bundle_hash) {
    return { error: 'Run is missing artifact_bundle_hash' };
  }

  const { data: approval, error: approvalError } = await supabaseAdmin
    .from('synthex_project_approvals')
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      run_id: latestRun.id,
      approval_type: approvalType ?? 'schedule',
      artifact_bundle_hash: latestRun.artifact_bundle_hash,
      approved_by: userId,
      notes: notes ?? null,
    })
    .select('*')
    .single();

  if (approvalError || !approval) {
    return { error: approvalError?.message ?? 'Failed to create approval' };
  }

  const nowIso = new Date().toISOString();

  const { error: runUpdateError } = await supabaseAdmin
    .from('synthex_project_runs')
    .update({
      status: 'approved',
      current_stage: 'scheduled',
      approved_at: nowIso,
      updated_at: nowIso,
    })
    .eq('tenant_id', tenantId)
    .eq('id', latestRun.id);

  if (runUpdateError) {
    return { error: runUpdateError.message };
  }

  const { error: projectUpdateError } = await supabaseAdmin
    .from('synthex_projects')
    .update({
      stage: 'scheduled',
      updated_at: nowIso,
    })
    .eq('tenant_id', tenantId)
    .eq('id', projectId);

  if (projectUpdateError) {
    return { error: projectUpdateError.message };
  }

  return { approval: approval as SynthexProjectApproval };
}

