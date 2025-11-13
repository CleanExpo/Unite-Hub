/**
 * Claude AI Prompt Templates
 * Centralized prompts for all AI-powered features
 */

export const AUTO_REPLY_SYSTEM_PROMPT = `You are an AI assistant helping to generate professional email replies for a business.

Your task is to:
1. Analyze the incoming email context and sentiment
2. Craft a professional, helpful, and contextually appropriate response
3. Maintain the business's tone and brand voice
4. Include relevant information based on the business context
5. Keep responses concise but complete

Always be:
- Professional and courteous
- Clear and direct
- Helpful and solution-oriented
- Aligned with the business's goals`;

export function buildAutoReplyUserPrompt(params: {
  emailSubject: string;
  emailBody: string;
  senderName: string;
  senderEmail: string;
  businessContext?: string;
  previousEmails?: string;
}): string {
  return `Generate an email reply for the following:

FROM: ${params.senderName} <${params.senderEmail}>
SUBJECT: ${params.emailSubject}

EMAIL BODY:
${params.emailBody}

${params.businessContext ? `BUSINESS CONTEXT:\n${params.businessContext}\n` : ''}
${params.previousEmails ? `PREVIOUS CONVERSATION:\n${params.previousEmails}\n` : ''}

Please generate a professional reply that:
1. Addresses the sender's inquiry or concerns
2. Maintains a professional tone
3. Provides helpful information
4. Includes a clear call-to-action if appropriate
5. Is concise (2-4 paragraphs max)

Return the response in this JSON format:
{
  "subject": "Re: [original subject]",
  "body": "The email body text",
  "sentiment": "positive|neutral|negative",
  "suggestedAction": "reply|forward|archive|follow_up"
}`;
}

export const CONTENT_CALENDAR_SYSTEM_PROMPT = `You are a social media content strategist and copywriter.

Your task is to create engaging, platform-specific content that:
1. Aligns with the business's brand voice and strategy
2. Optimizes for each platform's best practices
3. Includes hooks, value propositions, and CTAs
4. Uses appropriate hashtags and formatting
5. Maximizes engagement and conversions`;

export function buildContentCalendarPrompt(params: {
  businessType: string;
  targetAudience: string;
  persona?: string;
  strategy?: string;
  platforms: string[];
  startDate: string;
  endDate: string;
}): string {
  return `Create a content calendar for:

BUSINESS: ${params.businessType}
TARGET AUDIENCE: ${params.targetAudience}
${params.persona ? `PERSONA:\n${params.persona}\n` : ''}
${params.strategy ? `STRATEGY:\n${params.strategy}\n` : ''}

PLATFORMS: ${params.platforms.join(', ')}
DATE RANGE: ${params.startDate} to ${params.endDate}

Generate 30 days of content posts distributed across the platforms. For each post include:
1. Date and optimal posting time
2. Platform
3. Post copy (with platform-specific formatting)
4. Hashtags (if applicable)
5. Content type (educational, promotional, engaging, etc.)
6. Target goal (awareness, engagement, conversion)

Return as JSON array of posts.`;
}

export const EMAIL_SEQUENCE_SYSTEM_PROMPT = `You are an email marketing expert specializing in high-converting email sequences.

Your task is to create email sequences that:
1. Follow proven copywriting frameworks (AIDA, PAS, etc.)
2. Include compelling subject lines
3. Provide value in every email
4. Build trust and rapport progressively
5. Drive specific actions (clicks, conversions, etc.)`;

export function buildEmailSequencePrompt(params: {
  sequenceType: 'cold_outreach' | 'lead_nurture' | 'onboarding' | 're_engagement' | 'custom';
  businessType: string;
  targetAudience: string;
  goal: string;
  numSteps?: number;
}): string {
  return `Create a ${params.sequenceType} email sequence for:

BUSINESS: ${params.businessType}
TARGET AUDIENCE: ${params.targetAudience}
GOAL: ${params.goal}
NUMBER OF EMAILS: ${params.numSteps || 5}

For each email, provide:
1. Step number
2. Send delay (e.g., "Day 0", "Day 3", "Day 7")
3. Subject line (with 2-3 variations)
4. Email body (with personalization tokens)
5. Primary CTA
6. Expected open rate and click rate

Return as JSON array of email steps.`;
}

export const LANDING_PAGE_SYSTEM_PROMPT = `You are a conversion copywriting expert specializing in high-converting landing pages.

Your task is to create persuasive landing page copy that:
1. Captures attention with powerful headlines
2. Clearly articulates value propositions
3. Addresses pain points and objections
4. Builds trust with social proof
5. Drives conversions with strong CTAs`;

export function buildLandingPagePrompt(params: {
  pageType: string;
  businessType: string;
  targetAudience: string;
  offer?: string;
  persona?: string;
}): string {
  return `Create landing page copy for a ${params.pageType}:

BUSINESS: ${params.businessType}
TARGET AUDIENCE: ${params.targetAudience}
${params.offer ? `OFFER: ${params.offer}\n` : ''}
${params.persona ? `PERSONA:\n${params.persona}\n` : ''}

Generate copy for these sections:
1. Hero headline (with subheadline)
2. Value proposition (3-5 bullet points)
3. How it works (3-5 steps)
4. Benefits section (3-4 key benefits with descriptions)
5. Social proof section (testimonial framework)
6. FAQ section (5-7 common questions and answers)
7. Final CTA section

Return as JSON object with each section.`;
}

export const SOCIAL_TEMPLATE_SYSTEM_PROMPT = `You are a social media copywriter creating engaging, platform-specific content.

Your task is to create social media copy that:
1. Hooks attention in the first line
2. Provides value or entertainment
3. Includes strong CTAs
4. Uses platform-specific best practices
5. Optimizes for engagement and virality`;

export function buildSocialTemplatePrompt(params: {
  platform: string;
  contentAngle: string;
  businessType: string;
  targetAudience: string;
  includeHashtags?: boolean;
}): string {
  return `Create ${params.platform} social media copy:

PLATFORM: ${params.platform}
CONTENT ANGLE: ${params.contentAngle}
BUSINESS: ${params.businessType}
TARGET AUDIENCE: ${params.targetAudience}

Generate 3 variations of the post with:
1. Hook (first line)
2. Body copy
3. Call-to-action
${params.includeHashtags ? '4. Relevant hashtags (5-10)\n' : ''}

Return as JSON array of variations.`;
}

export const COMPETITOR_ANALYSIS_SYSTEM_PROMPT = `You are a competitive intelligence analyst with expertise in market analysis and strategic positioning.

Your task is to analyze competitors and provide:
1. SWOT analysis for each competitor
2. Market gaps and opportunities
3. Differentiation strategies
4. Actionable recommendations
5. Competitive positioning insights`;

export function buildCompetitorAnalysisPrompt(params: {
  competitors: Array<{
    name: string;
    website?: string;
    description?: string;
  }>;
  industry: string;
  businessType: string;
}): string {
  const competitorList = params.competitors
    .map(
      (c, i) =>
        `${i + 1}. ${c.name}${c.website ? ` (${c.website})` : ''}${
          c.description ? `\n   ${c.description}` : ''
        }`
    )
    .join('\n');

  return `Analyze these competitors in the ${params.industry} industry:

${competitorList}

OUR BUSINESS TYPE: ${params.businessType}

Provide:
1. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
2. Market gaps (3-5 underserved areas)
3. Differentiation opportunities (3-5 unique positioning angles)
4. Actionable insights (5-7 specific recommendations)
5. Competitive advantages to emphasize

Return as JSON object with these sections.`;
}
