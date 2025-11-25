/**
 * Workflow Engine
 *
 * Decomposes high-level business objectives into concrete agent tasks.
 * Builds workflows from intent-based patterns and maintains workflow templates.
 */

import type { WorkflowObjective, WorkflowTask } from './coordinationAgent';

/**
 * Common workflow templates for standard business objectives
 */
const WORKFLOW_TEMPLATES: Record<string, (objective: WorkflowObjective) => WorkflowTask[]> = {
  'lead_nurture': buildLeadNurtureWorkflow,
  'campaign_launch': buildCampaignWorkflow,
  'market_research': buildMarketResearchWorkflow,
  'competitive_analysis': buildCompetitiveAnalysisWorkflow,
  'content_series': buildContentSeriesWorkflow,
  'sales_acceleration': buildSalesAccelerationWorkflow,
  'product_launch': buildProductLaunchWorkflow,
  'crisis_response': buildCrisisResponseWorkflow,
};

/**
 * Decompose objective into agent tasks using template matching
 */
export function decomposeObjective(objective: WorkflowObjective): WorkflowTask[] {
  // Try to match objective to template
  for (const [pattern, builder] of Object.entries(WORKFLOW_TEMPLATES)) {
    if (matchesPattern(objective.objective, pattern)) {
      return builder(objective);
    }
  }

  // Fallback: Generic decomposition
  return decomposeGeneric(objective);
}

/**
 * Build lead nurture workflow (Research → Content → Email → Schedule → Analysis)
 */
function buildLeadNurtureWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-market',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: extractKeyword(objective.objective, 'market|industry|trends'),
        category: 'industry',
      },
      priority: 80,
    },
    {
      id: 'create-content',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'email',
        topic: extractKeyword(objective.objective, 'about|regarding|on'),
        audience: extractKeyword(objective.objective, 'to|for|audience'),
      },
      dependencies: ['research-market'],
      priority: 75,
    },
    {
      id: 'send-email',
      agent: 'email',
      action: 'compose',
      params: {
        brand: objective.brand,
        subject: 'Strategic Opportunity',
        personalizedContent: true,
      },
      dependencies: ['create-content'],
      priority: 70,
    },
    {
      id: 'schedule-followup',
      agent: 'scheduling',
      action: 'propose_meeting',
      params: {
        brand: objective.brand,
        durationMinutes: 30,
        daysAhead: 7,
      },
      dependencies: ['send-email'],
      priority: 65,
    },
    {
      id: 'analyze-results',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '7d',
        focus: 'engagement_metrics',
      },
      dependencies: ['schedule-followup'],
      priority: 60,
    },
  ];
}

/**
 * Build campaign launch workflow
 */
function buildCampaignWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-audience',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'target audience preferences and behaviors',
        category: 'market',
      },
      priority: 85,
    },
    {
      id: 'research-competitors',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'competitor campaign strategies',
        category: 'competitor',
      },
      priority: 80,
    },
    {
      id: 'create-email',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'email',
        topic: extractKeyword(objective.objective, 'campaign|launch|announce'),
      },
      dependencies: ['research-audience', 'research-competitors'],
      priority: 75,
    },
    {
      id: 'create-social',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: extractKeyword(objective.objective, 'campaign|launch|announce'),
      },
      dependencies: ['research-audience'],
      priority: 75,
    },
    {
      id: 'analyze-draft',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '24h',
        focus: 'content_quality',
      },
      dependencies: ['create-email', 'create-social'],
      priority: 70,
    },
  ];
}

/**
 * Build market research workflow
 */
function buildMarketResearchWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-trends',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: extractKeyword(objective.objective, 'research|analyze|study'),
        category: 'industry',
      },
      priority: 90,
      estimatedDuration: 180,
    },
    {
      id: 'research-keywords',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'SEO keywords and search volume',
        category: 'market',
      },
      priority: 85,
    },
    {
      id: 'research-competitors',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'competitor landscape and positioning',
        category: 'competitor',
      },
      priority: 85,
    },
    {
      id: 'generate-report',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'article',
        topic: 'Market Research Findings',
      },
      dependencies: ['research-trends', 'research-keywords', 'research-competitors'],
      priority: 80,
    },
    {
      id: 'analyze-findings',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '30d',
        focus: 'market_intelligence',
      },
      dependencies: ['generate-report'],
      priority: 75,
    },
  ];
}

/**
 * Build competitive analysis workflow
 */
function buildCompetitiveAnalysisWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-comp1',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'competitor products and features',
        category: 'competitor',
      },
      priority: 88,
    },
    {
      id: 'research-comp2',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'competitor pricing and positioning',
        category: 'competitor',
      },
      priority: 88,
    },
    {
      id: 'research-comp3',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'competitor marketing strategies',
        category: 'competitor',
      },
      priority: 85,
    },
    {
      id: 'create-analysis',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'article',
        topic: 'Competitive Analysis Report',
      },
      dependencies: ['research-comp1', 'research-comp2', 'research-comp3'],
      priority: 80,
    },
  ];
}

