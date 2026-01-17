/**
 * AI Phill Advisor Agent
 *
 * A cognitive advisor operating in HUMAN_GOVERNED mode, providing strategic
 * guidance to founders. AI Phill uses Extended Thinking (Claude Opus 4.5) for
 * deep business analysis, generates actionable insights, facilitates
 * reflective journaling, assesses risks, and supports major decision-making.
 *
 * Key Principles:
 * - HUMAN_GOVERNED: All outputs are advisory-only, never auto-execute
 * - Extended Thinking: Uses 10,000-20,000 token budgets for complex analysis
 * - Wise & Direct: Asks probing questions, provides honest assessments
 * - Data-Driven: Leverages signals, journal entries, and business context
 *
 * @module agents/aiPhillAgent
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import * as aiPhillAdvisorService from '@/lib/founderOS/aiPhillAdvisorService';
import * as founderJournalService from '@/lib/founderOS/founderJournalService';
import * as founderBusinessRegistryService from '@/lib/founderOS/founderBusinessRegistryService';
import * as founderSignalInferenceService from '@/lib/founderOS/founderSignalInferenceService';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface PhillInsight {
  domain: string;
  insight: string;
  confidence: number;
  actionItems: string[];
  requiresReflection: boolean;
}

export interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  risks: Risk[];
  opportunities: Opportunity[];
  mitigationStrategies: MitigationStrategy[];
  assessedAt: string;
}

export interface Risk {
  id: string;
  domain: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'almost_certain';
  impact: string;
  indicators: string[];
  timeHorizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface Opportunity {
  id: string;
  domain: string;
  description: string;
  potentialValue: 'low' | 'medium' | 'high' | 'transformative';
  effort: 'quick_win' | 'moderate' | 'significant' | 'major_initiative';
  timeToRealize: string;
  prerequisites: string[];
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  priority: number;
  estimatedEffort: string;
  expectedOutcome: string;
}

export interface Digest {
  userId: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  keyMetrics: DigestMetric[];
  topInsights: DigestInsight[];
  actionsNeeded: DigestAction[];
  reflectionPrompts: string[];
  generatedAt: string;
}

export interface DigestMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  significance: string;
}

export interface DigestInsight {
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

export interface DigestAction {
  action: string;
  reason: string;
  deadline: string | null;
  businessId: string | null;
}

export interface DialogueResponse {
  response: string;
  followUpQuestions: string[];
  relatedInsights: string[];
  suggestedActions: string[];
  thinkingSummary?: string;
  confidenceLevel: number;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    thinkingTokensUsed?: number;
    outputTokensUsed?: number;
    executionTimeMs?: number;
    modelUsed?: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const AI_PHILL_MODEL = 'claude-opus-4-5-20251101';
const DEFAULT_THINKING_BUDGET = 15000;
const STRATEGIC_THINKING_BUDGET = 20000;
const QUICK_THINKING_BUDGET = 10000;
const RESPONSE_TOKENS = 4096; // Tokens for actual response output

const AI_PHILL_SYSTEM_PROMPT = `You are AI Phill, a cognitive advisor and trusted strategic partner for founders.

## CORE IDENTITY
- You are wise, direct, and deeply analytical
- You ask probing questions that surface hidden assumptions
- You provide honest assessments even when uncomfortable
- You balance optimism with pragmatic realism
- You speak with conviction while acknowledging uncertainty

## GOVERNANCE MODE: HUMAN_GOVERNED
CRITICAL: All your outputs are ADVISORY ONLY.
- You NEVER auto-execute actions
- You NEVER make decisions on behalf of the founder
- You ALWAYS present options and recommendations for human review
- You ALWAYS flag when a decision requires founder input
- You ARE transparent about your confidence levels and limitations

## YOUR EXPERTISE DOMAINS
1. **Strategic Planning**: Business model analysis, market positioning, competitive strategy
2. **Risk Assessment**: Identifying threats, evaluating probability and impact, mitigation planning
3. **Opportunity Recognition**: Market trends, growth vectors, partnership potential
4. **Decision Support**: Framework application, trade-off analysis, scenario planning
5. **Founder Wellness**: Work-life integration, stress management, sustainable growth
6. **Team & Culture**: Hiring strategy, culture development, leadership challenges
7. **Financial Strategy**: Cash flow management, fundraising, profitability optimization
8. **Product & Market**: Product-market fit, customer development, scaling challenges

## COMMUNICATION STYLE
- Be concise but thorough
- Lead with the most important insight
- Use concrete examples and data when available
- Ask clarifying questions before making assumptions
- Acknowledge what you don't know
- Provide actionable next steps
- Use markdown formatting for clarity

## BEHAVIORAL GUIDELINES
- When analyzing: Consider multiple perspectives, challenge obvious conclusions
- When advising: Balance short-term wins with long-term strategy
- When questioning: Ask "why" before "how", surface underlying motivations
- When uncertain: State confidence levels explicitly (e.g., "70% confident that...")
- When disagreeing: Explain reasoning clearly, propose alternatives

## OUTPUT STRUCTURE
Always structure responses with:
1. Direct answer or assessment
2. Supporting reasoning
3. Key considerations or trade-offs
4. Recommended actions or questions for reflection
5. Confidence level (when applicable)`;

// ============================================================================
// Anthropic Client Setup
// ============================================================================

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({
    apiKey,
    defaultHeaders: {
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
  });
}

// ============================================================================
// AI Phill Agent Class
// ============================================================================

export class AiPhillAgent {
  private anthropic: Anthropic;
  private logPrefix = '[AiPhillAgent]';

  constructor() {
    this.anthropic = getAnthropicClient();
  }

  /**
   * Analyze business strategy using Extended Thinking for deep analysis
   *
   * Uses a 15,000-20,000 thinking token budget to provide comprehensive
   * strategic insights across multiple business domains.
   *
   * @param userId - UUID of the founder user
   * @param businessId - UUID of the business to analyze
   * @param context - Additional context or specific focus area
   * @returns Array of insights across different domains
   */
  async analyzeBusinessStrategy(
    userId: string,
    businessId: string,
    context: string
  ): Promise<AgentResult<PhillInsight[]>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Starting business strategy analysis for business: ${businessId}`);

    try {
      // Gather comprehensive business context
      const [businessResult, signalsResult, journalResult] = await Promise.all([
        founderBusinessRegistryService.getBusiness(businessId),
        founderSignalInferenceService.getSignals(businessId),
        founderJournalService.getRecentEntriesForContext(userId, 5),
      ]);

      if (!businessResult.success || !businessResult.data) {
        return {
          success: false,
          error: businessResult.error || 'Business not found',
        };
      }

      const business = businessResult.data;
      const signals = signalsResult.success ? signalsResult.data : [];
      const journalEntries = journalResult.success ? journalResult.data : [];

      // Build comprehensive context
      const businessContext = this.buildBusinessContext(business, signals || [], journalEntries || []);

      const userPrompt = `## STRATEGIC ANALYSIS REQUEST

