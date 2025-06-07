// Unite Group + CARSI Automation Workflow Engine

import { createClient } from '@/lib/supabase/server';
import { 
  AutomationTrigger, 
  AutomationAction,
  UnifiedCustomer,
  Project,
  CourseEnrollment
} from '@/lib/types/crm-integration';
import { getCARSIToken } from '@/lib/auth/sso-bridge';

// Workflow Configuration
const WORKFLOW_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  carsiApiUrl: process.env.CARSI_API_URL || 'https://api.carsi.au',
};

// Predefined Automation Workflows
export const DEFAULT_WORKFLOWS: AutomationTrigger[] = [
  {
    id: 'project-complete-training',
    name: 'Auto-enroll in Related Training',
    type: 'project-complete',
    conditions: {
      projectType: ['software', 'seo', 'strategy'],
      minimumBudget: 20000,
    },
    actions: [
      {
        type: 'enroll-course',
        parameters: {
          courseMapping: {
            software: 'modern-web-development',
            seo: 'digital-marketing-certification',
            strategy: 'leadership-excellence',
          },
        },
        delayMinutes: 0,
      },
      {
        type: 'send-email',
        parameters: {
          template: 'project-complete-training-available',
          subject: 'Continue Your Journey with CARSI Training',
        },
        delayMinutes: 60,
      },
    ],
    enabled: true,
  },
  {
    id: 'certification-expiring-renewal',
    name: 'Certification Renewal Reminder',
    type: 'certification-expiring',
    conditions: {
      daysUntilExpiry: 90,
      certificationType: ['IICRC'],
    },
    actions: [
      {
        type: 'send-email',
        parameters: {
          template: 'certification-expiry-warning',
          subject: 'Your Certification is Expiring Soon',
        },
        delayMinutes: 0,
      },
      {
        type: 'create-task',
        parameters: {
          title: 'Renew Certification',
          priority: 'high',
          dueInDays: 30,
        },
        delayMinutes: 0,
      },
    ],
    enabled: true,
  },
  {
    id: 'course-complete-upsell',
    name: 'Course Completion Upsell',
    type: 'course-complete',
    conditions: {
      completionScore: 85,
      coursesCompleted: 1,
    },
    actions: [
      {
        type: 'update-crm',
        parameters: {
          addTag: 'high-performer',
          updateEngagementScore: 10,
        },
        delayMinutes: 0,
      },
      {
        type: 'send-email',
        parameters: {
          template: 'course-complete-next-steps',
          subject: 'Congratulations! Here\'s What\'s Next',
          includeRecommendations: true,
        },
        delayMinutes: 1440, // 24 hours
      },
    ],
    enabled: true,
  },
  {
    id: 'milestone-reached-celebration',
    name: 'Project Milestone Celebration',
    type: 'milestone-reached',
    conditions: {
      milestoneType: 'major',
      onTime: true,
    },
    actions: [
      {
        type: 'send-email',
        parameters: {
          template: 'milestone-celebration',
          subject: 'Milestone Achieved! 🎉',
          ccTeam: true,
        },
        delayMinutes: 0,
      },
      {
        type: 'trigger-webhook',
        parameters: {
          url: process.env.SLACK_WEBHOOK_URL,
          payload: {
            text: 'Project milestone reached!',
            channel: '#project-updates',
          },
        },
        delayMinutes: 0,
      },
    ],
    enabled: true,
  },
];

/**
 * Execute a workflow trigger
 */