/**
 * Build content series workflow
 */
function buildContentSeriesWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  const tasks: WorkflowTask[] = [];

  // Create 5-part series
  for (let i = 0; i < 5; i++) {
    const taskId = `content-${i + 1}`;
    tasks.push({
      id: taskId,
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: `${extractKeyword(objective.objective, 'series|course|guide')} - Part ${i + 1}`,
        part: i + 1,
      },
      dependencies: i > 0 ? [`content-${i}`] : undefined,
      priority: 75 - i * 3,
    });
  }

  // Analysis task depends on all content
  tasks.push({
    id: 'analyze-series',
    agent: 'analysis',
    action: 'analyze',
    params: {
      brand: objective.brand,
      timeframe: '30d',
      focus: 'content_performance',
    },
    dependencies: tasks.map((t) => t.id),
    priority: 70,
  });

  return tasks;
}

/**
 * Build sales acceleration workflow
 */
function buildSalesAccelerationWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-buyer',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'buyer psychology and decision factors',
        category: 'market',
      },
      priority: 90,
    },
    {
      id: 'create-pitch',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'email',
        topic: 'Sales Pitch',
        audience: 'Prospect',
      },
      dependencies: ['research-buyer'],
      priority: 85,
    },
    {
      id: 'create-social',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: 'Social Proof and Success Stories',
      },
      priority: 80,
    },
    {
      id: 'schedule-calls',
      agent: 'scheduling',
      action: 'propose_meeting',
      params: {
        brand: objective.brand,
        durationMinutes: 45,
        daysAhead: 14,
      },
      dependencies: ['create-pitch'],
      priority: 80,
    },
    {
      id: 'analyze-pipeline',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '30d',
        focus: 'sales_metrics',
      },
      dependencies: ['schedule-calls'],
      priority: 75,
    },
  ];
}

/**
 * Build product launch workflow
 */
function buildProductLaunchWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-launch',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: 'product launch best practices and strategies',
        category: 'industry',
      },
      priority: 95,
    },
    {
      id: 'create-announcement',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'email',
        topic: 'Product Launch Announcement',
      },
      dependencies: ['research-launch'],
      priority: 90,
    },
    {
      id: 'create-social-series',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: 'Product Features and Benefits',
      },
      dependencies: ['research-launch'],
      priority: 85,
    },
    {
      id: 'create-article',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'article',
        topic: 'The Story Behind the Product',
      },
      dependencies: ['research-launch'],
      priority: 80,
    },
    {
      id: 'schedule-webinar',
      agent: 'scheduling',
      action: 'propose_meeting',
      params: {
        brand: objective.brand,
        durationMinutes: 60,
        daysAhead: 14,
      },
      dependencies: ['create-announcement'],
      priority: 85,
    },
    {
      id: 'analyze-launch',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '7d',
        focus: 'launch_metrics',
      },
      dependencies: ['schedule-webinar'],
      priority: 80,
    },
  ];
}

/**
 * Build crisis response workflow
 */
function buildCrisisResponseWorkflow(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research-crisis',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: extractKeyword(objective.objective, 'crisis|issue|problem'),
        category: 'market',
      },
      priority: 100,
      estimatedDuration: 60,
    },
    {
      id: 'create-response',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'email',
        topic: 'Crisis Response Statement',
        audience: 'Stakeholders',
      },
      dependencies: ['research-crisis'],
      priority: 100,
      estimatedDuration: 120,
    },
    {
      id: 'create-social-response',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: 'Public Statement',
      },
      dependencies: ['research-crisis'],
      priority: 100,
    },
  ];
}

/**
 * Generic objective decomposition
 */
function decomposeGeneric(objective: WorkflowObjective): WorkflowTask[] {
  return [
    {
      id: 'research',
      agent: 'research',
      action: 'query',
      params: {
        brand: objective.brand,
        query: objective.objective,
        category: 'market',
      },
      priority: 80,
    },
    {
      id: 'create-content',
      agent: 'content',
      action: 'generate',
      params: {
        brand: objective.brand,
        intent: 'post',
        topic: objective.objective,
      },
      dependencies: ['research'],
      priority: 75,
    },
    {
      id: 'analyze',
      agent: 'analysis',
      action: 'analyze',
      params: {
        brand: objective.brand,
        timeframe: '7d',
      },
      dependencies: ['create-content'],
      priority: 70,
    },
  ];
}

/**
 * Check if objective matches a workflow pattern
 */
function matchesPattern(objective: string, pattern: string): boolean {
  const objectiveLower = objective.toLowerCase();
  const patternKeywords = pattern.split('_');
  return patternKeywords.some((keyword) => objectiveLower.includes(keyword));
}

/**
 * Extract keyword from objective using pattern
 */
function extractKeyword(text: string, pattern: string): string {
  const patterns = pattern.split('|');
  for (const p of patterns) {
    const regex = new RegExp(`\\b(\\w+)\\s+${p}\\b|${p}\\s+(\\w+)\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1] || match[2] || 'Unknown';
    }
  }
  return 'General';
}
