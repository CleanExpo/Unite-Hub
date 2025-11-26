/**
 * Project Creation Engine
 *
 * Manages full project setup lifecycle:
 * 1. Create project from Stripe event
 * 2. Initialize contracts and timelines
 * 3. Generate tasks for orchestrator
 * 4. Set up reporting schedules
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'ProjectCreationEngine' });

export interface ProjectSetupInput {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tenantId: string;
  serviceTier: 'starter' | 'professional' | 'enterprise';
  serviceType: string;
  monthlyHours: number;
  monthlyAmount: number;
  clientName: string;
  clientEmail: string;
  clientWebsite?: string;
  productMetadata?: Record<string, string>;
}

export interface ProjectSetupResult {
  projectId: string;
  contractId: string;
  timelineIds: string[];
  taskIds: string[];
  success: boolean;
  error?: string;
}

/**
 * Generate service-specific timeline phases
 */
function generateTimelinePhases(serviceType: string) {
  const basePhases = [
    {
      phaseNumber: 1,
      phaseName: 'Discovery & Baseline',
      weeksDuration: 2,
      description: 'Understand current state, collect baseline metrics, define success criteria',
      keyActivities: [
        'Website audit and analysis',
        'Competitor research',
        'Current metrics baseline collection',
        'Success criteria definition',
      ],
      deliverables: [
        { name: 'Website Audit Report', format: 'PDF' },
        { name: 'Baseline Metrics', format: 'Dashboard' },
        { name: 'Strategy Framework', format: 'Document' },
      ],
    },
    {
      phaseNumber: 2,
      phaseName: 'Strategy Development',
      weeksDuration: 2,
      description: 'Create detailed strategy and action plan based on baseline',
      keyActivities: [
        'Detailed strategy creation',
        'Action plan development',
        'Resource allocation',
        'Success metric tracking setup',
      ],
      deliverables: [
        { name: 'Detailed Strategy Document', format: 'PDF' },
        { name: 'Action Plan', format: 'Spreadsheet' },
        { name: 'KPI Dashboard Setup', format: 'Dashboard' },
      ],
    },
    {
      phaseNumber: 3,
      phaseName: 'Execution & Optimization',
      weeksDuration: 4,
      description: 'Execute strategy and begin optimization cycles',
      keyActivities: [
        'Implementation of strategies',
        'Ongoing optimization',
        'Weekly reporting',
        'Client communication',
      ],
      deliverables: [
        { name: 'Weekly Reports', format: 'HTML Email' },
        { name: 'Performance Data', format: 'Dashboard' },
      ],
    },
  ];

  // Customize phases based on service type
  if (serviceType === 'content_strategy') {
    basePhases[1].keyActivities.push('Content audit', 'Content calendar creation');
  } else if (serviceType === 'seo_management') {
    basePhases[1].keyActivities.push('Keyword research', 'On-page optimization plan');
  } else if (serviceType === 'social_media') {
    basePhases[1].keyActivities.push('Social audit', 'Content calendar creation');
  }

  return basePhases;
}

/**
 * Generate initial tasks for orchestrator
 */