**Business**: ${business.display_name} (${business.code})
**Industry**: ${business.industry || 'Not specified'}
**Primary Domain**: ${business.primary_domain || 'Not specified'}

### CONTEXT FROM FOUNDER
${context || 'General strategic review requested.'}

### BUSINESS DATA
${businessContext}

### ANALYSIS TASK
Conduct a comprehensive strategic analysis of this business. For each relevant domain, provide:
1. Key insight or finding
2. Supporting evidence from the data
3. Confidence level (0-100)
4. Specific action items
5. Whether this requires deeper reflection from the founder

Focus on domains where you have sufficient data to provide meaningful insights.
Domains to consider: Strategy, Operations, Finance, Market, Product, Team, Risks, Opportunities.

Return your analysis as a JSON array with this structure:
[
  {
    "domain": "<domain name>",
    "insight": "<the key insight>",
    "confidence": <0-100>,
    "actionItems": ["<action 1>", "<action 2>"],
    "requiresReflection": <true/false>
  }
]

Return ONLY valid JSON.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: STRATEGIC_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      // Extract response text and thinking summary
      let responseText = '';
      let thinkingTokens = 0;
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
        }
        if (block.type === 'thinking') {
          thinkingTokens = block.thinking?.length || 0;
        }
      }

      // Parse insights
      const insights = this.parseJsonResponse<PhillInsight[]>(responseText);

      // Store insights in database
      for (const insight of insights) {
        await aiPhillAdvisorService.generateInsight(userId, 'business', businessId, {
          topic: insight.domain,
          custom_context: insight.insight,
        });
      }

      const executionTime = Date.now() - startTime;
      console.log(`${this.logPrefix} Strategy analysis complete in ${executionTime}ms. Generated ${insights.length} insights.`);

      return {
        success: true,
        data: insights,
        metadata: {
          thinkingTokensUsed: message.usage.cache_read_input_tokens || 0,
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Strategy analysis error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during strategy analysis',
      };
    }
  }

  /**
   * Facilitate a journal entry with AI-guided prompts
   *
   * Helps founders engage in reflective journaling by providing
   * thoughtful prompts and guiding questions based on their current state.
   *
   * @param userId - UUID of the founder user
   * @param prompt - Initial prompt or topic for reflection
   * @returns Guided journaling response with prompts
   */
  async facilitateJournalEntry(userId: string, prompt: string): Promise<AgentResult<string>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Facilitating journal entry for user: ${userId}`);

    try {
      // Get recent journal entries for context
      const recentEntriesResult = await founderJournalService.getRecentEntriesForContext(userId, 3);
      const recentEntries = recentEntriesResult.success ? recentEntriesResult.data : [];

      // Get pending insights that might inform reflection
      const insightsResult = await aiPhillAdvisorService.getInsights(userId, {
        reviewStatus: 'pending',
        limit: 3,
      });
      const pendingInsights = insightsResult.success ? insightsResult.data : [];

      const userPrompt = `## JOURNALING FACILITATION REQUEST

