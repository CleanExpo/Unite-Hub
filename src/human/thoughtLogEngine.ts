/**
 * Phase 10 – Thought Log Engine
 *
 * Implements continuous thought/idea capture: captures ideas from voice, text, or glasses input;
 * tags them by domain and urgency; routes them through the Personal Advisor and Business Brain
 * for evaluation and integration.
 */

export interface ThoughtEntry {
  id: string;
  created_at: string;
  owner: string;
  input_method: 'voice' | 'text' | 'glasses' | 'manual';
  raw_input: string;
  domain: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'captured' | 'processing' | 'evaluated' | 'archived';
  tags: string[];
  advisor_routing?: {
    routed_to: string;
    received_at: string;
    response_summary: string;
  };
  action_items?: string[];
  follow_up_date?: string;
}

/**
 * Capture a new thought/idea
 */
export function captureThought(input: {
  owner: string;
  input_method: 'voice' | 'text' | 'glasses' | 'manual';
  raw_input: string;
}): ThoughtEntry {
  // Infer domain and urgency from input (in production: use Claude to analyze)
  const domains = inferDomains(input.raw_input);
  const urgency = inferUrgency(input.raw_input);
  const tags = extractTags(input.raw_input);

  return {
    id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    owner: input.owner,
    input_method: input.input_method,
    raw_input: input.raw_input,
    domain: domains,
    urgency,
    status: 'captured',
    tags,
  };
}

/**
 * Infer domains from thought text
 */
function inferDomains(text: string): string[] {
  const domains: string[] = [];
  const lowerText = text.toLowerCase();

  const domainPatterns: Record<string, string[]> = {
    business: ['revenue', 'sales', 'customer', 'market', 'product', 'growth', 'team', 'hiring'],
    financial: ['cost', 'spend', 'budget', 'profit', 'margin', 'investment', 'burn', 'runway'],
    operational: ['process', 'workflow', 'system', 'efficiency', 'automation', 'tool'],
    product: ['feature', 'build', 'design', 'user experience', 'ux', 'roadmap'],
    marketing: ['campaign', 'content', 'messaging', 'brand', 'social', 'launch'],
    personal: ['wellbeing', 'health', 'learning', 'balance', 'goal', 'habit'],
    relationship: ['team', 'communication', 'feedback', 'culture', 'trust'],
    strategic: ['vision', 'strategy', 'direction', 'partnership', 'pivot', 'opportunity'],
  };

  for (const [domain, keywords] of Object.entries(domainPatterns)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      domains.push(domain);
    }
  }

  return domains.length > 0 ? domains : ['other'];
}

/**
 * Infer urgency from thought text
 */
function inferUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerText = text.toLowerCase();

  const criticalKeywords = ['urgent', 'asap', 'critical', 'emergency', 'immediately', 'right now'];
  if (criticalKeywords.some((kw) => lowerText.includes(kw))) {
return 'critical';
}

  const highKeywords = ['important', 'soon', 'this week', 'deadline', 'decision needed'];
  if (highKeywords.some((kw) => lowerText.includes(kw))) {
return 'high';
}

  const mediumKeywords = ['consider', 'maybe', 'think about', 'explore', 'opportunity'];
  if (mediumKeywords.some((kw) => lowerText.includes(kw))) {
return 'medium';
}

  return 'low';
}

/**
 * Extract hashtags/keywords from thought
 */
function extractTags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  if (matches) {
    return matches.map((m) => m.substring(1)); // Remove #
  }
  return [];
}

/**
 * Route thought to personal advisor for evaluation
 */
export function routeToAdvisor(thought: ThoughtEntry): {
  advisor_type: string;
  routing_priority: string;
  expected_evaluation_time_minutes: number;
} {
  const advisorMap: Record<string, string> = {
    business: 'business_advisor',
    financial: 'financial_advisor',
    operational: 'ops_advisor',
    product: 'product_advisor',
    marketing: 'marketing_advisor',
    personal: 'personal_advisor',
    relationship: 'people_advisor',
    strategic: 'strategic_advisor',
  };

  const primaryDomain = thought.domain[0] || 'general';
  const advisorType = advisorMap[primaryDomain] || 'general_advisor';

  const timeMap: Record<string, number> = {
    critical: 5,
    high: 15,
    medium: 30,
    low: 60,
  };

  return {
    advisor_type: advisorType,
    routing_priority: thought.urgency,
    expected_evaluation_time_minutes: timeMap[thought.urgency],
  };
}

/**
 * Update thought with advisor response
 */
export function recordAdvisorResponse(
  thought: ThoughtEntry,
  response: {
    advisor_type: string;
    response_summary: string;
    recommended_actions: string[];
    follow_up_date?: string;
  }
): ThoughtEntry {
  return {
    ...thought,
    status: 'evaluated',
    advisor_routing: {
      routed_to: response.advisor_type,
      received_at: new Date().toISOString(),
      response_summary: response.response_summary,
    },
    action_items: response.recommended_actions,
    follow_up_date: response.follow_up_date,
  };
}

/**
 * Query thought log with filters
 */
export function queryThoughtLog(
  owner: string,
  filters: {
    domain?: string;
    urgency?: string;
    status?: string;
    days_back?: number;
  }
): ThoughtEntry[] {
  // In production: query Supabase
  // For MVP: return mock data
  return [
    {
      id: 'thought_1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      owner,
      input_method: 'voice',
      raw_input: 'Need to optimize customer onboarding flow',
      domain: ['product', 'operational'],
      urgency: 'high',
      status: 'evaluated',
      tags: ['product', 'customer-experience'],
      advisor_routing: {
        routed_to: 'product_advisor',
        received_at: new Date(Date.now() - 1800000).toISOString(),
        response_summary: 'Break onboarding into smaller milestones, add progress tracking',
      },
      action_items: ['Review current onboarding steps', 'Design new flow', 'Test with users'],
    },
  ];
}

/**
 * Archive old thought entries
 */
export function archiveThought(thoughtId: string): ThoughtEntry {
  // In production: update in Supabase
  return {
    id: thoughtId,
    created_at: new Date().toISOString(),
    owner: 'unknown',
    input_method: 'text',
    raw_input: '',
    domain: [],
    urgency: 'low',
    status: 'archived',
    tags: [],
  };
}
