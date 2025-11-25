/**
 * Founder Ops Task Library
 *
 * Structured library of task archetypes that founders can schedule and execute.
 * Each task type has specific requirements, estimated effort, and default settings.
 *
 * Task Types:
 * - Social media posts (single image/carousel)
 * - Blog drafts (long-form content)
 * - Email drafts (campaigns, newsletters)
 * - Ad concepts (paid advertising)
 * - Branding variations (visual identity)
 * - Video scripts (YouTube, TikTok, etc.)
 *
 * @module founderOps/founderOpsTaskLibrary
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/founder-ops/task-library' });

// ====================================
// Task Types
// ====================================

export type TaskArchetype =
  | 'social_post_single'
  | 'social_post_carousel'
  | 'blog_draft'
  | 'email_draft'
  | 'newsletter_draft'
  | 'ad_concept'
  | 'branding_variation'
  | 'video_script'
  | 'landing_page_copy'
  | 'case_study'
  | 'white_paper';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'draft'
  | 'scheduled'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'archived';

export type TaskChannel =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'blog'
  | 'website'
  | 'paid_ads';

export interface TaskDefinition {
  archetype: TaskArchetype;
  label: string;
  description: string;
  estimated_effort: 'low' | 'medium' | 'high';
  estimated_duration_minutes: number;
  default_channels: TaskChannel[];
  requires_founder_approval: boolean;
  requires_brand_context: boolean;
  ai_systems_used: string[]; // VIF, Topic Engine, Story Engine, etc.
  output_format: string;
}

export interface FounderTask {
  id: string;
  workspace_id: string;
  brand_slug: string;
  archetype: TaskArchetype;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  channels: TaskChannel[];
  deadline?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  created_by: string; // founder user_id
  assigned_to?: string; // user_id or 'ai'
  metadata: {
    topic?: string;
    target_audience?: string[];
    content_theme?: string;
    ai_generated?: boolean;
    draft_id?: string;
    visual_asset_ids?: string[];
    approval_notes?: string;
  };
}

// ====================================
// Task Library Definitions
// ====================================

export const TASK_LIBRARY: Record<TaskArchetype, TaskDefinition> = {
  social_post_single: {
    archetype: 'social_post_single',
    label: 'Social Post (Single Image)',
    description: 'Single image social media post with caption',
    estimated_effort: 'low',
    estimated_duration_minutes: 15,
    default_channels: ['linkedin', 'twitter', 'facebook', 'instagram'],
    requires_founder_approval: false,
    requires_brand_context: true,
    ai_systems_used: ['VIF', 'Content Generation'],
    output_format: 'image + caption (max 280 chars for Twitter)',
  },

  social_post_carousel: {
    archetype: 'social_post_carousel',
    label: 'Social Post (Carousel)',
    description: 'Multi-image carousel post with captions',
    estimated_effort: 'medium',
    estimated_duration_minutes: 30,
    default_channels: ['linkedin', 'instagram'],
    requires_founder_approval: false,
    requires_brand_context: true,
    ai_systems_used: ['VIF', 'Content Generation', 'Story Engine'],
    output_format: '3-10 images + caption',
  },

  blog_draft: {
    archetype: 'blog_draft',
    label: 'Blog Draft',
    description: 'Long-form blog post (1000-2500 words)',
    estimated_effort: 'high',
    estimated_duration_minutes: 90,
    default_channels: ['blog'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Topic Engine', 'Content Generation', 'Story Engine'],
    output_format: 'markdown + featured image',
  },

  email_draft: {
    archetype: 'email_draft',
    label: 'Email Draft',
    description: 'Email campaign or one-off message',
    estimated_effort: 'medium',
    estimated_duration_minutes: 30,
    default_channels: ['email'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Content Generation'],
    output_format: 'subject + body (HTML + plain text)',
  },

  newsletter_draft: {
    archetype: 'newsletter_draft',
    label: 'Newsletter Draft',
    description: 'Multi-section newsletter with links',
    estimated_effort: 'high',
    estimated_duration_minutes: 60,
    default_channels: ['email'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Topic Engine', 'Content Generation'],
    output_format: 'HTML template + sections',
  },

  ad_concept: {
    archetype: 'ad_concept',
    label: 'Ad Concept',
    description: 'Paid advertising creative concept',
    estimated_effort: 'medium',
    estimated_duration_minutes: 45,
    default_channels: ['paid_ads'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['VIF', 'Content Generation'],
    output_format: 'headline + body + visual + CTA',
  },

  branding_variation: {
    archetype: 'branding_variation',
    label: 'Branding Variation',
    description: 'Visual identity variation or branded asset',
    estimated_effort: 'medium',
    estimated_duration_minutes: 45,
    default_channels: ['website', 'paid_ads'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['VIF'],
    output_format: 'branded visual asset',
  },

  video_script: {
    archetype: 'video_script',
    label: 'Video Script',
    description: 'Script for YouTube, TikTok, or video content',
    estimated_effort: 'high',
    estimated_duration_minutes: 60,
    default_channels: ['youtube', 'tiktok'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Story Engine', 'Content Generation'],
    output_format: 'script with scene breakdowns',
  },

  landing_page_copy: {
    archetype: 'landing_page_copy',
    label: 'Landing Page Copy',
    description: 'Landing page headline, body, and CTAs',
    estimated_effort: 'high',
    estimated_duration_minutes: 90,
    default_channels: ['website'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Topic Engine', 'Content Generation'],
    output_format: 'structured copy blocks + CTAs',
  },

  case_study: {
    archetype: 'case_study',
    label: 'Case Study',
    description: 'Client success story or case study',
    estimated_effort: 'high',
    estimated_duration_minutes: 120,
    default_channels: ['blog', 'website'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Story Engine', 'Content Generation'],
    output_format: 'problem-solution-results structure',
  },

  white_paper: {
    archetype: 'white_paper',
    label: 'White Paper',
    description: 'In-depth industry report or white paper',
    estimated_effort: 'high',
    estimated_duration_minutes: 180,
    default_channels: ['website', 'email'],
    requires_founder_approval: true,
    requires_brand_context: true,
    ai_systems_used: ['Topic Engine', 'Content Generation', 'Story Engine'],
    output_format: 'PDF with sections + visuals',
  },
};

// ====================================
// Task Library Service
// ====================================

export class FounderOpsTaskLibrary {
  /**
   * Get all task archetypes
   */
  getAllTaskArchetypes(): TaskDefinition[] {
    return Object.values(TASK_LIBRARY);
  }

  /**
   * Get task definition by archetype
   */
  getTaskDefinition(archetype: TaskArchetype): TaskDefinition | null {
    return TASK_LIBRARY[archetype] || null;
  }

  /**
   * Get task archetypes by effort level
   */
  getTasksByEffort(effort: 'low' | 'medium' | 'high'): TaskDefinition[] {
    return Object.values(TASK_LIBRARY).filter((task) => task.estimated_effort === effort);
  }

  /**
   * Get task archetypes by channel
   */
  getTasksByChannel(channel: TaskChannel): TaskDefinition[] {
    return Object.values(TASK_LIBRARY).filter((task) =>
      task.default_channels.includes(channel)
    );
  }

  /**
   * Get task archetypes requiring founder approval
   */
  getTasksRequiringApproval(): TaskDefinition[] {
    return Object.values(TASK_LIBRARY).filter((task) => task.requires_founder_approval);
  }

  /**
   * Estimate total time for tasks
   */
  estimateTotalTime(archetypes: TaskArchetype[]): number {
    return archetypes.reduce((total, archetype) => {
      const definition = this.getTaskDefinition(archetype);
      return total + (definition?.estimated_duration_minutes || 0);
    }, 0);
  }

  /**
   * Get recommended tasks for a brand
   */
  getRecommendedTasksForBrand(
    brandSlug: string,
    brandMetadata?: {
      industry?: string;
      recommended_channels?: string[];
    }
  ): TaskDefinition[] {
    const allTasks = this.getAllTaskArchetypes();

    // If no metadata, return all tasks
    if (!brandMetadata) return allTasks;

    // Filter by recommended channels
    if (brandMetadata.recommended_channels && brandMetadata.recommended_channels.length > 0) {
      return allTasks.filter((task) =>
        task.default_channels.some((channel) =>
          brandMetadata.recommended_channels?.includes(channel)
        )
      );
    }

    return allTasks;
  }

  /**
   * Validate task before creation
   */
  validateTask(task: Partial<FounderTask>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!task.workspace_id) errors.push('workspace_id is required');
    if (!task.brand_slug) errors.push('brand_slug is required');
    if (!task.archetype) errors.push('archetype is required');
    if (!task.title) errors.push('title is required');
    if (!task.priority) errors.push('priority is required');
    if (!task.channels || task.channels.length === 0) {
      errors.push('at least one channel is required');
    }

    // Validate archetype exists
    if (task.archetype && !TASK_LIBRARY[task.archetype]) {
      errors.push(`invalid archetype: ${task.archetype}`);
    }

    // Validate channels
    if (task.channels) {
      const validChannels: TaskChannel[] = [
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'tiktok',
        'youtube',
        'email',
        'blog',
        'website',
        'paid_ads',
      ];

      for (const channel of task.channels) {
        if (!validChannels.includes(channel)) {
          errors.push(`invalid channel: ${channel}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get task status display properties
   */
  getStatusDisplay(status: TaskStatus): {
    label: string;
    color: string;
    icon: string;
  } {
    const statusMap: Record<
      TaskStatus,
      { label: string; color: string; icon: string }
    > = {
      draft: { label: 'Draft', color: 'gray', icon: '📝' },
      scheduled: { label: 'Scheduled', color: 'blue', icon: '📅' },
      in_progress: { label: 'In Progress', color: 'yellow', icon: '⚙️' },
      pending_review: { label: 'Pending Review', color: 'orange', icon: '👀' },
      approved: { label: 'Approved', color: 'green', icon: '✅' },
      rejected: { label: 'Rejected', color: 'red', icon: '❌' },
      completed: { label: 'Completed', color: 'green', icon: '🎉' },
      archived: { label: 'Archived', color: 'gray', icon: '📦' },
    };

    return statusMap[status];
  }

  /**
   * Get priority display properties
   */
  getPriorityDisplay(priority: TaskPriority): {
    label: string;
    color: string;
    icon: string;
  } {
    const priorityMap: Record<
      TaskPriority,
      { label: string; color: string; icon: string }
    > = {
      low: { label: 'Low', color: 'gray', icon: '🔵' },
      medium: { label: 'Medium', color: 'yellow', icon: '🟡' },
      high: { label: 'High', color: 'orange', icon: '🟠' },
      urgent: { label: 'Urgent', color: 'red', icon: '🔴' },
    };

    return priorityMap[priority];
  }
}

// Export singleton instance
export const founderOpsTaskLibrary = new FounderOpsTaskLibrary();

/**
 * Helper function: Create new task from archetype
 */
export function createTaskFromArchetype(
  workspaceId: string,
  brandSlug: string,
  archetype: TaskArchetype,
  createdBy: string,
  overrides?: Partial<FounderTask>
): Partial<FounderTask> {
  const definition = TASK_LIBRARY[archetype];

  if (!definition) {
    throw new Error(`Invalid task archetype: ${archetype}`);
  }

  const task: Partial<FounderTask> = {
    workspace_id: workspaceId,
    brand_slug: brandSlug,
    archetype,
    title: definition.label,
    description: definition.description,
    priority: 'medium',
    status: 'draft',
    channels: definition.default_channels,
    created_by: createdBy,
    assigned_to: 'ai',
    metadata: {
      ai_generated: true,
    },
    ...overrides,
  };

  return task;
}

/**
 * Helper function: Get all task archetypes as array
 */
export function getAllTaskArchetypes(): TaskArchetype[] {
  return Object.keys(TASK_LIBRARY) as TaskArchetype[];
}