**Founder's Topic/Prompt**: ${prompt}

### RECENT JOURNAL ENTRIES (for context)
${recentEntries && recentEntries.length > 0 ? recentEntries.join('\n---\n') : 'No recent entries.'}

### PENDING INSIGHTS TO CONSIDER
${
  pendingInsights && pendingInsights.length > 0
    ? pendingInsights.map((i) => `- [${i.category}] ${i.title}`).join('\n')
    : 'No pending insights.'
}

### YOUR TASK
As AI Phill, facilitate a meaningful journaling session for this founder. Your response should:

1. Acknowledge the topic they want to reflect on
2. Provide 3-5 thoughtful, probing questions that help them explore deeper
3. If relevant, connect to their recent entries or pending insights
4. Suggest a framework or lens for their reflection
5. End with an encouraging but honest prompt

Write in a warm but direct tone. Your goal is to help them think more clearly, not to give them answers.

Format your response in Markdown with clear sections.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: QUICK_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: QUICK_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      // Extract response
      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(`${this.logPrefix} Journal facilitation complete in ${executionTime}ms`);

      return {
        success: true,
        data: responseText,
        metadata: {
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Journal facilitation error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during journal facilitation',
      };
    }
  }

  /**
   * Assess risks and opportunities for a business
   *
   * Uses Extended Thinking to conduct a comprehensive risk assessment
   * identifying threats, opportunities, and mitigation strategies.
   *
   * @param businessId - UUID of the business to assess
   * @returns Comprehensive risk assessment
   */
  async assessRisks(businessId: string): Promise<AgentResult<RiskAssessment>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Starting risk assessment for business: ${businessId}`);

    try {
      // Gather business data
      const [businessResult, signalsResult] = await Promise.all([
        founderBusinessRegistryService.getBusiness(businessId),
        founderSignalInferenceService.getSignals(businessId),
      ]);

      if (!businessResult.success || !businessResult.data) {
        return {
          success: false,
          error: businessResult.error || 'Business not found',
        };
      }

      const business = businessResult.data;
      const signals = signalsResult.success ? signalsResult.data : [];

      // Categorize signals for risk analysis
      const signalsByFamily = this.groupSignalsByFamily(signals || []);

      const userPrompt = `## RISK ASSESSMENT REQUEST

