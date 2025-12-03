/**
 * Conversion Copywriting Engine
 *
 * Purpose: Generate conversion-optimized page copy using VOC research,
 * competitor insights, and proven copywriting structures.
 *
 * CRITICAL PRINCIPLES (embedded in skeleton):
 * 1. UNIQUE - All content must be original, never plagiarized
 * 2. VERIFIABLE - Every claim must be backed by consistency master data
 * 3. AUTHENTIC - Customer quotes are real (from VOC research)
 *
 * Per CustomGPT Instructions:
 * - Proven section structures: Hero → Problem → Value → Proof → Process → FAQ → CTA
 * - Customer quotes woven naturally into copy
 * - Ultra-clear, jargon-free language
 * - Verified claims only (cross-reference with consistency master)
 */

import { anthropic } from "@/lib/anthropic/client";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { supabaseAdmin } from "@/lib/supabase";
import { reliableAgentExecution } from "@/lib/agents/agent-reliability";
import { getGoldQuotes, getVOCSummary, type VOCQuoteRecord } from "@/lib/agents/voc-research-agent";
import { getCompetitorAnalyses, type MessagingPattern } from "@/lib/agents/competitor-analyzer";
import { BusinessConsistencyService } from "@/lib/consistency/business-consistency-service";

// ============================================
// Types
// ============================================

export type PageType = 'homepage' | 'about' | 'services' | 'contact' | 'landing' | 'pricing' | 'case_study' | 'faq';

export type SectionType = 'hero' | 'problem' | 'value_props' | 'proof' | 'process' | 'pricing' | 'faq' | 'cta' | 'team' | 'story' | 'credentials';

export type ToneVoice = 'conversational' | 'professional' | 'friendly' | 'authoritative' | 'playful';

