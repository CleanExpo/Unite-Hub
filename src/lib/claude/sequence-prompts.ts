/**
 * Claude AI Prompts for Email Sequence Generation
 *
 * Specialized prompts for generating high-converting email sequences
 * based on persona, business type, and campaign goals.
 */

export interface SequenceContext {
  businessName: string;
  businessDescription: string;
  industry?: string;
  targetPersona?: {
    name: string;
    demographics: any;
    painPoints: string[];
    goals: string[];
    buyingBehavior: any;
  };
  sequenceGoal: string;
  sequenceType: "cold_outreach" | "lead_nurture" | "onboarding" | "re_engagement" | "custom";
  totalSteps: number;
  customInstructions?: string;
}

/**
 * Main prompt for generating complete email sequence
 */
export function generateSequencePrompt(context: SequenceContext): string {
  const { businessName, businessDescription, targetPersona, sequenceGoal, sequenceType, totalSteps } = context;

  const basePrompt = `You are an expert email marketing strategist. Generate a high-converting ${totalSteps}-step email sequence for:

Business: ${businessName}
Description: ${businessDescription}
${context.industry ? `Industry: ${context.industry}` : ''}

Sequence Type: ${sequenceType.replace('_', ' ')}
Goal: ${sequenceGoal}

${targetPersona ? `
Target Persona: ${targetPersona.name}
Pain Points: ${targetPersona.painPoints.join(', ')}
Goals: ${targetPersona.goals.join(', ')}
` : ''}

Generate ${totalSteps} email steps following these principles:

1. SUBJECT LINES:
   - Clear, compelling, curiosity-driven
   - Personalization where appropriate
   - 40-50 characters optimal
   - Avoid spam triggers

2. EMAIL BODY:
   - Conversational, human tone
   - Focus on recipient benefit
   - Clear value proposition
   - Single, focused message per email
   - Strong, specific CTA

3. SEQUENCE FLOW:
   ${getSequenceFlowGuidelines(sequenceType)}

4. PERSONALIZATION:
   - Include merge tags: {firstName}, {company}, {industry}
   - Reference specific pain points
   - Tailor to persona characteristics

5. TIMING:
   - Strategic delays between emails
   - Build momentum without being pushy
   - Give recipients time to respond

${context.customInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${context.customInstructions}` : ''}

For each email step, provide:

1. Step Number & Name
2. Day Delay (days after previous email, 0 for first email)
3. Subject Line (with 2 alternatives)
4. Preheader Text (preview text shown in inbox)
5. Email Body (conversational, benefit-focused)
6. Call-to-Action (specific action you want recipient to take)
7. AI Reasoning (why this approach works at this stage)
8. Personalization Tags (list of merge tags used)

Return in JSON format:
{
  "steps": [
    {
      "stepNumber": 1,
      "stepName": "string",
      "dayDelay": 0,
      "subjectLine": "string",
      "subjectAlternatives": ["string", "string"],
      "preheaderText": "string",
      "emailBody": "string (plain text with merge tags)",
      "cta": {
        "text": "string",
        "url": "{placeholder}",
        "type": "button|link|reply|calendar"
      },
      "aiReasoning": "string",
      "personalizationTags": ["firstName", "company"]
    }
  ]
}`;

  return basePrompt;
}

/**
 * Get sequence flow guidelines based on type
 */
function getSequenceFlowGuidelines(sequenceType: string): string {
  const guidelines: Record<string, string> = {
    cold_outreach: `
   - Step 1: Introduction with clear value proposition
   - Step 2-3: Provide value (resources, insights, case studies)
   - Step 4: Social proof and credibility building
   - Step 5: Permission-based breakup email or final value add`,

    lead_nurture: `
   - Step 1: Welcome and set expectations
   - Step 2-3: Educational content addressing pain points
   - Step 4-5: Social proof and success stories
   - Step 6: Product/service introduction with benefits
   - Step 7: Clear next step with urgency`,

    onboarding: `
   - Step 1: Welcome and quick win
   - Step 2: Key features and how to use them
   - Step 3: Advanced tips and best practices
   - Step 4: Support resources and community`,

    re_engagement: `
   - Step 1: "We miss you" with new value proposition
   - Step 2: Highlight what they're missing
   - Step 3: Special offer or incentive to return`,

    custom: `
   - Follow best practices for email sequencing
   - Build relationship progressively
   - Provide value before asking
   - Clear, specific CTAs`,
  };

  return guidelines[sequenceType] || guidelines.custom;
}

/**
 * Prompt for regenerating a single step
 */
export function regenerateStepPrompt(
  context: SequenceContext,
  stepNumber: number,
  currentContent: {
    subjectLine: string;
    emailBody: string;
  },
  improvementInstructions?: string
): string {
  return `You are an expert email marketing strategist. Regenerate step ${stepNumber} of a ${context.sequenceType.replace('_', ' ')} sequence for:

Business: ${context.businessName}
Description: ${context.businessDescription}
Goal: ${context.sequenceGoal}

CURRENT VERSION:
Subject: ${currentContent.subjectLine}
Body:
${currentContent.emailBody}

${improvementInstructions ? `IMPROVEMENT INSTRUCTIONS:\n${improvementInstructions}` : 'Improve this email to be more engaging, personalized, and conversion-focused.'}

Provide an improved version that:
1. Has a more compelling subject line
2. Opens with stronger hook
3. Provides clearer value proposition
4. Has more persuasive CTA
5. Maintains conversational, human tone

Return in JSON format:
{
  "subjectLine": "string",
  "subjectAlternatives": ["string", "string"],
  "preheaderText": "string",
  "emailBody": "string",
  "cta": {
    "text": "string",
    "url": "{placeholder}",
    "type": "button|link|reply|calendar"
  },
  "aiReasoning": "string (explain what you improved and why)",
  "personalizationTags": ["array of merge tags"]
}`;
}

/**
 * Prompt for A/B test subject line variations
 */
export function generateSubjectLineVariationsPrompt(
  context: SequenceContext,
  stepNumber: number,
  currentSubject: string
): string {
  return `Generate 5 A/B test variations of this email subject line:

Current: "${currentSubject}"

Context:
- Business: ${context.businessName}
- Sequence: ${context.sequenceType.replace('_', ' ')}
- Step: ${stepNumber}
- Goal: ${context.sequenceGoal}

Generate variations that test different approaches:
1. Curiosity-driven
2. Benefit-focused
3. Question-based
4. Personalization-heavy
5. Urgency/scarcity

Each should be:
- 40-50 characters
- Avoid spam triggers
- Mobile-friendly
- A/B test ready

Return in JSON format:
{
  "variations": [
    {
      "subject": "string",
      "approach": "curiosity|benefit|question|personalization|urgency",
      "reasoning": "why this might perform better"
    }
  ]
}`;
}

/**
 * Prompt for analyzing sequence performance
 */
export function analyzeSequencePerformancePrompt(
  sequence: any,
  stepMetrics: any[]
): string {
  return `Analyze this email sequence performance and provide actionable recommendations:

SEQUENCE: ${sequence.name}
Type: ${sequence.sequenceType}
Goal: ${sequence.goal}

OVERALL METRICS:
- Total Sent: ${sequence.metrics.sent}
- Open Rate: ${sequence.metrics.opened}/${sequence.metrics.sent}
- Click Rate: ${sequence.metrics.clicked}/${sequence.metrics.sent}
- Reply Rate: ${sequence.metrics.replied}/${sequence.metrics.sent}
- Conversion Rate: ${sequence.metrics.converted}/${sequence.metrics.sent}

STEP-BY-STEP PERFORMANCE:
${stepMetrics.map(step => `
Step ${step.stepNumber}: ${step.stepName}
  Sent: ${step.sent}
  Open Rate: ${step.openRate}%
  Click Rate: ${step.clickRate}%
  Reply Rate: ${step.replyRate}%
`).join('\n')}

Provide:
1. Performance Analysis (what's working, what's not)
2. Key Insights (patterns, drop-off points, engagement trends)
3. Specific Recommendations (which steps to optimize, how to improve)
4. Subject Line Suggestions (for low-performing steps)
5. CTA Improvements (for low click-through steps)
6. Timing Adjustments (if needed based on engagement)