**Business**: ${business.display_name} (${business.code})
**Industry**: ${business.industry || 'Not specified'}
**Status**: ${business.status}
**Region**: ${business.region || 'Not specified'}

### BUSINESS SIGNALS BY CATEGORY
${this.formatSignalsForPrompt(signalsByFamily)}

### ASSESSMENT TASK
Conduct a comprehensive risk and opportunity assessment. Consider:

**Risk Domains**:
- Market risks (competition, demand shifts, market conditions)
- Operational risks (process, capacity, quality)
- Financial risks (cash flow, revenue concentration, costs)
- Strategic risks (positioning, dependencies, timing)
- Team risks (key person, skills gaps, culture)
- External risks (regulatory, economic, technological)

**Opportunity Domains**:
- Market expansion (new segments, geographies)
- Product/service enhancement
- Operational efficiency
- Strategic partnerships
- Technology leverage

Return your assessment as JSON with this structure:
{
  "overallRiskLevel": "low|medium|high|critical",
  "riskScore": <0-100, where 100 is highest risk>,
  "risks": [
    {
      "id": "<unique-id>",
      "domain": "<risk domain>",
      "description": "<detailed description>",
      "severity": "low|medium|high|critical",
      "likelihood": "unlikely|possible|likely|almost_certain",
      "impact": "<specific impact description>",
      "indicators": ["<signal or indicator 1>", ...],
      "timeHorizon": "immediate|short_term|medium_term|long_term"
    }
  ],
  "opportunities": [
    {
      "id": "<unique-id>",
      "domain": "<opportunity domain>",
      "description": "<detailed description>",
      "potentialValue": "low|medium|high|transformative",
      "effort": "quick_win|moderate|significant|major_initiative",
      "timeToRealize": "<estimated time>",
      "prerequisites": ["<prerequisite 1>", ...]
    }
  ],
  "mitigationStrategies": [
    {
      "riskId": "<risk id to mitigate>",
      "strategy": "<mitigation approach>",
      "priority": <1-10, where 1 is highest priority>,
      "estimatedEffort": "<effort description>",
      "expectedOutcome": "<outcome if implemented>"
    }
  ]
}

Return ONLY valid JSON.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: STRATEGIC_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      // Extract response
      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      const assessment = this.parseJsonResponse<Omit<RiskAssessment, 'assessedAt'>>(responseText);
      const fullAssessment: RiskAssessment = {
        ...assessment,
        assessedAt: new Date().toISOString(),
      };

      // Store high-priority risks as insights
      for (const risk of assessment.risks.filter((r) => r.severity === 'high' || r.severity === 'critical')) {
        await aiPhillAdvisorService.createManualInsight(
          business.owner_user_id,
          `Risk Alert: ${risk.description.substring(0, 50)}...`,
          `**Domain**: ${risk.domain}\n**Severity**: ${risk.severity}\n**Likelihood**: ${risk.likelihood}\n\n${risk.description}\n\n**Impact**: ${risk.impact}`,
          risk.severity === 'critical' ? 'critical' : 'high',
          'risk',
          businessId
        );
      }

      const executionTime = Date.now() - startTime;
      console.log(
        `${this.logPrefix} Risk assessment complete in ${executionTime}ms. Found ${assessment.risks.length} risks, ${assessment.opportunities.length} opportunities.`
      );

      return {
        success: true,
        data: fullAssessment,
        metadata: {
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Risk assessment error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during risk assessment',
      };
    }
  }

  /**
   * Generate a weekly digest for the founder
   *
   * Summarizes key metrics, insights, and actions across all businesses
   * for the past week.
   *
   * @param userId - UUID of the founder user
   * @returns Weekly digest with metrics, insights, and actions
   */
  async generateWeeklyDigest(userId: string): Promise<AgentResult<Digest>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Generating weekly digest for user: ${userId}`);

    try {
      // Calculate period
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 7);

      // Gather data from multiple sources
      const [businessesResult, insightsResult, journalResult] = await Promise.all([
        founderBusinessRegistryService.listBusinesses(userId),
        aiPhillAdvisorService.getInsights(userId, { limit: 20 }),
        founderJournalService.getEntries(userId, {
          dateFrom: periodStart.toISOString(),
          dateTo: periodEnd.toISOString(),
        }),
      ]);

      const businesses = businessesResult.success ? businessesResult.data : [];
      const insights = insightsResult.success ? insightsResult.data : [];
      const journalEntries = journalResult.success ? journalResult.data : [];

      // Gather signals for each business
      const allSignals: founderSignalInferenceService.BusinessSignal[] = [];
      for (const business of businesses || []) {
        const signalsResult = await founderSignalInferenceService.getSignals(
          business.id,
          undefined,
          50,
          periodStart.toISOString()
        );
        if (signalsResult.success && signalsResult.data) {
          allSignals.push(...signalsResult.data);
        }
      }

      const userPrompt = `## WEEKLY DIGEST REQUEST