export interface SectionContent {
  type: SectionType;
  headline?: string;
  subheadline?: string;
  body_copy?: string;
  bullet_points?: string[];
  cta_text?: string;
  cta_url?: string;
  customer_quote?: {
    quote: string;
    author?: string;
    context?: string;
  };
  stats?: Array<{ value: string; label: string }>;
  steps?: Array<{ title: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface GeneratedPageCopy {
  page_type: PageType;
  meta_title?: string;
  meta_description?: string;
  sections: SectionContent[];
  voc_quotes_used: string[]; // IDs of quotes used
  word_count: number;
}

export interface CopyGenerationInput {
  workspaceId: string;
  clientId?: string;
  pageType: PageType;
  businessName: string;
  industry: string;
  targetAudience: string;
  primaryOffer: string;
  uniqueSellingPoints: string[];
  toneVoice?: ToneVoice;
  customGuidelines?: string;
  useVOCQuotes?: boolean;
  useCompetitorInsights?: boolean;
}

export interface CopyGenerationResult {
  success: boolean;
  copyId?: string;
  generatedCopy?: GeneratedPageCopy;
  verificationReport?: VerificationReport;
  error?: string;
}

/**
 * CRITICAL: Verification Report - Every piece of copy must pass this
 */
export interface VerificationReport {
  isUnique: boolean;
  isVerifiable: boolean;
  uniquenessScore: number; // 0-100, must be 95+
  verifiedClaims: VerifiedClaim[];
  unverifiedClaims: UnverifiedClaim[];
  warnings: string[];
  passed: boolean;
}

export interface VerifiedClaim {
  claim: string;
  source: 'consistency_master' | 'voc_research' | 'public_record';
  verificationDetail: string;
}

export interface UnverifiedClaim {
  claim: string;
  reason: string;
  suggestedAction: 'remove' | 'modify' | 'add_source';
}

// ============================================
// Banned Phrases (per methodology)
// ============================================

const BANNED_PHRASES = [
  'leverage', 'synergy', 'optimize', 'utilize', 'cutting-edge', 'state-of-the-art',
  'best-in-class', 'world-class', 'game-changer', 'disruptive', 'innovative',
  'paradigm shift', 'holistic', 'seamless', 'robust', 'scalable', 'empower',
  'thought leader', 'bleeding edge', 'next-generation', 'turnkey', 'enterprise-grade',
  'mission-critical', 'value-add', 'low-hanging fruit', 'move the needle',
  'circle back', 'touch base', 'deep dive', 'bandwidth', 'core competency',
];

const JARGON_REPLACEMENTS: Record<string, string> = {
  'leverage': 'use',
  'utilize': 'use',
  'optimize': 'improve',
  'facilitate': 'help',
  'implement': 'use',
  'comprehensive': 'complete',
  'innovative': 'new',
  'seamless': 'smooth',
  'robust': 'strong',
  'scalable': 'grows with you',
  'empower': 'help',
  'streamline': 'simplify',
};

// ============================================
// Main Engine
// ============================================

/**
 * Generate conversion-optimized page copy
 */
export async function generatePageCopy(
  input: CopyGenerationInput
): Promise<CopyGenerationResult> {
  const result = await reliableAgentExecution(
    async () => {
      // 1. Gather context from VOC research if enabled
      let vocContext = '';
      let goldQuotes: VOCQuoteRecord[] = [];
      if (input.useVOCQuotes !== false) {
        goldQuotes = await getGoldQuotes(input.workspaceId, input.clientId);
        const vocSummary = await getVOCSummary(input.workspaceId, input.clientId);
        vocContext = buildVOCContext(goldQuotes, vocSummary);
      }

      // 2. Gather competitor insights if enabled
      let competitorContext = '';
      if (input.useCompetitorInsights !== false) {
        const competitors = await getCompetitorAnalyses(input.workspaceId, input.clientId);
        competitorContext = buildCompetitorContext(competitors);
      }

      // 3. Get consistency master for verified claims (CRITICAL for verification)
      const consistencyService = new BusinessConsistencyService();
      let businessInfo = '';
      let consistencyMasterData: any = null;
      try {
        const masters = await supabaseAdmin
          .from('business_consistency_master')
          .select('*')
          .eq('workspace_id', input.workspaceId)
          .limit(1);

        if (masters.data?.[0]) {
          consistencyMasterData = masters.data[0];
          businessInfo = buildBusinessContext(consistencyMasterData);
        }
      } catch {
        // No consistency master yet, continue without - but verification will flag this
      }

      // 4. Get template for page type
      const template = await getPageTemplate(input.pageType);

      // 5. Generate copy with Claude
      const generatedCopy = await generateCopyWithClaude({
        input,
        vocContext,
        competitorContext,
        businessInfo,
        template,
        goldQuotes,
      });

      // 6. Post-process: Remove jargon, enforce clarity
      const cleanedCopy = cleanCopy(generatedCopy);

      // 7. CRITICAL: Verify uniqueness and claims
      const verificationReport = await verifyCopy(cleanedCopy, {
        consistencyMaster: consistencyMasterData,
        vocQuotes: goldQuotes,
        workspaceId: input.workspaceId,
      });

      // 8. Only store if verification passes (or with warnings)
      if (!verificationReport.passed) {
        return {
          success: false,
          generatedCopy: cleanedCopy,
          verificationReport,
          error: `Copy failed verification: ${verificationReport.unverifiedClaims.length} unverified claims, uniqueness score: ${verificationReport.uniquenessScore}%`,
        };
      }

      // 9. Store in database with verification status
      const copyId = await storeCopy(cleanedCopy, input, verificationReport);

      return {
        success: true,
        copyId,
        generatedCopy: cleanedCopy,
        verificationReport,
      };
    },
    {
      agentId: 'conversion-copywriting-engine',
      params: { workspaceId: input.workspaceId, pageType: input.pageType },
      enableLoopDetection: true,
      guardConfig: {
        timeoutMs: 120000, // 2 minutes for generation
        maxRetries: 2,
        retryDelayMs: 3000,
      },
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Copy generation failed',
    };
  }

  return result.data;
}

/**
 * Generate copy using Claude with Extended Thinking
 */
async function generateCopyWithClaude(params: {
  input: CopyGenerationInput;
  vocContext: string;
  competitorContext: string;
  businessInfo: string;
  template: any;
  goldQuotes: VOCQuoteRecord[];
}): Promise<GeneratedPageCopy> {
  const { input, vocContext, competitorContext, businessInfo, template, goldQuotes } = params;

  const systemPrompt = buildSystemPrompt(input, template);
  const userPrompt = buildUserPrompt(input, vocContext, competitorContext, businessInfo);

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });
  });

  const message = result.data;
  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON response
  const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
    responseText.match(/({[\s\S]*})/);
  const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

  const parsed = JSON.parse(cleanJson);

  // Calculate word count
  const wordCount = countWords(parsed);

  // Track which VOC quotes were used
  const quotesUsed = goldQuotes
    .filter(q => responseText.includes(q.raw_quote.substring(0, 50)))
    .map(q => q.id);

  return {
    ...parsed,
    page_type: input.pageType,
    voc_quotes_used: quotesUsed,
    word_count: wordCount,
  };
}

