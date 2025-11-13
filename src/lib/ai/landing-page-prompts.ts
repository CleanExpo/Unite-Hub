/**
 * AI Prompts for Landing Page Copy Generation
 *
 * These prompts are used with Claude API to generate high-converting
 * landing page copy tailored to the business and target persona.
 */

interface CopyGenerationContext {
  businessName: string;
  businessDescription: string;
  pageType: string;
  sectionName: string;
  persona?: {
    personaName: string;
    painPoints: string[];
    goals: string[];
    demographics?: any;
  };
  strategy?: {
    uniqueSellingProposition: string;
    targetAudience: string;
    contentPillars: string[];
  };
  hooks?: string[];
}

/**
 * Main prompt for generating section copy
 */
export function generateSectionCopyPrompt(context: CopyGenerationContext): string {
  const {
    businessName,
    businessDescription,
    pageType,
    sectionName,
    persona,
    strategy,
    hooks,
  } = context;

  return `You are a professional copywriter specializing in high-converting landing pages.

Generate compelling copy for the "${sectionName}" section of a ${pageType} landing page.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Description: ${businessDescription}
${strategy ? `- Unique Selling Proposition: ${strategy.uniqueSellingProposition}` : ""}
${strategy ? `- Target Audience: ${strategy.targetAudience}` : ""}

${
  persona
    ? `TARGET PERSONA:
- Name: ${persona.personaName}
- Pain Points: ${persona.painPoints.join(", ")}
- Goals: ${persona.goals.join(", ")}`
    : ""
}

SECTION REQUIREMENTS FOR "${sectionName}":
${getSectionRequirements(sectionName, pageType)}

COPYWRITING GUIDELINES:
1. Headlines: Under 10 words, benefit-focused, create curiosity
2. Subheadlines: Expand on headline, add supporting detail
3. Body Copy: Benefits over features, active voice, customer-centric
4. CTAs: Action verbs, specific outcomes, create urgency
5. Tone: Professional yet conversational, persuasive without being pushy

${
  hooks && hooks.length > 0
    ? `PROVEN HOOKS (for inspiration):
${hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
    : ""
}

Generate the following in JSON format:
{
  "headline": "Compelling headline (max 10 words)",
  "subheadline": "Supporting subheadline (1-2 sentences)",
  "bodyCopy": "Detailed body copy (2-4 paragraphs)",
  "cta": "Call-to-action text (2-5 words)",
  "imagePrompt": "DALL-E image generation prompt for this section",
  "alternatives": [
    {
      "headline": "Alternative headline variation",
      "subheadline": "Alternative subheadline",
      "bodyCopy": "Alternative body copy",
      "cta": "Alternative CTA"
    }
  ]
}

Make the copy specific to ${businessName}, addressing the target audience's needs and pain points.`;
}

/**
 * Get section-specific requirements
 */