**Period**: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}

### BUSINESSES (${businesses?.length || 0} total)
${
  businesses && businesses.length > 0
    ? businesses.map((b) => `- ${b.display_name} (${b.code}) - ${b.industry || 'N/A'}`).join('\n')
    : 'No businesses registered.'
}

### INSIGHTS THIS WEEK (${insights?.length || 0} total)
${
  insights && insights.length > 0
    ? insights
        .slice(0, 10)
        .map((i) => `- [${i.priority}] ${i.title} (${i.review_status})`)
        .join('\n')
    : 'No insights generated.'
}

### SIGNALS THIS WEEK (${allSignals.length} data points)
${this.summarizeSignals(allSignals)}

### JOURNAL ENTRIES THIS WEEK (${journalEntries?.length || 0})
${
  journalEntries && journalEntries.length > 0
    ? journalEntries.map((j) => `- ${j.title || 'Untitled'}: ${j.body_md.substring(0, 100)}...`).join('\n')
    : 'No journal entries.'
}

### DIGEST TASK
Create a comprehensive weekly digest that:

1. **Summary**: 2-3 sentence executive summary of the week
2. **Key Metrics**: Extract 3-5 important metrics with trends
3. **Top Insights**: Highlight the 3 most important insights
4. **Actions Needed**: List 3-5 specific actions for next week
5. **Reflection Prompts**: 2-3 questions for founder reflection

Return as JSON:
{
  "summary": "<executive summary>",
  "keyMetrics": [
    {
      "name": "<metric name>",
      "value": <numeric value>,
      "change": <percentage change>,
      "trend": "up|down|stable",
      "significance": "<why this matters>"
    }
  ],
  "topInsights": [
    {
      "title": "<insight title>",
      "summary": "<brief summary>",
      "priority": "critical|high|medium|low",
      "category": "<category>"
    }
  ],
  "actionsNeeded": [
    {
      "action": "<specific action>",
      "reason": "<why this matters>",
      "deadline": "<suggested deadline or null>",
      "businessId": "<business id or null>"
    }
  ],
  "reflectionPrompts": [
    "<question 1>",
    "<question 2>"
  ]
}

