// Utility functions for Claude AI integration

import type {
  AutoReplyResult,
  PersonaResult,
  StrategyResult,
  CampaignResult,
  HooksResult,
  MindmapResult,
  EmailData,
} from './types';

// Validate email data
export function validateEmailData(email: Partial<EmailData>): email is EmailData {
  return !!(email.from && email.subject && email.body);
}

// Format email template into plain text
export function formatEmailTemplate(template: AutoReplyResult['emailTemplate']): string {
  return `${template.greeting}

${template.acknowledgment}

${template.body}

${template.closing}

${template.signature}`;
}

// Extract summary from persona
export function getPersonaSummary(persona: PersonaResult['persona']): string {
  const topPainPoints = persona.painPoints
    .filter((p) => p.severity === 'high')
    .map((p) => p.pain)
    .slice(0, 3);

  const topGoals = persona.goals
    .filter((g) => g.priority === 'high')
    .map((g) => g.goal)
    .slice(0, 3);

  return `${persona.name} - ${persona.tagline}

Top Pain Points:
${topPainPoints.map((p) => `- ${p}`).join('\n')}

Top Goals:
${topGoals.map((g) => `- ${g}`).join('\n')}

Preferred Channels: ${persona.communication.preferredChannels.join(', ')}`;
}

// Extract key platforms from strategy
export function getKeyPlatforms(strategy: StrategyResult['strategy']): string[] {
  return strategy.platforms
    .filter((p) => p.priority === 'high')
    .map((p) => p.platform);
}

// Calculate total campaign budget
export function calculateCampaignBudget(campaign: CampaignResult['campaign']): {
  total: string;
  breakdown: Array<{ platform: string; amount: string }>;
} {
  return {
    total: campaign.budget.total,
    breakdown: campaign.budget.allocation.map((alloc) => ({
      platform: alloc.platform,
      amount: alloc.amount,
    })),
  };
}

// Get top performing hooks
export function getTopHooks(hooksResult: HooksResult, limit: number = 5): HooksResult['hooks'] {
  return hooksResult.hooks
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, limit);
}

// Group hooks by platform
export function groupHooksByPlatform(hooks: HooksResult['hooks']): Record<string, HooksResult['hooks']> {
  return hooks.reduce((acc, hook) => {
    if (!acc[hook.platform]) {
      acc[hook.platform] = [];
    }
    acc[hook.platform].push(hook);
    return acc;
  }, {} as Record<string, HooksResult['hooks']>);
}

// Group hooks by funnel stage
export function groupHooksByFunnelStage(hooks: HooksResult['hooks']): Record<string, HooksResult['hooks']> {
  return hooks.reduce((acc, hook) => {
    if (!acc[hook.funnelStage]) {
      acc[hook.funnelStage] = [];
    }
    acc[hook.funnelStage].push(hook);
    return acc;
  }, {} as Record<string, HooksResult['hooks']>);
}

// Get mindmap root nodes
export function getMindmapRootNodes(mindmap: MindmapResult['mindmap']): MindmapResult['mindmap']['nodes'] {
  return mindmap.nodes.filter((node) => node.depth === 1);
}

// Get mindmap node children
export function getMindmapNodeChildren(
  mindmap: MindmapResult['mindmap'],
  parentId: string
): MindmapResult['mindmap']['nodes'] {
  return mindmap.nodes.filter((node) => node.parentId === parentId);
}

// Calculate mindmap statistics
export function getMindmapStats(mindmap: MindmapResult['mindmap']): {
  totalNodes: number;
  totalRelationships: number;
  nodesByType: Record<string, number>;
  avgDepth: number;
  maxDepth: number;
} {
  const nodesByType = mindmap.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const depths = mindmap.nodes.map((n) => n.depth);
  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
  const maxDepth = Math.max(...depths);

  return {
    totalNodes: mindmap.nodes.length,
    totalRelationships: mindmap.relationships.length,
    nodesByType,
    avgDepth: Math.round(avgDepth * 10) / 10,
    maxDepth,
  };
}

// Validate API response
export function isValidAIResponse<T>(response: any): response is { success: true; data: T } {
  return response && response.success === true && response.data !== undefined;
}

// Extract error message from API response
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
return error;
}
  if (error?.error) {
return error.error;
}
  if (error?.details) {
return error.details;
}
  if (error?.message) {
return error.message;
}
  return 'An unknown error occurred';
}

// Retry helper for API calls
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Sanitize input text
export function sanitizeInput(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 50000); // Limit to 50k characters
}

// Format timestamp
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate confidence level description
export function getConfidenceDescription(score: number): string {
  if (score >= 80) {
return 'High confidence';
}
  if (score >= 60) {
return 'Medium confidence';
}
  if (score >= 40) {
return 'Low confidence';
}
  return 'Very low confidence';
}

// Generate unique session ID
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Parse JSON safely
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Merge email threads
export function mergeEmailThreads(emails: EmailData[]): string {
  return emails
    .map((email, i) => {
      const separator = i === 0 ? '' : '\n\n---\n\n';
      return `${separator}From: ${email.from}
Subject: ${email.subject}
${email.date ? `Date: ${email.date}` : ''}

${email.body}`;
    })
    .join('');
}

// Extract keywords from text
export function extractKeywords(text: string, limit: number = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const frequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
return text;
}
  return text.slice(0, maxLength - 3) + '...';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
clearTimeout(timeout);
}
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