function getSectionRequirements(sectionName: string, pageType: string): string {
  const requirements: Record<string, string> = {
    // Homepage
    "Hero Section": `
- Create immediate impact with a benefit-driven headline
- Subheadline should clarify the value proposition
- Include a strong primary CTA
- Focus on the main problem you solve`,

    "Value Proposition": `
- Clearly articulate what makes the business unique
- Focus on tangible benefits
- Address "why choose us"
- Keep it concise and memorable`,

    "Key Features": `
- Highlight 3-5 main features or benefits
- Focus on outcomes, not just features
- Use bullet points or icons
- Make it scannable`,

    "How It Works": `
- Break down the process into 3-4 simple steps
- Make it easy to understand
- Show the path from problem to solution
- Reduce perceived complexity`,

    "Social Proof": `
- Include customer testimonials or reviews
- Add quantifiable results if available
- Build trust and credibility
- Address common objections`,

    "Trust Indicators": `
- List certifications, awards, or partnerships
- Include client logos if applicable
- Add security badges or guarantees
- Reinforce credibility`,

    "Final CTA": `
- Create urgency or FOMO
- Be specific about the next step
- Remove friction
- Make it action-oriented`,

    // Product Page
    "Product Hero": `
- Lead with the product name and main benefit
- Create desire with a powerful headline
- Include high-impact imagery prompt
- Focus on transformation`,

    "Key Benefits": `
- List 3-5 primary benefits
- Focus on outcomes and results
- Use "you" language
- Address pain points`,

    "Features Overview": `
- Detail specific features
- Connect features to benefits
- Make it comprehensive but scannable
- Use categorization if many features`,

    "Product Specs": `
- List technical specifications
- Include dimensions, materials, compatibility
- Be thorough and accurate
- Use tables or lists`,

    "Pricing": `
- Present pricing options clearly
- Highlight best value or most popular
- Include what's included in each tier
- Address common pricing objections`,

    "FAQs": `
- Answer top 5-7 common questions
- Address objections proactively
- Be honest and transparent
- Keep answers concise`,

    "Customer Testimonials": `
- Include 3-5 diverse testimonials
- Show specific results when possible
- Include customer names and photos (prompts)
- Make them authentic and relatable`,

    "Purchase CTA": `
- Strong action-oriented language
- Create urgency if appropriate
- Remove purchase anxiety
- Make the next step crystal clear`,

    // Service Page
    "Service Overview": `
- Clearly describe the service
- Focus on outcomes and results
- Make it easy to understand
- Address who it's for`,

    "Problem Statement": `
- Articulate the pain point clearly
- Show empathy and understanding
- Make the reader feel heard
- Set up your solution`,

    "Solution & Process": `
- Explain how you solve the problem
- Break down your process
- Show expertise and methodology
- Make it feel achievable`,

    "Service Benefits": `
- List key benefits of your service
- Focus on transformation
- Use specific, measurable outcomes
- Address the "why"`,

    "Pricing Options": `
- Present service packages clearly
- Show value in each tier
- Make comparison easy
- Include what's included`,

    "Case Studies": `
- Share success stories
- Include before/after scenarios
- Use specific numbers and results
- Make it relatable`,

    "Team/About": `
- Build credibility and trust
- Highlight expertise and experience
- Show personality
- Make it human`,

    "Contact CTA": `
- Make it easy to get started
- Offer multiple contact options
- Reduce friction
- Set expectations for next steps`,

    // Lead Capture
    "Compelling Headline": `
- Hook attention immediately
- Promise a specific benefit
- Create curiosity
- Make it irresistible`,

    "Pain Point Description": `
- Identify the specific problem
- Make the reader feel understood
- Create emotional connection
- Set up your solution`,

    "Solution Preview": `
- Tease what you're offering
- Create desire and anticipation
- Don't give everything away
- Make them want to learn more`,

    "Lead Magnet Description": `
- Clearly explain what they'll get
- Highlight the value and benefits
- Make it specific and tangible
- Create urgency to download`,

    "Form Section": `
- Minimize form fields
- Explain why you need each field
- Show privacy and security
- Make submission easy`,

    "Privacy & Trust": `
- Address privacy concerns
- Show security measures
- Include guarantees (no spam, etc.)
- Build trust`,

    "Thank You Preview": `
- Set expectations for what happens next
- Create excitement
- Provide immediate value if possible
- Make it warm and welcoming`,

    // Sales Page
    "Sales Hero": `
- Grab attention with a bold claim
- Focus on the transformation
- Create immediate interest
- Make it personal`,

    "Urgency Element": `
- Create scarcity or time sensitivity
- Make it authentic and believable
- Don't overdo it
- Give a reason for urgency`,

    "Product Benefits": `
- Comprehensive benefit list
- Show transformation clearly
- Use emotional and logical appeals
- Make it compelling`,

    "Pricing & Offer": `
- Present the offer clearly
- Show value and savings
- Compare to alternatives
- Make it feel like a steal`,

    "Risk Reversal": `
- Include money-back guarantee
- Remove purchase anxiety
- Make it risk-free
- Build confidence`,

    "Strong CTA": `
- Powerful action language
- Create FOMO
- Make it the obvious choice
- Make it prominent`,

    // Event Page
    "Event Hero": `
- Event name, date, and location
- Create excitement and anticipation
- Make it memorable
- Show what makes it special`,

    "Event Details": `
- When, where, duration
- Format (in-person, virtual, hybrid)
- Key logistics
- Make it crystal clear`,

    "Why Attend": `
- List benefits of attending
- Show what attendees will learn/gain
- Address "what's in it for me"
- Create FOMO`,

    "Speakers/Agenda": `
- Highlight key speakers or presenters
- Show their credibility
- Outline the schedule
- Make it valuable`,

    "Past Success": `
- Share highlights from previous events
- Include attendee testimonials
- Show photos or stats
- Build credibility`,

    "Registration Form": `
- Simple registration process
- Minimize barriers
- Show ticket types and pricing
- Make it easy to sign up`,

    "Location/Logistics": `
- Venue details and directions
- Parking or transportation info
- Hotel recommendations
- Accessibility information`,

    "Final Reminder": `
- Create urgency to register
- Highlight key benefits again
- Make the CTA prominent
- Address last objections`,
  };

  return requirements[sectionName] || `
- Create compelling, benefit-focused copy
- Address the target audience's needs
- Include a clear call-to-action
- Make it conversion-optimized`;
}