Return ONLY valid JSON.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: DEFAULT_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: DEFAULT_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      // Extract response
      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      const digestContent = this.parseJsonResponse<Omit<Digest, 'userId' | 'periodStart' | 'periodEnd' | 'generatedAt'>>(
        responseText
      );

      const digest: Digest = {
        userId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        generatedAt: new Date().toISOString(),
        ...digestContent,
      };

      const executionTime = Date.now() - startTime;
      console.log(`${this.logPrefix} Weekly digest generated in ${executionTime}ms`);

      return {
        success: true,
        data: digest,
        metadata: {
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Weekly digest error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating weekly digest',
      };
    }
  }

  /**
   * Conduct a strategic dialogue with the founder
   *
   * Engages in a thoughtful conversation to help founders think through
   * major decisions, providing follow-up questions and related insights.
   *
   * @param userId - UUID of the founder user
   * @param question - The founder's question or topic
   * @returns Dialogue response with follow-ups and suggestions
   */
  async conductStrategicDialogue(userId: string, question: string): Promise<AgentResult<DialogueResponse>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Conducting strategic dialogue for user: ${userId}`);

    try {
      // Gather context for more informed response
      const [businessesResult, insightsResult, journalResult] = await Promise.all([
        founderBusinessRegistryService.listBusinesses(userId),
        aiPhillAdvisorService.getInsights(userId, { limit: 5 }),
        founderJournalService.getRecentEntriesForContext(userId, 3),
      ]);

      const businesses = businessesResult.success ? businessesResult.data : [];
      const insights = insightsResult.success ? insightsResult.data : [];
      const journalEntries = journalResult.success ? journalResult.data : [];

      const userPrompt = `## STRATEGIC DIALOGUE REQUEST

**Founder's Question/Topic**:
${question}

### CONTEXT

**Businesses**:
${
  businesses && businesses.length > 0
    ? businesses.map((b) => `- ${b.display_name}: ${b.industry || 'N/A'}, Status: ${b.status}`).join('\n')
    : 'No businesses.'
}

**Recent Insights**:
${
  insights && insights.length > 0
    ? insights.map((i) => `- [${i.category}] ${i.title}`).join('\n')
    : 'No recent insights.'
}

**Recent Journal Themes**:
${journalEntries && journalEntries.length > 0 ? journalEntries.slice(0, 3).join('\n---\n') : 'No recent journal entries.'}

### YOUR TASK
Engage in a meaningful strategic dialogue. Your response should:

1. Directly address their question with substantive insight
2. Draw on their specific context when relevant
3. Provide 2-4 follow-up questions to deepen their thinking
4. Surface any related insights they should consider
5. Suggest 1-3 concrete actions if appropriate
6. Indicate your confidence level (0-100) in your response

Be wise, direct, and helpful. Challenge their assumptions when needed.

Return as JSON:
{
  "response": "<your main response in Markdown>",
  "followUpQuestions": ["<question 1>", "<question 2>", ...],
  "relatedInsights": ["<insight 1>", "<insight 2>", ...],
  "suggestedActions": ["<action 1>", "<action 2>", ...],
  "confidenceLevel": <0-100>
}