function generateInitialTasks(projectId: string, timelineId: string, serviceType: string) {
  const baseTasks = [
    {
      taskName: 'Conduct Website Audit',
      taskType: 'analysis',
      priority: 'high',
      daysUntilDue: 7,
      description: 'Comprehensive website analysis including technical SEO, UX, and performance',
      requiredInputs: { website_url: true, competitors: false },
      expectedOutputs: { audit_report: true, recommendations: true },
    },
    {
      taskName: 'Collect Baseline Metrics',
      taskType: 'monitoring',
      priority: 'high',
      daysUntilDue: 10,
      description: 'Gather current performance metrics across all relevant platforms',
      requiredInputs: { analytics_access: true, gsc_access: true },
      expectedOutputs: { baseline_data: true, trend_analysis: true },
    },
    {
      taskName: 'Research Competitors',
      taskType: 'analysis',
      priority: 'normal',
      daysUntilDue: 12,
      description: 'Analyze top 5 competitors in the target market',
      requiredInputs: { industry: true, location: false },
      expectedOutputs: { competitor_report: true, gap_analysis: true },
    },
  ];

  // Add service-specific tasks
  if (serviceType === 'seo_management') {
    baseTasks.push({
      taskName: 'Perform Keyword Research',
      taskType: 'analysis',
      priority: 'high',
      daysUntilDue: 10,
      description: 'Comprehensive keyword research using DataForSEO and SEMrush',
      requiredInputs: { industry: true, target_keywords: false },
      expectedOutputs: { keyword_list: true, search_volume_data: true },
    });
  }

  return baseTasks.map(task => ({
    ...task,
    projectId,
    timelineId,
    status: 'pending' as const,
    dueDate: new Date(Date.now() + task.daysUntilDue * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));
}

/**
 * Create a new managed service project with full setup
 */
export async function createManagedServiceProject(
  input: ProjectSetupInput
): Promise<ProjectSetupResult> {
  const supabase = getSupabaseAdmin();

  try {
    logger.info('🚀 Starting project setup', {
      clientName: input.clientName,
      serviceTier: input.serviceTier,
      stripeCustomerId: input.stripeCustomerId,
    });

    // 1. Create project record
    const { data: project, error: projectError } = await supabase
      .from('managed_service_projects')
      .insert({
        tenant_id: input.tenantId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        project_name: `${input.serviceType.replace(/_/g, ' ').toUpperCase()} - ${input.clientName}`,
        service_type: input.serviceType,
        service_tier: input.serviceTier,
        monthly_hours: input.monthlyHours,
        monthly_cost_cents: input.monthlyAmount,
        status: 'pending',
        start_date: new Date().toISOString().split('T')[0],
        client_name: input.clientName,
        client_email: input.clientEmail,
        client_website: input.clientWebsite || null,
        metadata: {
          created_via: 'engine',
          setup_timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (projectError) {
      logger.error('❌ Failed to create project', { projectError });
      throw new Error(`Project creation failed: ${projectError.message}`);
    }

    logger.info('✅ Project created', { projectId: project.id });

    // 2. Create contracts (standard MSA + SOW)
    const { data: contracts, error: contractError } = await supabase
      .from('managed_service_contracts')
      .insert([
        {
          project_id: project.id,
          contract_type: 'msa',
          scope_of_work: `Master Service Agreement for ${input.serviceType} managed service`,
          deliverables: [
            { name: 'Monthly Reports', description: 'Performance analytics and insights' },
            { name: 'Optimization Recommendations', description: 'Based on data analysis' },
            { name: 'Implementation Support', description: 'Up to 20 hours per month' },
          ],
          terms_and_conditions: 'Standard terms apply. See full document for details.',
          success_metrics: [
            {
              metric: 'Monthly Growth',
              target: '15%',
              measurement_method: 'YoY comparison',
            },
            {
              metric: 'Engagement Rate',
              target: '+25%',
              measurement_method: 'Analytics platform',
            },
          ],
          status: 'draft',
          effective_date: new Date().toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      ])
      .select();

    if (contractError) {
      logger.warn('⚠️ Failed to create contracts', { contractError });
    } else {
      logger.info('✅ Contracts created', { contractCount: contracts?.length || 0 });
    }

    // 3. Create timeline phases
    const phases = generateTimelinePhases(input.serviceType);
    const timelineInserts = phases.map(phase => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + phase.weeksDuration * 7 * 24 * 60 * 60 * 1000);

      return {
        project_id: project.id,
        phase_number: phase.phaseNumber,
        phase_name: phase.phaseName,
        start_date: startDate.toISOString().split('T')[0],
        planned_end_date: endDate.toISOString().split('T')[0],
        description: phase.description,
        key_activities: phase.keyActivities,
        deliverables: phase.deliverables,
        status: 'pending' as const,
        completion_percentage: 0,
      };
    });

    const { data: timelines, error: timelineError } = await supabase
      .from('managed_service_timelines')
      .insert(timelineInserts)
      .select();

    if (timelineError) {
      logger.error('❌ Failed to create timelines', { timelineError });
      throw new Error(`Timeline creation failed: ${timelineError.message}`);
    }

    logger.info('✅ Timeline phases created', { phaseCount: timelines?.length || 0 });

    // 4. Create initial tasks
    const allTasks = [];
    for (const timeline of timelines || []) {
      const tasks = generateInitialTasks(project.id, timeline.id, input.serviceType);
      allTasks.push(...tasks);
    }

    const { data: createdTasks, error: taskError } = await supabase
      .from('managed_service_tasks')
      .insert(
        allTasks.map(task => ({
          project_id: project.id,
          timeline_id: task.timelineId,
          task_name: task.taskName,
          task_type: task.taskType,
          status: 'pending',
          priority: task.priority,
          due_date: task.dueDate,
          description: task.description,
          required_inputs: task.requiredInputs,
          expected_outputs: task.expectedOutputs,
        }))
      )
      .select();

    if (taskError) {
      logger.error('❌ Failed to create tasks', { taskError });
      throw new Error(`Task creation failed: ${taskError.message}`);
    }

    logger.info('✅ Initial tasks created', { taskCount: createdTasks?.length || 0 });

    // 5. Queue notification for client onboarding
    await supabase
      .from('managed_service_notifications')
      .insert({
        project_id: project.id,
        recipient_email: input.clientEmail,
        notification_type: 'onboarding',
        subject: `Welcome to ${input.serviceType.replace(/_/g, ' ')} Management!`,
        email_body_html: `
          <h1>Project Setup Complete</h1>
          <p>Hi ${input.clientName},</p>
          <p>Your ${input.serviceTier} managed service project is now active.</p>
          <p>We're beginning the Discovery & Baseline phase immediately.</p>
          <p>Check back soon for your first insights!</p>
        `,
        email_body_text: `Welcome! Your project is active. Discovery phase begins now.`,
        status: 'pending',
      })
      .catch(err => logger.warn('⚠️ Could not queue onboarding email', { err }));

    logger.info('✅ Project setup complete', {
      projectId: project.id,
      phaseCount: timelines?.length || 0,
      taskCount: createdTasks?.length || 0,
    });

    return {
      projectId: project.id,
      contractId: contracts?.[0]?.id || '',
      timelineIds: (timelines || []).map(t => t.id),
      taskIds: (createdTasks || []).map(t => t.id),
      success: true,
    };

  } catch (error) {
    logger.error('❌ Project creation failed', { error });
    return {
      projectId: '',
      contractId: '',
      timelineIds: [],
      taskIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get project status for dashboard
 */
export async function getProjectStatus(projectId: string) {
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from('managed_service_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  const { data: timelines } = await supabase
    .from('managed_service_timelines')
    .select('*')
    .eq('project_id', projectId)
    .order('phase_number');

  const { data: tasks } = await supabase
    .from('managed_service_tasks')
    .select('*')
    .eq('project_id', projectId);

  const { data: reports } = await supabase
    .from('managed_service_reports')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  return {
    project,
    timelines,
    tasks,
    latestReport: reports?.[0],
    taskStats: {
      total: tasks?.length || 0,
      completed: (tasks || []).filter(t => t.status === 'completed').length,
      inProgress: (tasks || []).filter(t => t.status === 'in_progress').length,
      pending: (tasks || []).filter(t => t.status === 'pending').length,
    },
  };
}