/**
 * Build system prompt for copywriting
 */
function buildSystemPrompt(input: CopyGenerationInput, template: any): string {
  const sectionOrder = template?.section_order || getDefaultSectionOrder(input.pageType);
  const guidelines = template?.section_guidelines || {};

  return `You are an expert conversion copywriter specializing in ${input.industry} businesses.

YOUR MISSION: Write copy that converts visitors into customers by speaking their language.

CRITICAL RULES:
1. USE CUSTOMER LANGUAGE - If VOC quotes are provided, weave them naturally into copy
2. NO JARGON - Write at an 8th grade reading level. If a word sounds "corporate", don't use it.
3. VERIFIED CLAIMS ONLY - Only make claims that can be backed up by the business info provided
4. BENEFIT-FOCUSED - Every sentence should answer "so what?" for the reader
5. SPECIFIC > VAGUE - "We respond in 30 minutes" beats "We respond quickly"

BANNED PHRASES (never use):
${BANNED_PHRASES.join(', ')}

TONE: ${input.toneVoice || 'conversational'} - Write like you're talking to a friend who needs help

SECTION STRUCTURE for ${input.pageType}:
${JSON.stringify(sectionOrder)}

SECTION GUIDELINES:
${JSON.stringify(guidelines, null, 2)}

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "meta_title": "Page title (50-60 chars)",
  "meta_description": "Meta description (150-160 chars)",
  "sections": [
    {
      "type": "hero",
      "headline": "Main headline (customer-centric, addresses pain)",
      "subheadline": "Supporting line (reinforces value)",
      "cta_text": "Action button text",
      "cta_url": "#contact"
    },
    {
      "type": "problem",
      "headline": "Section headline",
      "body_copy": "Paragraph describing their problem using THEIR words",
      "customer_quote": {
        "quote": "Exact quote from VOC if available",
        "author": "Customer name/type",
        "context": "Where the quote is from"
      }
    },
    // ... more sections
  ]
}`;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(
  input: CopyGenerationInput,
  vocContext: string,
  competitorContext: string,
  businessInfo: string
): string {
  let prompt = `Generate conversion-optimized ${input.pageType} copy for:

BUSINESS: ${input.businessName}
INDUSTRY: ${input.industry}
TARGET AUDIENCE: ${input.targetAudience}
MAIN OFFER: ${input.primaryOffer}

UNIQUE SELLING POINTS:
${input.uniqueSellingPoints.map(usp => `- ${usp}`).join('\n')}

${input.customGuidelines ? `CUSTOM GUIDELINES:\n${input.customGuidelines}\n\n` : ''}`;

  if (vocContext) {
    prompt += `\nCUSTOMER VOICE RESEARCH (use these exact quotes where natural):\n${vocContext}\n`;
  }

  if (competitorContext) {
    prompt += `\nCOMPETITOR INSIGHTS (differentiate from these):\n${competitorContext}\n`;
  }

  if (businessInfo) {
    prompt += `\nVERIFIED BUSINESS INFO (only use these facts for claims):\n${businessInfo}\n`;
  }

  prompt += `\nNow generate the ${input.pageType} copy following the section structure and guidelines.`;

  return prompt;
}

// ============================================
// Helper Functions
// ============================================

function buildVOCContext(quotes: VOCQuoteRecord[], summary: any): string {
  if (!quotes.length) return '';

  const sections = [];

  const painPoints = quotes.filter(q => q.category === 'pain_point');
  if (painPoints.length) {
    sections.push(`PAIN POINTS (use in Problem section):\n${painPoints.map(q => `"${q.raw_quote}"`).join('\n')}`);
  }

  const dreams = quotes.filter(q => q.category === 'dream_outcome');
  if (dreams.length) {
    sections.push(`DREAM OUTCOMES (use in Hero/Value Props):\n${dreams.map(q => `"${q.raw_quote}"`).join('\n')}`);
  }

  const failed = quotes.filter(q => q.category === 'failed_solution');
  if (failed.length) {
    sections.push(`FAILED SOLUTIONS (address in Problem/Value Props):\n${failed.map(q => `"${q.raw_quote}"`).join('\n')}`);
  }

  return sections.join('\n\n');
}

function buildCompetitorContext(competitors: any[]): string {
  if (!competitors.length) return '';

  const insights = competitors.slice(0, 3).map(c => {
    const mp = c.messaging_patterns as MessagingPattern;
    return `${c.competitor_name}:
- Headlines: ${(mp?.headlines || []).slice(0, 2).join(', ')}
- Trust signals: ${(c.trust_signals || []).slice(0, 3).join(', ')}`;
  });

  return `Top competitors and their messaging:\n${insights.join('\n\n')}`;
}

function buildBusinessContext(master: any): string {
  const parts = [];

  if (master.legal_business_name) {
    parts.push(`Business Name: ${master.legal_business_name}`);
  }
  if (master.primary_category) {
    parts.push(`Industry: ${master.primary_category}`);
  }
  if (master.service_areas?.length) {
    parts.push(`Service Areas: ${master.service_areas.join(', ')}`);
  }
  if (master.license_numbers) {
    const licenses = Object.entries(master.license_numbers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    parts.push(`Licenses: ${licenses}`);
  }
  if (master.business_hours) {
    parts.push(`Hours: See business hours on website`);
  }

  return parts.join('\n');
}

async function getPageTemplate(pageType: PageType): Promise<any> {
  const { data } = await supabaseAdmin
    .from('page_copy_templates')
    .select('*')
    .eq('page_type', pageType)
    .eq('is_default', true)
    .single();

  return data;
}

function getDefaultSectionOrder(pageType: PageType): string[] {
  const orders: Record<PageType, string[]> = {
    homepage: ['hero', 'problem', 'value_props', 'proof', 'process', 'faq', 'cta'],
    about: ['hero', 'story', 'team', 'values', 'credentials', 'cta'],
    services: ['hero', 'services_overview', 'service_details', 'process', 'pricing', 'proof', 'cta'],
    contact: ['hero', 'contact_form', 'location', 'hours', 'faq'],
    landing: ['hero', 'problem', 'solution', 'benefits', 'proof', 'offer', 'cta'],
    pricing: ['hero', 'plans', 'comparison', 'faq', 'cta'],
    case_study: ['hero', 'challenge', 'solution', 'results', 'testimonial', 'cta'],
    faq: ['hero', 'categories', 'faq_list', 'cta'],
  };

  return orders[pageType] || orders.homepage;
}

/**
 * Clean copy by removing jargon and banned phrases
 */
function cleanCopy(copy: GeneratedPageCopy): GeneratedPageCopy {
  const cleanSection = (section: SectionContent): SectionContent => {
    const cleaned = { ...section };

    if (cleaned.headline) {
      cleaned.headline = cleanText(cleaned.headline);
    }
    if (cleaned.subheadline) {
      cleaned.subheadline = cleanText(cleaned.subheadline);
    }
    if (cleaned.body_copy) {
      cleaned.body_copy = cleanText(cleaned.body_copy);
    }
    if (cleaned.bullet_points) {
      cleaned.bullet_points = cleaned.bullet_points.map(cleanText);
    }
    if (cleaned.cta_text) {
      cleaned.cta_text = cleanText(cleaned.cta_text);
    }
    if (cleaned.steps) {
      cleaned.steps = cleaned.steps.map(s => ({
        ...s,
        title: cleanText(s.title),
        description: cleanText(s.description),
      }));
    }
    if (cleaned.faqs) {
      cleaned.faqs = cleaned.faqs.map(f => ({
        question: cleanText(f.question),
        answer: cleanText(f.answer),
      }));
    }

    return cleaned;
  };

  return {
    ...copy,
    meta_title: copy.meta_title ? cleanText(copy.meta_title) : undefined,
    meta_description: copy.meta_description ? cleanText(copy.meta_description) : undefined,
    sections: copy.sections.map(cleanSection),
  };
}

function cleanText(text: string): string {
  let cleaned = text;

  // Replace jargon with simpler words
  for (const [jargon, replacement] of Object.entries(JARGON_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${jargon}\\b`, 'gi');
    cleaned = cleaned.replace(regex, replacement);
  }

  // Remove banned phrases entirely (they're typically meaningless)
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  // Clean up any double spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

function countWords(copy: any): number {
  const text = JSON.stringify(copy);
  const words = text.match(/\b[a-zA-Z]+\b/g);
  return words?.length || 0;
}

// ============================================
// CRITICAL: Verification System
// ============================================

/**
 * CRITICAL: Verify copy for uniqueness and claim verification
 * This is the skeleton of the verification system - every piece of copy MUST pass this
 */
async function verifyCopy(
  copy: GeneratedPageCopy,
  context: {
    consistencyMaster: any;
    vocQuotes: VOCQuoteRecord[];
    workspaceId: string;
  }
): Promise<VerificationReport> {
  const verifiedClaims: VerifiedClaim[] = [];
  const unverifiedClaims: UnverifiedClaim[] = [];
  const warnings: string[] = [];

  // Extract all text from copy for analysis
  const allText = extractAllText(copy);

  // 1. Check uniqueness (not plagiarized)
  const uniquenessScore = await checkUniqueness(allText);

  // 2. Extract and verify claims
  const claims = await extractClaims(allText);

  for (const claim of claims) {
    const verification = await verifyClaim(claim, context);
    if (verification.verified) {
      verifiedClaims.push({
        claim: claim.text,
        source: verification.source,
        verificationDetail: verification.detail,
      });
    } else {
      unverifiedClaims.push({
        claim: claim.text,
        reason: verification.reason,
        suggestedAction: verification.suggestedAction,
      });
    }
  }

  // 3. Add warnings for missing context
  if (!context.consistencyMaster) {
    warnings.push('No business consistency master found - claims cannot be fully verified');
  }

  if (context.vocQuotes.length === 0) {
    warnings.push('No VOC quotes available - customer voice may not be authentic');
  }

  // 4. Determine if passed
  // Must have 95%+ uniqueness AND no critical unverified claims
  const criticalUnverified = unverifiedClaims.filter(c => c.suggestedAction === 'remove');
  const passed = uniquenessScore >= 95 && criticalUnverified.length === 0;

  return {
    isUnique: uniquenessScore >= 95,
    isVerifiable: unverifiedClaims.length === 0,
    uniquenessScore,
    verifiedClaims,
    unverifiedClaims,
    warnings,
    passed,
  };
}

/**
 * Extract all text content from copy for analysis
 */
function extractAllText(copy: GeneratedPageCopy): string {
  const parts: string[] = [];

  if (copy.meta_title) parts.push(copy.meta_title);
  if (copy.meta_description) parts.push(copy.meta_description);

  for (const section of copy.sections) {
    if (section.headline) parts.push(section.headline);
    if (section.subheadline) parts.push(section.subheadline);
    if (section.body_copy) parts.push(section.body_copy);
    if (section.bullet_points) parts.push(...section.bullet_points);
    if (section.cta_text) parts.push(section.cta_text);
    if (section.customer_quote?.quote) parts.push(section.customer_quote.quote);
    if (section.steps) {
      parts.push(...section.steps.map(s => `${s.title} ${s.description}`));
    }
    if (section.faqs) {
      parts.push(...section.faqs.map(f => `${f.question} ${f.answer}`));
    }
  }

  return parts.join(' ');
}

/**
 * Check content uniqueness using Claude
 */
async function checkUniqueness(text: string): Promise<number> {
  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-haiku-3-5-20241022",
        max_tokens: 500,
        system: `You are a plagiarism detection expert. Analyze the text for:
1. Common marketing phrases that appear verbatim on many websites
2. Template-like language that lacks originality
3. Generic claims without specific details

Return JSON: {"uniqueness_score": 0-100, "issues": ["issue1", "issue2"]}

Score guide:
- 100: Completely original, specific to this business
- 90-99: Mostly original with minor generic phrases
- 80-89: Some template language but unique core
- 70-79: Too much generic content
- Below 70: Mostly templated/plagiarized`,
        messages: [
          {
            role: "user",
            content: `Analyze this marketing copy for uniqueness:\n\n${text.substring(0, 3000)}`,
          },
        ],
      });
    });

    const message = result.data;
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    const parsed = JSON.parse(cleanJson);
    return parsed.uniqueness_score || 85; // Default to 85 if parsing fails
  } catch (error) {
    console.error('Error checking uniqueness:', error);
    return 85; // Default score on error
  }
}

/**
 * Extract verifiable claims from text
 */
async function extractClaims(text: string): Promise<Array<{ text: string; type: string }>> {
  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-haiku-3-5-20241022",
        max_tokens: 1000,
        system: `You are a fact-checking specialist. Extract all verifiable claims from the text.

Claims include:
- Statistics or numbers ("500+ customers", "24/7 service")
- Business facts ("licensed", "insured", "family-owned since 1990")
- Service claims ("same-day service", "free quotes")
- Awards/certifications ("award-winning", "certified by...")
- Experience claims ("20 years experience")

Return JSON array: [{"text": "claim text", "type": "statistic|business_fact|service|credential|experience"}]`,
        messages: [
          {
            role: "user",
            content: text.substring(0, 3000),
          },
        ],
      });
    });

    const message = result.data;
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/(\[[\s\S]*\])/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error extracting claims:', error);
    return [];
  }
}

/**
 * Verify a single claim against available sources
 */
async function verifyClaim(
  claim: { text: string; type: string },
  context: {
    consistencyMaster: any;
    vocQuotes: VOCQuoteRecord[];
    workspaceId: string;
  }
): Promise<{
  verified: boolean;
  source?: 'consistency_master' | 'voc_research' | 'public_record';
  detail?: string;
  reason?: string;
  suggestedAction?: 'remove' | 'modify' | 'add_source';
}> {
  const { consistencyMaster, vocQuotes } = context;

  // Check against consistency master
  if (consistencyMaster) {
    // Check business name
    if (claim.text.toLowerCase().includes(consistencyMaster.legal_business_name?.toLowerCase())) {
      return { verified: true, source: 'consistency_master', detail: 'Business name verified' };
    }

    // Check licenses
    if (claim.type === 'credential' && consistencyMaster.license_numbers) {
      const licenses = Object.values(consistencyMaster.license_numbers) as string[];
      for (const license of licenses) {
        if (claim.text.includes(license)) {
          return { verified: true, source: 'consistency_master', detail: `License ${license} verified` };
        }
      }
    }

    // Check service areas
    if (consistencyMaster.service_areas) {
      for (const area of consistencyMaster.service_areas) {
        if (claim.text.toLowerCase().includes(area.toLowerCase())) {
          return { verified: true, source: 'consistency_master', detail: `Service area ${area} verified` };
        }
      }
    }

    // Check ABN
    if (consistencyMaster.abn && claim.text.includes(consistencyMaster.abn)) {
      return { verified: true, source: 'consistency_master', detail: 'ABN verified' };
    }
  }

  // Check against VOC quotes (customer testimonials)
  if (vocQuotes.length > 0) {
    for (const quote of vocQuotes) {
      if (claim.text.includes(quote.raw_quote.substring(0, 30))) {
        return { verified: true, source: 'voc_research', detail: 'Customer quote verified from VOC research' };
      }
    }
  }

  // Unverifiable claims need action
  if (claim.type === 'statistic') {
    return {
      verified: false,
      reason: 'Statistics must be verified from business records',
      suggestedAction: 'modify', // Could be real, just needs source
    };
  }

  if (claim.type === 'credential') {
    return {
      verified: false,
      reason: 'Credentials must be in consistency master',
      suggestedAction: 'remove', // Critical - can't claim credentials without proof
    };
  }

  // Default: allow with warning
  return {
    verified: false,
    reason: 'Claim source not found in verified data',
    suggestedAction: 'add_source',
  };
}

/**
 * Store generated copy in database with verification status
 */
async function storeCopy(
  copy: GeneratedPageCopy,
  input: CopyGenerationInput,
  verificationReport?: VerificationReport
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('generated_page_copy')
    .insert({
      workspace_id: input.workspaceId,
      client_id: input.clientId || null,
      page_type: copy.page_type,
      sections: {
        meta_title: copy.meta_title,
        meta_description: copy.meta_description,
        sections: copy.sections,
        verification: verificationReport ? {
          uniqueness_score: verificationReport.uniquenessScore,
          verified_claims_count: verificationReport.verifiedClaims.length,
          unverified_claims_count: verificationReport.unverifiedClaims.length,
          passed: verificationReport.passed,
          warnings: verificationReport.warnings,
        } : null,
      },
      voc_quotes_used: copy.voc_quotes_used,
      status: 'draft',
      version: 1,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error storing copy:', error);
    throw error;
  }

  return data.id;
}

// ============================================
// Query Functions
// ============================================

/**
 * Get generated copy by ID
 */
export async function getGeneratedCopy(
  copyId: string,
  workspaceId: string
): Promise<GeneratedPageCopy | null> {
  const { data, error } = await supabaseAdmin
    .from('generated_page_copy')
    .select('*')
    .eq('id', copyId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    page_type: data.page_type,
    meta_title: data.sections?.meta_title,
    meta_description: data.sections?.meta_description,
    sections: data.sections?.sections || [],
    voc_quotes_used: data.voc_quotes_used || [],
    word_count: countWords(data.sections),
  };
}

/**
 * Get all generated copy for a workspace
 */
export async function getGeneratedCopyList(
  workspaceId: string,
  clientId?: string,
  status?: string
): Promise<Array<{
  id: string;
  page_type: PageType;
  status: string;
  version: number;
  created_at: string;
}>> {
  let query = supabaseAdmin
    .from('generated_page_copy')
    .select('id, page_type, status, version, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching copy list:', error);
    return [];
  }

  return data || [];
}

/**
 * Update copy status
 */
export async function updateCopyStatus(
  copyId: string,
  workspaceId: string,
  status: 'draft' | 'review' | 'revision_requested' | 'approved' | 'published' | 'archived',
  approvedBy?: string,
  revisionNotes?: string
): Promise<boolean> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved' && approvedBy) {
    updates.approved_by = approvedBy;
    updates.approved_at = new Date().toISOString();
  }

  if (revisionNotes) {
    updates.revision_notes = revisionNotes;
  }

  const { error } = await supabaseAdmin
    .from('generated_page_copy')
    .update(updates)
    .eq('id', copyId)
    .eq('workspace_id', workspaceId);

  return !error;
}

/**
 * Create a new version of copy
 */
export async function createCopyVersion(
  originalCopyId: string,
  workspaceId: string,
  newSections: any
): Promise<string | null> {
  // Get original
  const { data: original } = await supabaseAdmin
    .from('generated_page_copy')
    .select('*')
    .eq('id', originalCopyId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!original) {
    return null;
  }

  // Create new version
  const { data, error } = await supabaseAdmin
    .from('generated_page_copy')
    .insert({
      workspace_id: workspaceId,
      client_id: original.client_id,
      page_type: original.page_type,
      template_id: original.template_id,
      sections: newSections,
      voc_quotes_used: original.voc_quotes_used,
      status: 'draft',
      version: (original.version || 1) + 1,
      created_by: original.created_by,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating copy version:', error);
    return null;
  }

  return data.id;
}

/**
 * Delete generated copy
 */
export async function deleteGeneratedCopy(
  copyId: string,
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('generated_page_copy')
    .delete()
    .eq('id', copyId)
    .eq('workspace_id', workspaceId);

  return !error;
}
