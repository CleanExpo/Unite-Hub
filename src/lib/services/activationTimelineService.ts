/**
 * Activation Timeline Service
 * Phase 53: Manage 90-day client activation programs
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ActivationProgram {
  id: string;
  organization_id: string;
  client_id: string;
  program_type: string;
  start_date: string;
  end_date?: string;
  current_phase: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  overall_progress: number;
  phase_1_progress: number;
  phase_2_progress: number;
  phase_3_progress: number;
  industry?: string;
  custom_focus_areas?: string[];
  notes?: string;
}

export interface ActivationMilestone {
  id: string;
  program_id: string;
  phase: number;
  day_number: number;
  title: string;
  description?: string;
  category: 'audit' | 'setup' | 'content' | 'seo' | 'social' | 'review' | 'report' | 'other';
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  completed_at?: string;
  completed_by?: string;
  linked_job_id?: string;
  linked_audit_id?: string;
  deliverables?: any[];
  evidence?: any[];
  notes?: string;
}

export interface ActivationEvent {
  id: string;
  program_id: string;
  milestone_id?: string;
  event_type: string;
  title: string;
  description?: string;
  actor_id?: string;
  actor_type: 'system' | 'staff' | 'client' | 'ai';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PhaseInfo {
  phase: number;
  name: string;
  days: string;
  description: string;
  progress: number;
  milestones: ActivationMilestone[];
}

// Create a new activation program
export async function createActivationProgram(
  organizationId: string,
  clientId: string,
  industry?: string,
  templateId?: string
): Promise<ActivationProgram | null> {
  const supabase = await getSupabaseServer();

  // Get template
  const { data: template } = await supabase
    .from('activation_templates')
    .select('*')
    .eq('is_default', true)
    .single();

  // Calculate end date (90 days from now)
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);

  // Create program
  const { data: program, error: programError } = await supabase
    .from('activation_programs')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      program_type: '90_day_standard',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      industry,
      status: 'active',
    })
    .select()
    .single();

  if (programError || !program) {
    console.error('Error creating activation program:', programError);
    return null;
  }

  // Create milestones from template
  if (template?.phases) {
    const phases = template.phases as any[];
    const milestones: any[] = [];

    for (const phase of phases) {
      for (const milestone of phase.milestones || []) {
        milestones.push({
          program_id: program.id,
          phase: phase.phase,
          day_number: milestone.day,
          title: milestone.title,
          category: milestone.category,
          status: 'not_started',
        });
      }
    }

    if (milestones.length > 0) {
      await supabase.from('activation_milestones').insert(milestones);
    }
  }

  // Log program started event
  await logActivationEvent(program.id, {
    event_type: 'program_started',
    title: 'Activation program started',
    description: `90-day activation program initiated for client`,
    actor_type: 'system',
  });

  return program;
}

// Get program with full details
export async function getActivationProgram(
  programId: string
): Promise<{
  program: ActivationProgram;
  phases: PhaseInfo[];
  events: ActivationEvent[];
} | null> {
  const supabase = await getSupabaseServer();

  // Get program
  const { data: program } = await supabase
    .from('activation_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (!program) return null;

  // Get milestones
  const { data: milestones } = await supabase
    .from('activation_milestones')
    .select('*')
    .eq('program_id', programId)
    .order('day_number', { ascending: true });

  // Get events
  const { data: events } = await supabase
    .from('activation_events')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Organize into phases
  const phases: PhaseInfo[] = [
    {
      phase: 1,
      name: 'Foundation',
      days: '1-14',
      description: 'Audits, data ingestion, welcome pack, initial roadmap',
      progress: program.phase_1_progress,
      milestones: (milestones || []).filter((m) => m.phase === 1),
    },
    {
      phase: 2,
      name: 'Implementation',
      days: '15-45',
      description: 'Website fixes, SEO quick wins, branding basics, social baseline',
      progress: program.phase_2_progress,
      milestones: (milestones || []).filter((m) => m.phase === 2),
    },
    {
      phase: 3,
      name: 'Momentum & Proof',
      days: '46-90',
      description: 'Content program, geo expansion, review packs, quarterly report',
      progress: program.phase_3_progress,
      milestones: (milestones || []).filter((m) => m.phase === 3),
    },
  ];

  return {
    program,
    phases,
    events: events || [],
  };
}

// Get programs for a client
export async function getClientActivationPrograms(
  clientId: string
): Promise<ActivationProgram[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('activation_programs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return data || [];
}

// Update milestone status
export async function updateMilestoneStatus(
  milestoneId: string,
  status: ActivationMilestone['status'],
  userId?: string,
  notes?: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
    notes,
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.completed_by = userId;
  }

  const { data: milestone, error } = await supabase
    .from('activation_milestones')
    .update(updates)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error || !milestone) return false;

  // Log event
  if (status === 'completed') {
    await logActivationEvent(milestone.program_id, {
      event_type: 'milestone_completed',
      title: `Milestone completed: ${milestone.title}`,
      milestone_id: milestoneId,
      actor_id: userId,
      actor_type: 'staff',
    });
  }

  // Update program progress
  await recalculateProgress(milestone.program_id);

  return true;
}

// Recalculate program progress
async function recalculateProgress(programId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { data: milestones } = await supabase
    .from('activation_milestones')
    .select('*')
    .eq('program_id', programId);

  if (!milestones) return;

  const calculatePhaseProgress = (phase: number) => {
    const phaseMilestones = milestones.filter((m) => m.phase === phase);
    if (phaseMilestones.length === 0) return 0;
    const completed = phaseMilestones.filter((m) => m.status === 'completed').length;
    return Math.round((completed / phaseMilestones.length) * 100);
  };

  const phase1 = calculatePhaseProgress(1);
  const phase2 = calculatePhaseProgress(2);
  const phase3 = calculatePhaseProgress(3);
  const overall = Math.round((phase1 + phase2 + phase3) / 3);

  // Determine current phase
  let currentPhase = 1;
  if (phase1 >= 100 && phase2 >= 100) currentPhase = 3;
  else if (phase1 >= 100) currentPhase = 2;

  await supabase
    .from('activation_programs')
    .update({
      phase_1_progress: phase1,
      phase_2_progress: phase2,
      phase_3_progress: phase3,
      overall_progress: overall,
      current_phase: currentPhase,
      status: overall >= 100 ? 'completed' : 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId);
}

// Log activation event
export async function logActivationEvent(
  programId: string,
  event: Omit<ActivationEvent, 'id' | 'program_id' | 'created_at'>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('activation_events').insert({
    program_id: programId,
    ...event,
  });
}

// Get current day of program
export function getProgramDay(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

// Get upcoming milestones
export async function getUpcomingMilestones(
  programId: string,
  limit: number = 5
): Promise<ActivationMilestone[]> {
  const supabase = await getSupabaseServer();

  const { data: program } = await supabase
    .from('activation_programs')
    .select('start_date')
    .eq('id', programId)
    .single();

  if (!program) return [];

  const currentDay = getProgramDay(program.start_date);

  const { data } = await supabase
    .from('activation_milestones')
    .select('*')
    .eq('program_id', programId)
    .eq('status', 'not_started')
    .gte('day_number', currentDay)
    .order('day_number', { ascending: true })
    .limit(limit);

  return data || [];
}

// Get overdue milestones
export async function getOverdueMilestones(
  programId: string
): Promise<ActivationMilestone[]> {
  const supabase = await getSupabaseServer();

  const { data: program } = await supabase
    .from('activation_programs')
    .select('start_date')
    .eq('id', programId)
    .single();

  if (!program) return [];

  const currentDay = getProgramDay(program.start_date);

  const { data } = await supabase
    .from('activation_milestones')
    .select('*')
    .eq('program_id', programId)
    .in('status', ['not_started', 'in_progress'])
    .lt('day_number', currentDay)
    .order('day_number', { ascending: true });

  return data || [];
}

export default {
  createActivationProgram,
  getActivationProgram,
  getClientActivationPrograms,
  updateMilestoneStatus,
  logActivationEvent,
  getProgramDay,
  getUpcomingMilestones,
  getOverdueMilestones,
};