/**
 * Prompt for generating SEO metadata
 */
export function generateSEOMetadataPrompt(context: {
  title: string;
  pageType: string;
  businessName: string;
  businessDescription: string;
  persona?: any;
}): string {
  return `Generate SEO-optimized metadata for this landing page:

Page Title: ${context.title}
Page Type: ${context.pageType}
Business: ${context.businessName}
Description: ${context.businessDescription}

Generate the following in JSON format:
{
  "metaTitle": "SEO title (50-60 characters, include main keyword)",
  "metaDescription": "Meta description (120-160 characters, compelling summary)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ogTitle": "Open Graph title for social sharing",
  "ogDescription": "Open Graph description for social sharing"
}

Make it SEO-optimized, including relevant keywords naturally.`;
}

/**
 * Prompt for generating copy tips
 */
export function generateCopyTipsPrompt(
  pageType: string,
  persona?: any
): string {
  return `Generate 10 actionable copywriting tips for a ${pageType} landing page${
    persona ? ` targeting ${persona.personaName}` : ""
  }.

Focus on:
1. Headline optimization
2. Value proposition clarity
3. Benefit-focused messaging
4. Social proof integration
5. CTA effectiveness
6. Overcoming objections
7. Creating urgency
8. Trust-building
9. Scannability
10. Conversion optimization

Return as JSON array of strings:
{
  "copyTips": ["tip1", "tip2", ...]
}`;
}

/**
 * Prompt for generating design tips
 */
export function generateDesignTipsPrompt(pageType: string): string {
  return `Generate 10 actionable design tips for a ${pageType} landing page.

Focus on:
1. Visual hierarchy
2. White space usage
3. Color psychology
4. Typography
5. Image selection
6. CTA button design
7. Mobile responsiveness
8. Loading speed
9. Above-the-fold optimization
10. Accessibility

Return as JSON array of strings:
{
  "designTips": ["tip1", "tip2", ...]
}`;
}

/**
 * Prompt for generating copy variations for A/B testing
 */
export function generateCopyVariationsPrompt(
  currentCopy: {
    headline: string;
    subheadline: string;
    bodyCopy?: string;
    cta?: string;
  },
  context: CopyGenerationContext,
  count: number = 3
): string {
  return `Generate ${count} alternative variations of this landing page copy for A/B testing.

CURRENT COPY:
- Headline: ${currentCopy.headline}
- Subheadline: ${currentCopy.subheadline}
${currentCopy.bodyCopy ? `- Body: ${currentCopy.bodyCopy.substring(0, 200)}...` : ""}
${currentCopy.cta ? `- CTA: ${currentCopy.cta}` : ""}

BUSINESS CONTEXT:
- Business: ${context.businessName}
- Description: ${context.businessDescription}
- Section: ${context.sectionName}

Generate ${count} distinct variations that:
1. Test different angles/approaches
2. Use different emotional appeals
3. Try different value propositions
4. Experiment with different tones
5. Maintain conversion optimization

Return as JSON array:
{
  "variations": [
    {
      "headline": "Alternative headline",
      "subheadline": "Alternative subheadline",
      "bodyCopy": "Alternative body copy",
      "cta": "Alternative CTA",
      "approach": "Brief description of this variation's approach"
    }
  ]
}`;
}

/**
 * Prompt for improving existing copy
 */
export function improveCopyPrompt(
  currentCopy: string,
  context: CopyGenerationContext
): string {
  return `Improve this landing page copy for better conversion:

CURRENT COPY:
${currentCopy}

CONTEXT:
- Business: ${context.businessName}
- Section: ${context.sectionName}
- Page Type: ${context.pageType}

Analyze and improve:
1. Clarity and conciseness
2. Benefit focus
3. Emotional appeal
4. Action-orientation
5. Persuasiveness

Return in JSON format:
{
  "improvedCopy": "The improved version",
  "improvements": ["What was improved", "and why"],
  "conversionScore": 85
}`;
}