export async function executeWorkflow(
  trigger: AutomationTrigger,
  context: WorkflowContext
): Promise<WorkflowResult> {
  const results: ActionResult[] = [];
  
  try {
    // Check if workflow is enabled
    if (!trigger.enabled) {
      return {
        success: false,
        message: 'Workflow is disabled',
        results,
      };
    }

    // Validate conditions
    if (!validateConditions(trigger.conditions, context)) {
      return {
        success: false,
        message: 'Conditions not met',
        results,
      };
    }

    // Execute actions
    for (const action of trigger.actions) {
      const result = await executeAction(action, context);
      results.push(result);
      
      if (!result.success && action.parameters.required) {
        // Stop execution if required action fails
        break;
      }
    }

    return {
      success: results.every(r => r.success || !r.required),
      message: 'Workflow executed',
      results,
    };
  } catch (error) {
    console.error('Workflow execution error:', error);
    return {
      success: false,
      message: 'Workflow execution failed',
      results,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: AutomationAction,
  context: WorkflowContext
): Promise<ActionResult> {
  // Apply delay if specified
  if (action.delayMinutes && action.delayMinutes > 0) {
    await new Promise(resolve => setTimeout(resolve, action.delayMinutes * 60 * 1000));
  }

  switch (action.type) {
    case 'enroll-course':
      return await enrollInCourse(action.parameters, context);
    
    case 'send-email':
      return await sendAutomatedEmail(action.parameters, context);
    
    case 'create-task':
      return await createTask(action.parameters, context);
    
    case 'update-crm':
      return await updateCRM(action.parameters, context);
    
    case 'trigger-webhook':
      return await triggerWebhook(action.parameters, context);
    
    default:
      return {
        success: false,
        actionType: action.type,
        message: 'Unknown action type',
      };
  }
}

/**
 * Enroll customer in CARSI course
 */
async function enrollInCourse(
  parameters: Record<string, any>,
  context: WorkflowContext
): Promise<ActionResult> {
  try {
    const carsiToken = await getCARSIToken();
    
    if (!carsiToken) {
      throw new Error('CARSI authentication required');
    }

    // Determine course based on context
    let courseId = parameters.courseId;
    
    if (!courseId && parameters.courseMapping && context.project) {
      courseId = parameters.courseMapping[context.project.type];
    }

    if (!courseId) {
      throw new Error('Course ID not determined');
    }

    // Call CARSI API to enroll
    const response = await fetch(`${WORKFLOW_CONFIG.carsiApiUrl}/enrollments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${carsiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: context.customer.customerId,
        courseId,
        source: 'unite-automation',
      }),
    });

    if (!response.ok) {
      throw new Error('Course enrollment failed');
    }

    return {
      success: true,
      actionType: 'enroll-course',
      message: `Enrolled in course: ${courseId}`,
      data: await response.json(),
    };
  } catch (error) {
    return {
      success: false,
      actionType: 'enroll-course',
      message: error instanceof Error ? error.message : 'Enrollment failed',
    };
  }
}

/**
 * Send automated email
 */
async function sendAutomatedEmail(
  parameters: Record<string, any>,
  context: WorkflowContext
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    // Record email in database
    const { error } = await supabase.from('automated_emails').insert({
      customer_id: context.customer.customerId,
      template: parameters.template,
      subject: parameters.subject,
      sent_at: new Date().toISOString(),
      context: {
        trigger: context.trigger,
        includeRecommendations: parameters.includeRecommendations,
      },
    });

    if (error) throw error;

    // In production, this would integrate with email service
    console.log('Email sent:', parameters);

    return {
      success: true,
      actionType: 'send-email',
      message: `Email sent: ${parameters.subject}`,
    };
  } catch (error) {
    return {
      success: false,
      actionType: 'send-email',
      message: error instanceof Error ? error.message : 'Email failed',
    };
  }
}

/**
 * Create task in project management system
 */
async function createTask(
  parameters: Record<string, any>,
  context: WorkflowContext
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parameters.dueInDays || 7));

    const { error } = await supabase.from('tasks').insert({
      customer_id: context.customer.customerId,
      title: parameters.title,
      description: parameters.description || 'Automated task',
      priority: parameters.priority || 'medium',
      due_date: dueDate.toISOString(),
      created_by: 'automation',
      assigned_to: parameters.assignTo || context.customer.customerId,
    });

    if (error) throw error;

    return {
      success: true,
      actionType: 'create-task',
      message: `Task created: ${parameters.title}`,
    };
  } catch (error) {
    return {
      success: false,
      actionType: 'create-task',
      message: error instanceof Error ? error.message : 'Task creation failed',
    };
  }
}

/**
 * Update CRM with tags, scores, etc.
 */
async function updateCRM(
  parameters: Record<string, any>,
  context: WorkflowContext
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const updates: Record<string, any> = {};
    
    if (parameters.addTag) {
      updates.tags = context.customer.metadata.tags
        ? [...context.customer.metadata.tags, parameters.addTag]
        : [parameters.addTag];
    }

    if (parameters.updateEngagementScore) {
      updates.engagement_score = Math.min(
        100,
        context.customer.engagementAnalytics.engagementScore + parameters.updateEngagementScore
      );
    }

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('customer_id', context.customer.customerId);

    if (error) throw error;

    return {
      success: true,
      actionType: 'update-crm',
      message: 'CRM updated successfully',
      data: updates,
    };
  } catch (error) {
    return {
      success: false,
      actionType: 'update-crm',
      message: error instanceof Error ? error.message : 'CRM update failed',
    };
  }
}

/**
 * Trigger external webhook
 */
async function triggerWebhook(
  parameters: Record<string, any>,
  context: WorkflowContext
): Promise<ActionResult> {
  try {
    const payload = {
      ...parameters.payload,
      customer: {
        id: context.customer.customerId,
        name: `${context.customer.basicInfo.firstName} ${context.customer.basicInfo.lastName}`,
      },
      trigger: context.trigger,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(parameters.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...parameters.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    return {
      success: true,
      actionType: 'trigger-webhook',
      message: 'Webhook triggered successfully',
    };
  } catch (error) {
    return {
      success: false,
      actionType: 'trigger-webhook',
      message: error instanceof Error ? error.message : 'Webhook failed',
    };
  }
}

/**
 * Validate workflow conditions
 */
function validateConditions(
  conditions: Record<string, any>,
  context: WorkflowContext
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'projectType':
        if (context.project && !value.includes(context.project.type)) {
          return false;
        }
        break;
      
      case 'minimumBudget':
        if (context.project && context.project.budget < value) {
          return false;
        }
        break;
      
      case 'completionScore':
        if (context.course && context.course.progress < value) {
          return false;
        }
        break;
      
      case 'daysUntilExpiry':
        if (context.certification) {
          const daysUntil = Math.floor(
            (new Date(context.certification.expiryDate!).getTime() - Date.now()) / 
            (1000 * 60 * 60 * 24)
          );
          if (daysUntil > value) {
            return false;
          }
        }
        break;
    }
  }
  
  return true;
}

// Type definitions
export interface WorkflowContext {
  customer: UnifiedCustomer;
  trigger: string;
  project?: Project;
  course?: CourseEnrollment;
  certification?: any;
  milestone?: any;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  results: ActionResult[];
  error?: string;
}

export interface ActionResult {
  success: boolean;
  actionType: string;
  message: string;
  data?: any;
  required?: boolean;
}

/**
 * Get active workflows for a trigger type
 */
export async function getActiveWorkflows(triggerType: string): Promise<AutomationTrigger[]> {
  try {
    const supabase = await createClient();
    
    // Get custom workflows from database
    const { data: customWorkflows } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('type', triggerType)
      .eq('enabled', true);

    // Combine with default workflows
    const allWorkflows = [
      ...DEFAULT_WORKFLOWS.filter(w => w.type === triggerType && w.enabled),
      ...(customWorkflows || []),
    ];

    return allWorkflows;
  } catch (error) {
    console.error('Failed to get workflows:', error);
    return DEFAULT_WORKFLOWS.filter(w => w.type === triggerType && w.enabled);
  }
}

/**
 * Process workflow queue
 */
export async function processWorkflowQueue(): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get pending workflow executions
    const { data: pendingWorkflows } = await supabase
      .from('workflow_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (!pendingWorkflows || pendingWorkflows.length === 0) {
      return;
    }

    // Process each workflow
    for (const queueItem of pendingWorkflows) {
      try {
        const workflow = queueItem.workflow as AutomationTrigger;
        const context = queueItem.context as WorkflowContext;
        
        const result = await executeWorkflow(workflow, context);
        
        // Update queue status
        await supabase
          .from('workflow_queue')
          .update({
            status: result.success ? 'completed' : 'failed',
            result,
            processed_at: new Date().toISOString(),
          })
          .eq('id', queueItem.id);
      } catch (error) {
        console.error('Failed to process workflow:', error);
        
        // Mark as failed
        await supabase
          .from('workflow_queue')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            processed_at: new Date().toISOString(),
          })
          .eq('id', queueItem.id);
      }
    }
  } catch (error) {
    console.error('Workflow queue processing error:', error);
  }
}