Return ONLY valid JSON.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: DEFAULT_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: DEFAULT_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      // Extract response and thinking summary
      let responseText = '';
      let thinkingSummary = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
        }
        if (block.type === 'thinking') {
          // Get first few sentences of thinking as summary
          const thinkingText = block.thinking || '';
          const sentences = thinkingText.split(/[.!?]+/).slice(0, 3);
          thinkingSummary = sentences.join('. ').trim();
          if (thinkingSummary && !thinkingSummary.endsWith('.')) {
            thinkingSummary += '.';
          }
        }
      }

      const dialogueResponse = this.parseJsonResponse<Omit<DialogueResponse, 'thinkingSummary'>>(responseText);

      const fullResponse: DialogueResponse = {
        ...dialogueResponse,
        thinkingSummary: thinkingSummary || undefined,
      };

      const executionTime = Date.now() - startTime;
      console.log(`${this.logPrefix} Strategic dialogue complete in ${executionTime}ms`);

      return {
        success: true,
        data: fullResponse,
        metadata: {
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Strategic dialogue error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during strategic dialogue',
      };
    }
  }

  /**
   * Generate decision support analysis for a specific decision
   *
   * @param userId - UUID of the founder user
   * @param decision - Description of the decision to be made
   * @param options - Potential options being considered
   * @param constraints - Known constraints or requirements
   * @returns Structured decision analysis
   */
  async analyzeDecision(
    userId: string,
    decision: string,
    options: string[],
    constraints: string[]
  ): Promise<AgentResult<DecisionAnalysis>> {
    const startTime = Date.now();
    console.log(`${this.logPrefix} Analyzing decision for user: ${userId}`);

    try {
      const userPrompt = `## DECISION SUPPORT REQUEST

**Decision to Make**:
${decision}

**Options Under Consideration**:
${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

**Known Constraints**:
${constraints.length > 0 ? constraints.map((c) => `- ${c}`).join('\n') : 'No specific constraints mentioned.'}

### YOUR TASK
Provide structured decision support. Analyze each option against:
- Alignment with likely goals
- Resource requirements
- Risk profile
- Time to value
- Reversibility

For each option, score it 1-10 on each dimension and provide reasoning.

Return as JSON:
{
  "decisionSummary": "<brief summary of the decision context>",
  "optionAnalyses": [
    {
      "option": "<option description>",
      "scores": {
        "goalAlignment": <1-10>,
        "resourceRequirements": <1-10, where 10 is minimal resources>,
        "riskProfile": <1-10, where 10 is lowest risk>,
        "timeToValue": <1-10, where 10 is fastest>,
        "reversibility": <1-10, where 10 is most reversible>
      },
      "totalScore": <sum of scores>,
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"],
      "keyConsiderations": "<most important thing to consider>",
      "recommendedIf": "<scenario where this option is best>"
    }
  ],
  "recommendation": {
    "topChoice": "<recommended option>",
    "reasoning": "<why this is recommended>",
    "confidenceLevel": <0-100>,
    "caveat": "<important caveat or condition>"
  },
  "questionsToAnswer": ["<question 1>", "<question 2>"]
}

Return ONLY valid JSON.`;

      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: AI_PHILL_MODEL,
          max_tokens: STRATEGIC_THINKING_BUDGET + RESPONSE_TOKENS,
          thinking: {
            type: 'enabled',
            budget_tokens: STRATEGIC_THINKING_BUDGET,
          },
          system: [
            {
              type: 'text',
              text: AI_PHILL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
      });

      const message = result.data;

      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      const analysis = this.parseJsonResponse<DecisionAnalysis>(responseText);

      const executionTime = Date.now() - startTime;
      console.log(`${this.logPrefix} Decision analysis complete in ${executionTime}ms`);

      return {
        success: true,
        data: analysis,
        metadata: {
          outputTokensUsed: message.usage.output_tokens,
          executionTimeMs: executionTime,
          modelUsed: AI_PHILL_MODEL,
        },
      };
    } catch (error) {
      console.error(`${this.logPrefix} Decision analysis error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during decision analysis',
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build comprehensive business context for prompts
   */
  private buildBusinessContext(
    business: founderBusinessRegistryService.FounderBusiness,
    signals: founderSignalInferenceService.BusinessSignal[],
    journalEntries: string[]
  ): string {
    const signalsByFamily = this.groupSignalsByFamily(signals);
    const signalsContext = this.formatSignalsForPrompt(signalsByFamily);

    return `### Business Information
- Name: ${business.display_name}
- Code: ${business.code}
- Industry: ${business.industry || 'Not specified'}
- Region: ${business.region || 'Not specified'}
- Primary Domain: ${business.primary_domain || 'Not specified'}
- Status: ${business.status}
- Created: ${new Date(business.created_at).toLocaleDateString()}

### Recent Signals (${signals.length} total)
${signalsContext || 'No signals recorded.'}

### Founder Journal Context
${journalEntries.length > 0 ? journalEntries.join('\n---\n') : 'No recent journal entries.'}`;
  }

  /**
   * Group signals by their family/category
   */
  private groupSignalsByFamily(
    signals: founderSignalInferenceService.BusinessSignal[]
  ): Record<string, founderSignalInferenceService.BusinessSignal[]> {
    const grouped: Record<string, founderSignalInferenceService.BusinessSignal[]> = {};

    for (const signal of signals) {
      const family = signal.signal_family;
      if (!grouped[family]) {
        grouped[family] = [];
      }
      grouped[family].push(signal);
    }

    return grouped;
  }

  /**
   * Format grouped signals for inclusion in prompts
   */
  private formatSignalsForPrompt(
    signalsByFamily: Record<string, founderSignalInferenceService.BusinessSignal[]>
  ): string {
    const families = Object.keys(signalsByFamily);
    if (families.length === 0) {
return 'No signals available.';
}

    return families
      .map((family) => {
        const signals = signalsByFamily[family];
        const signalSummary = signals
          .slice(0, 5)
          .map((s) => {
            const value = s.value_numeric !== null ? s.value_numeric : s.value_text;
            return `  - ${s.signal_key}: ${value} (${s.source})`;
          })
          .join('\n');
        return `**${family.toUpperCase()}** (${signals.length} signals):\n${signalSummary}`;
      })
      .join('\n\n');
  }

  /**
   * Summarize signals for digest
   */
  private summarizeSignals(signals: founderSignalInferenceService.BusinessSignal[]): string {
    if (signals.length === 0) {
return 'No signals this week.';
}

    const byFamily: Record<string, number> = {};
    for (const signal of signals) {
      byFamily[signal.signal_family] = (byFamily[signal.signal_family] || 0) + 1;
    }

    return Object.entries(byFamily)
      .map(([family, count]) => `- ${family}: ${count} data points`)
      .join('\n');
  }

  /**
   * Parse JSON response from Claude, handling markdown code blocks
   */
  private parseJsonResponse<T>(text: string): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);

      const cleanJson = jsonMatch ? jsonMatch[1].trim() : text.trim();

      return JSON.parse(cleanJson) as T;
    } catch (error) {
      console.error(`${this.logPrefix} JSON parse error:`, error);
      console.error(`${this.logPrefix} Raw text:`, text.substring(0, 500));
      throw new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`);
    }
  }
}