Return in JSON format:
{
  "overallAssessment": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": [
    {
      "stepNumber": number,
      "issue": "string",
      "recommendation": "string",
      "expectedImpact": "high|medium|low"
    }
  ],
  "suggestedSubjectLines": {
    "stepNumber": ["string", "string"]
  },
  "timingAdjustments": [
    {
      "stepNumber": number,
      "currentDelay": number,
      "suggestedDelay": number,
      "reasoning": "string"
    }
  ]
}`;
}

/**
 * Pre-built sequence templates with AI-generated content
 */
export const SEQUENCE_TEMPLATES = {
  saas_cold_outreach: {
    name: "SaaS Cold Outreach",
    description: "5-step sequence for introducing your SaaS product to cold prospects",
    category: "saas",
    sequenceType: "cold_outreach",
    targetAudience: "B2B decision makers, managers, executives",
    goal: "Book demo calls with qualified prospects",
    totalSteps: 5,
    estimatedConversionRate: "3-5%",
    recommendedFor: ["SaaS companies", "B2B software", "Tech startups"],
  },

  ecommerce_cart_abandonment: {
    name: "E-commerce Cart Recovery",
    description: "3-step sequence to recover abandoned shopping carts",
    category: "ecommerce",
    sequenceType: "re_engagement",
    targetAudience: "Customers who added items but didn't purchase",
    goal: "Recover abandoned carts and complete purchases",
    totalSteps: 3,
    estimatedConversionRate: "15-20%",
    recommendedFor: ["E-commerce stores", "Online retailers", "D2C brands"],
  },

  service_lead_nurture: {
    name: "Service Business Lead Nurture",
    description: "7-step nurture sequence for service-based businesses",
    category: "service_business",
    sequenceType: "lead_nurture",
    targetAudience: "Leads who showed interest but haven't committed",
    goal: "Build trust and convert leads into clients",
    totalSteps: 7,
    estimatedConversionRate: "8-12%",
    recommendedFor: ["Consultants", "Agencies", "Professional services"],
  },

  product_launch: {
    name: "Product Launch Sequence",
    description: "5-step sequence for launching new products",
    category: "product_launch",
    sequenceType: "custom",
    targetAudience: "Existing customers and warm leads",
    goal: "Generate excitement and pre-orders for new product",
    totalSteps: 5,
    estimatedConversionRate: "10-15%",
    recommendedFor: ["Product companies", "E-commerce", "SaaS"],
  },

  trial_conversion: {
    name: "Free Trial to Paid Conversion",
    description: "4-step onboarding sequence for trial users",
    category: "trial_conversion",
    sequenceType: "onboarding",
    targetAudience: "Users in free trial period",
    goal: "Convert trial users to paying customers",
    totalSteps: 4,
    estimatedConversionRate: "20-30%",
    recommendedFor: ["SaaS products", "Subscription services"],
  },

  customer_win_back: {
    name: "Customer Win-Back Campaign",
    description: "3-step sequence to re-engage churned customers",
    category: "win_back",
    sequenceType: "re_engagement",
    targetAudience: "Customers who canceled or haven't engaged in 60+ days",
    goal: "Re-activate churned customers",
    totalSteps: 3,
    estimatedConversionRate: "5-8%",
    recommendedFor: ["Subscription businesses", "SaaS", "Membership sites"],
  },

  referral_request: {
    name: "Customer Referral Request",
    description: "3-step sequence asking happy customers for referrals",
    category: "referral",
    sequenceType: "custom",
    targetAudience: "Satisfied customers with high engagement",
    goal: "Generate qualified referrals from existing customers",
    totalSteps: 3,
    estimatedConversionRate: "10-15%",
    recommendedFor: ["All business types", "Service businesses", "B2B"],
  },

  webinar_promotion: {
    name: "Webinar Promotion Sequence",
    description: "5-step sequence to promote and fill webinar registrations",
    category: "event_promotion",
    sequenceType: "custom",
    targetAudience: "Email list subscribers and website visitors",
    goal: "Drive webinar registrations and attendance",
    totalSteps: 5,
    estimatedConversionRate: "12-18%",
    recommendedFor: ["B2B companies", "Education", "SaaS"],
  },

  upsell_existing: {
    name: "Customer Upsell Sequence",
    description: "4-step sequence to upsell existing customers",
    category: "upsell",
    sequenceType: "custom",
    targetAudience: "Existing customers using basic tier",
    goal: "Upgrade customers to premium plans",
    totalSteps: 4,
    estimatedConversionRate: "15-20%",
    recommendedFor: ["SaaS", "Subscription services", "Membership sites"],
  },

  newsletter_engagement: {
    name: "Newsletter Welcome Series",
    description: "4-step welcome sequence for newsletter subscribers",
    category: "newsletter",
    sequenceType: "onboarding",
    targetAudience: "New newsletter subscribers",
    goal: "Engage new subscribers and establish regular reading habit",
    totalSteps: 4,
    estimatedConversionRate: "40-50%",
    recommendedFor: ["Content creators", "Publishers", "Thought leaders"],
  },

  partner_outreach: {
    name: "Partnership Outreach",
    description: "5-step sequence for B2B partnership proposals",
    category: "partner_outreach",
    sequenceType: "cold_outreach",
    targetAudience: "Potential business partners and collaborators",
    goal: "Establish strategic partnerships",
    totalSteps: 5,
    estimatedConversionRate: "5-8%",
    recommendedFor: ["B2B companies", "Agencies", "SaaS"],
  },

  event_followup: {
    name: "Event Follow-up Sequence",
    description: "3-step follow-up after trade shows or events",
    category: "event_promotion",
    sequenceType: "lead_nurture",
    targetAudience: "Leads collected at events or trade shows",
    goal: "Convert event leads into sales conversations",
    totalSteps: 3,
    estimatedConversionRate: "12-15%",
    recommendedFor: ["B2B companies", "Event organizers", "Sales teams"],
  },
};

/**
 * Helper to get template by category
 */
export function getTemplateByCategory(category: string) {
  return Object.values(SEQUENCE_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Helper to get all template categories
 */
export function getAllTemplateCategories() {
  return Array.from(
    new Set(Object.values(SEQUENCE_TEMPLATES).map((t) => t.category))
  );
}