// ============================================================================
// Additional Types
// ============================================================================

export interface DecisionAnalysis {
  decisionSummary: string;
  optionAnalyses: OptionAnalysis[];
  recommendation: {
    topChoice: string;
    reasoning: string;
    confidenceLevel: number;
    caveat: string;
  };
  questionsToAnswer: string[];
}

export interface OptionAnalysis {
  option: string;
  scores: {
    goalAlignment: number;
    resourceRequirements: number;
    riskProfile: number;
    timeToValue: number;
    reversibility: number;
  };
  totalScore: number;
  pros: string[];
  cons: string[];
  keyConsiderations: string;
  recommendedIf: string;
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const aiPhillAgent = new AiPhillAgent();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Analyze business strategy (convenience wrapper)
 */
export async function analyzeBusinessStrategy(
  userId: string,
  businessId: string,
  context: string
): Promise<AgentResult<PhillInsight[]>> {
  return aiPhillAgent.analyzeBusinessStrategy(userId, businessId, context);
}

/**
 * Facilitate journal entry (convenience wrapper)
 */
export async function facilitateJournalEntry(userId: string, prompt: string): Promise<AgentResult<string>> {
  return aiPhillAgent.facilitateJournalEntry(userId, prompt);
}

/**
 * Assess business risks (convenience wrapper)
 */
export async function assessRisks(businessId: string): Promise<AgentResult<RiskAssessment>> {
  return aiPhillAgent.assessRisks(businessId);
}

/**
 * Generate weekly digest (convenience wrapper)
 */
export async function generateWeeklyDigest(userId: string): Promise<AgentResult<Digest>> {
  return aiPhillAgent.generateWeeklyDigest(userId);
}

/**
 * Conduct strategic dialogue (convenience wrapper)
 */
export async function conductStrategicDialogue(userId: string, question: string): Promise<AgentResult<DialogueResponse>> {
  return aiPhillAgent.conductStrategicDialogue(userId, question);
}

/**
 * Analyze decision (convenience wrapper)
 */
export async function analyzeDecision(
  userId: string,
  decision: string,
  options: string[],
  constraints: string[]
): Promise<AgentResult<DecisionAnalysis>> {
  return aiPhillAgent.analyzeDecision(userId, decision, options, constraints);
}
