# ✍️ Content Generation Agent

## Agent Overview

**Agent Name:** Content Generation Agent
**Agent ID:** `unite-hub.content-agent`
**Type:** AI-Powered Creative Agent
**Priority:** P1 (Core - Week 3)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-opus-4-1-20250805` (Extended Thinking enabled, 5000-10000 token budget)

### Database Tables Used

This agent manages 3 AI content generation tables:

1. **`generated_content`** - Text content (emails, proposals, case studies)
2. **`generated_images`** - AI-generated images (DALL-E, Midjourney)
3. **`ai_suggestions`** - AI recommendations (for mindmaps, features, improvements)

### Related Tables (Read-Only Access)

- **`contacts`** - Contact data for personalization
- **`interactions`** - Interaction history for context
- **`client_emails`** - Past email conversations
- **`campaigns`** - Campaign context
- **`marketing_personas`** - Brand voice and messaging
- **`marketing_strategies`** - Content strategy guidelines

---

## Purpose & Scope

### Responsibilities

The Content Agent is the **AI creative powerhouse** for Unite-Hub, generating:

#### 1. Email Content Generation (Extended Thinking)
- **Follow-up emails** - Personalized based on interaction history
- **Cold outreach emails** - Industry-specific, value-driven
- **Proposal emails** - Detailed proposals with pricing
- **Case study emails** - Success stories relevant to contact's industry
- **Re-engagement emails** - Win-back dormant contacts
- **Meeting recap emails** - Summarize discussions, next steps

#### 2. Long-Form Content Generation
- **Proposals** - Multi-page proposals with executive summary, solution, pricing
- **Case studies** - Customer success stories (problem, solution, results)
- **White papers** - Thought leadership content
- **Blog posts** - SEO-optimized articles (1000-2000 words)
- **Sales one-pagers** - Product/feature summaries
- **Email sequences** - 5-7 email drip campaigns

#### 3. AI Image Generation (DALL-E Integration)
- **Email headers** - Branded images for campaigns
- **Social media graphics** - LinkedIn, Twitter, Instagram posts
- **Product mockups** - Visualize features, concepts
- **Infographics** - Data visualization
- **Profile pictures** - AI-generated avatars (future)

#### 4. Content Personalization
- **Dynamic variables** - Name, company, industry, pain points
- **Tone matching** - Formal, casual, technical based on persona
- **Industry-specific** - Technology, healthcare, finance terminology
- **Localization** - Australian English spelling and idioms
- **Brand voice** - Consistent messaging across all content

#### 5. Content Quality Assurance
- **Grammar and spelling** - Automated proofreading
- **Readability scoring** - Flesch-Kincaid readability index
- **Plagiarism detection** - Originality verification
- **Brand compliance** - Voice, tone, messaging guidelines
- **A/B variant generation** - Multiple versions for testing

#### 6. Content Analytics & Optimization
- **Performance tracking** - Open rates, click rates per content type
- **Best-performing templates** - Identify top content
- **Content suggestions** - AI recommendations for improvements
- **Sentiment analysis** - Ensure positive, professional tone
- **Conversion tracking** - Link content to revenue

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== GENERATED CONTENT TABLE (Text Content) =====
interface GeneratedContent {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id: string; // UUID - Who this content is for

  // Content metadata
  title: string; // e.g., "Follow-up: Discovery Call Recap"
  content_type: 'followup' | 'proposal' | 'case_study' | 'cold_outreach' |
                're_engagement' | 'meeting_recap' | 'drip_email' | 'blog_post' |
                'white_paper' | 'sales_one_pager' | 'email_sequence';

  // Generated content
  generated_text: string; // The actual content (Markdown format)
  generated_html?: string; // HTML version (for emails)

  // AI generation metadata
  ai_model: string; // e.g., "claude-opus-4-1-20250805"
  thinking_tokens?: number; // Extended Thinking tokens used
  thinking_summary?: string; // AI's reasoning process

  // Personalization data
  personalization_vars: Record<string, string>; // Variables used (name, company, etc.)
  tone: 'formal' | 'casual' | 'technical' | 'friendly'; // Tone of voice
  target_audience?: string; // e.g., "C-level executives", "Technical buyers"

  // Quality metrics
  word_count: number;
  readability_score?: number; // Flesch-Kincaid (0-100, higher = easier)
  sentiment_score?: number; // -1 to 1 (negative to positive)

  // Workflow status
  status: 'draft' | 'approved' | 'sent' | 'archived';
  approved_by?: string; // UUID - User who approved
  approved_at?: string; // ISO timestamp
  sent_at?: string; // ISO timestamp

  // Campaign association
  campaign_id?: string; // UUID - If part of campaign
  drip_campaign_id?: string; // UUID - If part of drip sequence
  campaign_step_number?: number; // Which step in sequence

  // Version control
  version: number; // Version number (1, 2, 3...)
  parent_content_id?: string; // UUID - Original content if this is a revision

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== GENERATED IMAGES TABLE (AI Images) =====
interface GeneratedImage {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id?: string; // UUID - If image is for specific contact
  calendar_post_id?: string; // UUID - If image is for social post

  // Image generation
  prompt: string; // DALL-E prompt used
  image_url: string; // S3/CDN URL to full-size image
  thumbnail_url?: string; // Thumbnail version

  // Provider metadata
  provider: 'dall-e' | 'midjourney' | 'stable-diffusion' | 'ideogram';
  model?: string; // e.g., "dall-e-3", "dall-e-2"
  size?: string; // e.g., "1024x1024", "1792x1024"
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';

  // Brand customization
  brand_colors?: string[]; // Hex color codes (e.g., ["#FF5733", "#3357FF"])
  additional_params?: Record<string, any>; // JSONB for extra parameters

  // Cost tracking
  generation_cost: number; // USD cost (e.g., 0.04 for DALL-E 3 standard)
  revision_number: number; // 1, 2, 3... (for regenerations)
  parent_image_id?: string; // UUID - Original image if this is a variation

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string; // If generation failed

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== AI SUGGESTIONS TABLE (Content Recommendations) =====
interface AISuggestion {
  id: string; // UUID
  mindmap_id?: string; // UUID - If suggestion is for mindmap
  node_id?: string; // UUID - Specific node to improve
  content_id?: string; // UUID - If suggestion is for generated content

  // Suggestion details
  suggestion_type:
    | 'improve_headline'
    | 'add_cta'
    | 'shorten_paragraph'
    | 'add_social_proof'
    | 'personalize_intro'
    | 'fix_grammar'
    | 'improve_readability'
    | 'add_urgency'
    | 'optimize_seo';

  suggestion_text: string; // The actual suggestion
  reasoning?: string; // AI's explanation
  confidence_score: number; // 0.0-1.0 (confidence in suggestion)

  // Application status
  status: 'pending' | 'accepted' | 'dismissed' | 'applied';
  applied_at?: string; // ISO timestamp
  dismissed_at?: string; // ISO timestamp

  // Timestamps
  created_at: string; // ISO timestamp
}

// ===== CONTENT GENERATION REQUEST (Input Type) =====
interface ContentGenerationRequest {
  workspace_id: string; // REQUIRED
  contact_id: string; // REQUIRED (who is this content for?)

  // Content specs
  content_type:
    | 'followup'
    | 'proposal'
    | 'case_study'
    | 'cold_outreach'
    | 're_engagement'
    | 'meeting_recap'
    | 'drip_email';

  // Context (for personalization)
  context?: {
    previous_interactions?: Interaction[]; // Past emails, calls, meetings
    pain_points?: string[]; // Known challenges
    interests?: string[]; // Topics of interest
    company_info?: {
      name: string;
      industry: string;
      size: string;
      website?: string;
    };
    meeting_notes?: string; // If type = 'meeting_recap'
  };

  // Tone and style
  tone?: 'formal' | 'casual' | 'technical' | 'friendly'; // Default: 'professional'
  max_words?: number; // Word count limit (default: 300 for emails, 1000+ for proposals)

  // Brand voice (optional override)
  brand_voice_override?: {
    company_name: string;
    value_proposition: string;
    key_differentiators: string[];
  };

  // Extended Thinking settings
  thinking_budget?: number; // Thinking tokens (5000-10000, default: 7500)
  include_thinking_summary?: boolean; // Return AI's reasoning
}

// ===== CONTENT GENERATION RESULT (Output Type) =====
interface ContentGenerationResult {
  success: boolean;
  content: GeneratedContent;

  // AI metadata
  ai_model: string;
  thinking_tokens_used: number;
  thinking_summary?: string; // AI's reasoning process

  // Quality metrics
  quality_scores: {
    readability: number; // Flesch-Kincaid (0-100)
    sentiment: number; // -1 to 1
    tone_match: number; // 0-100 (how well it matches requested tone)
    personalization: number; // 0-100 (degree of personalization)
  };

  // Suggestions for improvement
  suggestions: AISuggestion[];

  // Generation cost
  cost_usd: number; // Total cost (input + output + thinking tokens)
}

// ===== IMAGE GENERATION REQUEST (Input Type) =====
interface ImageGenerationRequest {
  workspace_id: string; // REQUIRED
  contact_id?: string; // Optional (if image is for specific contact)
  calendar_post_id?: string; // Optional (if image is for social post)

  // Image specs
  prompt: string; // DALL-E prompt (max 4000 chars for DALL-E 3)
  size?: '1024x1024' | '1792x1024' | '1024x1792'; // Default: 1024x1024
  quality?: 'standard' | 'hd'; // Default: 'standard'
  style?: 'vivid' | 'natural'; // Default: 'vivid'

  // Brand customization
  brand_colors?: string[]; // Hex colors to incorporate
  include_brand_name?: boolean; // Add company name to image

  // Provider
  provider?: 'dall-e' | 'midjourney' | 'stable-diffusion'; // Default: 'dall-e'
}

// ===== IMAGE GENERATION RESULT (Output Type) =====
interface ImageGenerationResult {
  success: boolean;
  image: GeneratedImage;
  revised_prompt?: string; // DALL-E may revise prompts for safety
  cost_usd: number; // Generation cost
}
```

---

## Core Functions

### 1. Generate Email Content (Extended Thinking)

**Function:** `generateEmailContent(request: ContentGenerationRequest): Promise<ContentGenerationResult>`

**Purpose:** Generate personalized email content using Extended Thinking for high quality

**Input:**
```typescript
{
  workspace_id: "uuid",
  contact_id: "uuid",
  content_type: "followup",
  context: {
    previous_interactions: [
      {
        interaction_type: "meeting",
        subject: "Product demo",
        details: {
          outcome: "very_interested",
          notes: "Customer wants pricing for 50 users"
        },
        interaction_date: "2025-11-15T14:00:00Z"
      }
    ],
    pain_points: ["Manual data entry", "Lack of automation"],
    company_info: {
      name: "Acme Corp",
      industry: "Technology",
      size: "mid_market"
    }
  },
  tone: "professional",
  max_words: 250,
  thinking_budget: 7500,
  include_thinking_summary: true
}
```

**Output:**
```typescript
{
  success: true,
  content: {
    id: "uuid",
    title: "Follow-up: Product Demo for Acme Corp",
    content_type: "followup",
    generated_text: "Hi John,\n\nThank you for taking the time to meet yesterday...",
    generated_html: "<p>Hi John,</p><p>Thank you for taking the time...</p>",
    word_count: 237,
    readability_score: 65, // Easy to read
    sentiment_score: 0.85, // Very positive
    status: "draft"
  },
  ai_model: "claude-opus-4-1-20250805",
  thinking_tokens_used: 6842,
  thinking_summary: "I focused on addressing the customer's stated pain points (manual data entry, lack of automation) while referencing specific details from our demo conversation. The pricing inquiry shows strong buying intent, so I positioned the next step clearly: booking a pricing discussion call...",
  quality_scores: {
    readability: 65,
    sentiment: 0.85,
    tone_match: 92,
    personalization: 88
  },
  suggestions: [
    {
      suggestion_type: "add_social_proof",
      suggestion_text: "Consider adding a customer testimonial from a similar-sized tech company",
      confidence_score: 0.78
    }
  ],
  cost_usd: 0.12 // Approx cost for Opus with Extended Thinking
}
```

**Extended Thinking Implementation:**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'thinking-2025-11-15', // Extended Thinking header
  },
});

async function generateEmailContent(
  request: ContentGenerationRequest
): Promise<ContentGenerationResult> {
  // 1. Gather context
  const contact = await getContact(request.contact_id);
  const interactions = await getInteractions(request.contact_id, { limit: 10 });
  const pastEmails = await getClientEmails(request.contact_id, { limit: 5 });

  // 2. Build comprehensive context for AI
  const systemPrompt = `You are an expert email copywriter for Unite-Hub, a marketing CRM platform.

**Your Task:** Generate a personalized ${request.content_type} email.

**Brand Voice:**
- Professional yet approachable
- Value-driven (focus on ROI and outcomes)
- Data-informed (reference specific metrics)
- Action-oriented (clear next steps)

**Constraints:**
- Maximum ${request.max_words || 300} words
- Tone: ${request.tone || 'professional'}
- Australian English spelling
- Include specific call-to-action

**Context about recipient:**
- Name: ${contact.name}
- Company: ${contact.company} (${contact.industry})
- Role: ${contact.job_title}
- AI Score: ${Math.round(contact.ai_score * 100)}/100 (engagement level)

**Recent interaction history:**
${formatInteractions(interactions)}

**Previous email conversations:**
${formatEmailHistory(pastEmails)}

${request.context?.pain_points ? `\n**Known pain points:**\n${request.context.pain_points.join('\n- ')}` : ''}

${request.context?.meeting_notes ? `\n**Meeting notes:**\n${request.context.meeting_notes}` : ''}

**Output Format:**
Return ONLY the email body text. Do not include subject line (we'll generate that separately).
Use Markdown formatting for emphasis (**bold**, *italic*).
`;

  // 3. Call Claude with Extended Thinking
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 4096,
    thinking: {
      type: 'enabled',
      budget_tokens: request.thinking_budget || 7500,
    },
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a ${request.content_type} email for ${contact.name} at ${contact.company}.`,
      },
    ],
  });

  // 4. Extract thinking and response
  const thinkingBlock = message.content.find(
    (block) => block.type === 'thinking'
  );
  const textBlock = message.content.find((block) => block.type === 'text');

  const generatedText = textBlock?.text || '';
  const thinkingSummary = thinkingBlock?.thinking || '';

  // 5. Calculate quality metrics
  const readabilityScore = calculateReadability(generatedText);
  const sentimentScore = analyzeSentiment(generatedText);

  // 6. Convert Markdown to HTML
  const generatedHTML = markdownToHTML(generatedText);

  // 7. Store in database
  const content = await storeGeneratedContent({
    workspace_id: request.workspace_id,
    contact_id: request.contact_id,
    title: `${request.content_type}: ${contact.company}`,
    content_type: request.content_type,
    generated_text: generatedText,
    generated_html: generatedHTML,
    ai_model: 'claude-opus-4-1-20250805',
    thinking_tokens: thinkingBlock?.thinking_tokens || 0,
    thinking_summary: request.include_thinking_summary ? thinkingSummary : undefined,
    word_count: countWords(generatedText),
    readability_score: readabilityScore,
    sentiment_score: sentimentScore,
    tone: request.tone || 'professional',
    status: 'draft',
  });

  // 8. Generate suggestions for improvement
  const suggestions = await generateContentSuggestions(content.id, generatedText);

  // 9. Calculate cost
  const costUSD = calculateAnthropicCost({
    model: 'claude-opus-4-1-20250805',
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
    thinking_tokens: thinkingBlock?.thinking_tokens || 0,
  });

  return {
    success: true,
    content,
    ai_model: 'claude-opus-4-1-20250805',
    thinking_tokens_used: thinkingBlock?.thinking_tokens || 0,
    thinking_summary: request.include_thinking_summary ? thinkingSummary : undefined,
    quality_scores: {
      readability: readabilityScore,
      sentiment: sentimentScore,
      tone_match: calculateToneMatch(generatedText, request.tone || 'professional'),
      personalization: calculatePersonalizationScore(generatedText, contact),
    },
    suggestions,
    cost_usd: costUSD,
  };
}
```

**Anthropic Cost Calculation:**
```typescript
function calculateAnthropicCost(usage: {
  model: string;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
}): number {
  // Pricing for claude-opus-4 (as of 2025-01-18)
  const pricing = {
    'claude-opus-4-1-20250805': {
      input: 7.5 / 1_000_000, // $7.50 per MTok
      output: 22.5 / 1_000_000, // $22.50 per MTok
      thinking: 7.5 / 1_000_000, // $7.50 per MTok (same as input)
    },
  };

  const rates = pricing[usage.model];

  const inputCost = usage.input_tokens * rates.input;
  const outputCost = usage.output_tokens * rates.output;
  const thinkingCost = usage.thinking_tokens * rates.thinking;

  return inputCost + outputCost + thinkingCost;
}

// Example calculation:
// Input: 2000 tokens × $7.50/MTok = $0.015
// Output: 500 tokens × $22.50/MTok = $0.01125
// Thinking: 7500 tokens × $7.50/MTok = $0.05625
// Total: $0.08250 (~8 cents per email)
```

**Error Codes:**
- `CONTENT_001` - Missing required fields (workspace_id, contact_id, content_type)
- `CONTENT_002` - Contact not found
- `CONTENT_003` - Anthropic API error (rate limit, timeout)
- `CONTENT_004` - Content generation failed (safety filters triggered)

---

### 2. Generate AI Image (DALL-E)

**Function:** `generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>`

**Purpose:** Generate AI images for emails, social posts, mockups

**Input:**
```typescript
{
  workspace_id: "uuid",
  prompt: "Modern SaaS dashboard with clean UI, dark mode, analytics charts, professional, high-tech",
  size: "1024x1024",
  quality: "hd",
  style: "vivid",
  brand_colors: ["#3B82F6", "#8B5CF6"], // Blue and purple
  provider: "dall-e"
}
```

**Output:**
```typescript
{
  success: true,
  image: {
    id: "uuid",
    workspace_id: "uuid",
    prompt: "Modern SaaS dashboard...",
    image_url: "https://cdn.unite-hub.com/images/abc123.png",
    thumbnail_url: "https://cdn.unite-hub.com/images/abc123-thumb.png",
    provider: "dall-e",
    model: "dall-e-3",
    size: "1024x1024",
    quality: "hd",
    generation_cost: 0.08, // DALL-E 3 HD pricing
    status: "completed"
  },
  revised_prompt: "Modern SaaS dashboard with clean UI, dark mode...", // OpenAI may revise
  cost_usd: 0.08
}
```

**Implementation:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  // 1. Validate prompt (DALL-E has safety filters)
  if (request.prompt.length > 4000) {
    throw new Error('CONTENT_005: Prompt exceeds 4000 characters');
  }

  // 2. Enhance prompt with brand colors (if provided)
  let enhancedPrompt = request.prompt;
  if (request.brand_colors && request.brand_colors.length > 0) {
    enhancedPrompt += `, using color palette: ${request.brand_colors.join(', ')}`;
  }

  // 3. Call DALL-E API
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    size: request.size || '1024x1024',
    quality: request.quality || 'standard',
    style: request.style || 'vivid',
    n: 1, // DALL-E 3 only supports n=1
  });

  const generatedImage = response.data[0];

  // 4. Download and upload to our CDN (S3)
  const imageBuffer = await downloadImage(generatedImage.url);
  const imageUrl = await uploadToS3(imageBuffer, {
    workspace_id: request.workspace_id,
    filename: `dalle-${Date.now()}.png`,
  });

  // 5. Generate thumbnail
  const thumbnailBuffer = await resizeImage(imageBuffer, { width: 300, height: 300 });
  const thumbnailUrl = await uploadToS3(thumbnailBuffer, {
    workspace_id: request.workspace_id,
    filename: `dalle-${Date.now()}-thumb.png`,
  });

  // 6. Calculate cost
  const cost = calculateDALLECost({
    model: 'dall-e-3',
    size: request.size || '1024x1024',
    quality: request.quality || 'standard',
  });

  // 7. Store in database
  const image = await storeGeneratedImage({
    workspace_id: request.workspace_id,
    contact_id: request.contact_id,
    calendar_post_id: request.calendar_post_id,
    prompt: enhancedPrompt,
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    provider: 'dall-e',
    model: 'dall-e-3',
    size: request.size || '1024x1024',
    quality: request.quality || 'standard',
    style: request.style || 'vivid',
    brand_colors: request.brand_colors,
    generation_cost: cost,
    status: 'completed',
  });

  return {
    success: true,
    image,
    revised_prompt: generatedImage.revised_prompt,
    cost_usd: cost,
  };
}
```

**DALL-E Cost Calculation:**
```typescript
function calculateDALLECost(params: {
  model: string;
  size: string;
  quality: string;
}): number {
  // DALL-E 3 pricing (as of 2025-01-18)
  const pricing = {
    'dall-e-3': {
      '1024x1024': { standard: 0.04, hd: 0.08 },
      '1024x1792': { standard: 0.08, hd: 0.12 },
      '1792x1024': { standard: 0.08, hd: 0.12 },
    },
  };

  return pricing[params.model]?.[params.size]?.[params.quality] || 0.04;
}
```

**Error Codes:**
- `CONTENT_005` - Prompt too long (> 4000 chars)
- `CONTENT_006` - DALL-E safety filter triggered (prompt rejected)
- `CONTENT_007` - Image upload to S3 failed

---

### 3. Generate Content Suggestions

**Function:** `generateContentSuggestions(content_id: string, text: string): Promise<AISuggestion[]>`

**Purpose:** AI-powered suggestions to improve content quality

**Input:**
```typescript
{
  content_id: "uuid",
  text: "Hi John, I wanted to follow up on our call last week. We discussed your interest in our product. Let me know if you have questions."
}
```

**Output:**
```typescript
[
  {
    suggestion_type: "personalize_intro",
    suggestion_text: "Reference a specific detail from the call (e.g., 'Thank you for sharing your thoughts on automating your sales process')",
    reasoning: "Generic opening lacks personalization. Referencing specific discussion points builds stronger connection.",
    confidence_score: 0.92,
    status: "pending"
  },
  {
    suggestion_type: "add_cta",
    suggestion_text: "Add clear call-to-action: 'Are you available for a 15-minute call this Thursday at 2 PM AEST to discuss pricing?'",
    reasoning: "Current ending is passive ('let me know'). Specific CTA with date/time increases response rate by 40%.",
    confidence_score: 0.88,
    status: "pending"
  },
  {
    suggestion_type: "add_social_proof",
    suggestion_text: "Include brief customer success metric: 'Companies like yours have seen 30% reduction in manual data entry within 60 days.'",
    reasoning: "Social proof builds credibility and addresses stated pain point.",
    confidence_score: 0.75,
    status: "pending"
  }
]
```

**Implementation:**
```typescript
async function generateContentSuggestions(
  content_id: string,
  text: string
): Promise<AISuggestion[]> {
  const suggestions: AISuggestion[] = [];

  // 1. Check readability
  const readability = calculateReadability(text);
  if (readability < 50) {
    // Too complex
    suggestions.push({
      suggestion_type: 'improve_readability',
      suggestion_text: 'Simplify language. Break long sentences into shorter ones. Current readability: ' + readability + '/100 (target: 60+)',
      reasoning: 'Complex writing reduces email open rates. Aim for 8th-grade reading level.',
      confidence_score: 0.85,
      status: 'pending',
    });
  }

  // 2. Check for CTA
  const hasCTA = /\b(schedule|book|reply|download|register|sign up|click|view)\b/i.test(text);
  if (!hasCTA) {
    suggestions.push({
      suggestion_type: 'add_cta',
      suggestion_text: 'Add clear call-to-action with specific next step',
      reasoning: 'Emails without CTA have 50% lower response rates',
      confidence_score: 0.90,
      status: 'pending',
    });
  }

  // 3. Check for personalization
  const hasPersonalization = /\b(you|your)\b/gi.test(text);
  const personalCount = (text.match(/\b(you|your)\b/gi) || []).length;
  if (personalCount < 3) {
    suggestions.push({
      suggestion_type: 'personalize_intro',
      suggestion_text: 'Increase use of "you" and "your" (current: ' + personalCount + ' times). Reference specific details about recipient.',
      reasoning: 'Personalized emails have 26% higher open rates',
      confidence_score: 0.80,
      status: 'pending',
    });
  }

  // 4. Check for urgency
  const hasUrgency = /\b(today|tomorrow|this week|limited|deadline|expire)\b/i.test(text);
  if (!hasUrgency) {
    suggestions.push({
      suggestion_type: 'add_urgency',
      suggestion_text: 'Consider adding time-sensitive element to encourage action',
      reasoning: 'Urgency increases response rates, but use sparingly to avoid seeming pushy',
      confidence_score: 0.60,
      status: 'pending',
    });
  }

  // 5. Grammar check (use AI)
  const grammarIssues = await checkGrammar(text);
  if (grammarIssues.length > 0) {
    suggestions.push({
      suggestion_type: 'fix_grammar',
      suggestion_text: grammarIssues.join('; '),
      reasoning: 'Grammatical errors reduce credibility',
      confidence_score: 0.95,
      status: 'pending',
    });
  }

  // Store suggestions in database
  for (const suggestion of suggestions) {
    await storeSuggestion({
      content_id,
      ...suggestion,
    });
  }

  return suggestions;
}
```

---

### 4. Generate Email Sequence (Drip Campaign)

**Function:** `generateEmailSequence(request: SequenceRequest): Promise<EmailSequence>`

**Purpose:** Generate a complete 5-7 email drip campaign

**Input:**
```typescript
{
  workspace_id: "uuid",
  sequence_name: "Product Onboarding Sequence",
  target_audience: "New trial users",
  goal: "Convert trial to paid within 14 days",
  num_emails: 5,
  cadence_days: [0, 3, 7, 10, 14], // Days after trigger
  tone: "friendly",
  include_images: true
}
```

**Output:**
```typescript
{
  success: true,
  sequence: {
    name: "Product Onboarding Sequence",
    emails: [
      {
        step_number: 1,
        day_delay: 0,
        subject: "Welcome to Unite-Hub! 🎉",
        generated_text: "Hi {{first_name}},\n\nWelcome aboard!...",
        cta: "Complete Your Profile",
        cta_url: "https://app.unite-hub.com/onboarding"
      },
      {
        step_number: 2,
        day_delay: 3,
        subject: "Quick tip: Import your contacts in 60 seconds",
        generated_text: "Hi {{first_name}},\n\nHave you had a chance to...",
        cta: "Import Contacts Now",
        cta_url: "https://app.unite-hub.com/contacts/import"
      },
      // ... 3 more emails
    ],
    total_cost_usd: 0.45, // 5 emails × ~$0.09 each with Extended Thinking
    thinking_summary: "Designed sequence with progressive value delivery..."
  }
}
```

---

### 5. A/B Test Content Variants

**Function:** `generateABVariants(content_id: string, num_variants: number): Promise<ContentVariant[]>`

**Purpose:** Generate multiple versions for A/B testing

**Input:**
```typescript
{
  content_id: "uuid",
  num_variants: 3,
  vary_element: "subject" // "subject", "intro", "cta", "entire"
}
```

**Output:**
```typescript
{
  success: true,
  variants: [
    {
      variant_id: "uuid-1",
      variant_name: "A (Control)",
      subject: "Quick question about your sales process",
      changes: "Original version"
    },
    {
      variant_id: "uuid-2",
      variant_name: "B (Curiosity)",
      subject: "The one thing holding back your sales team",
      changes: "Curiosity-driven subject line"
    },
    {
      variant_id: "uuid-3",
      variant_name: "C (Personalized)",
      subject: "{{company}} + Unite-Hub = 30% more deals closed",
      changes: "Personalized with metric"
    }
  ]
}
```

---

## API Endpoints

### 1. Generate Email Content

**Endpoint:** `POST /api/content/generate/email`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "contactId": "uuid",
  "contentType": "followup",
  "tone": "professional",
  "maxWords": 250,
  "thinkingBudget": 7500,
  "context": {
    "pain_points": ["Manual data entry"],
    "company_info": {
      "name": "Acme Corp",
      "industry": "Technology"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "content": {...},
  "thinkingTokensUsed": 6842,
  "qualityScores": {...},
  "suggestions": [...],
  "costUsd": 0.12
}
```

---

### 2. Generate AI Image

**Endpoint:** `POST /api/content/generate/image`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "prompt": "Modern SaaS dashboard, dark mode, clean UI",
  "size": "1024x1024",
  "quality": "hd",
  "brandColors": ["#3B82F6", "#8B5CF6"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "imageUrl": "https://cdn.unite-hub.com/images/abc123.png",
    "thumbnailUrl": "https://cdn.unite-hub.com/images/abc123-thumb.png"
  },
  "costUsd": 0.08
}
```

---

### 3. Get Content Suggestions

**Endpoint:** `GET /api/content/:content_id/suggestions`

**Response (200 OK):**
```json
{
  "success": true,
  "suggestions": [
    {
      "suggestionType": "add_cta",
      "suggestionText": "Add specific call-to-action",
      "confidenceScore": 0.88
    }
  ]
}
```

---

## Integration Points

### Inputs
- **Contact Agent:** Contact data for personalization
- **Campaign Agent:** Campaign context, drip sequences
- **Email Agent:** Send generated content

### Outputs
- **To Campaign Agent:** Generated email sequences
- **To Email Agent:** Ready-to-send content
- **To Analytics Agent:** Content performance data

---

## Business Rules

### 1. Extended Thinking Usage

**When to Use:**
- Proposals, case studies (complex, high-value content)
- Email sequences (need coherent narrative across 5-7 emails)
- Cold outreach (require strategic thinking)

**When NOT to Use:**
- Simple follow-ups (standard Sonnet sufficient)
- Transactional emails (welcome, password reset)
- Internal notes

**Cost Consideration:**
- Extended Thinking: ~$0.08-0.15 per email
- Standard Sonnet: ~$0.01-0.03 per email
- Use Extended Thinking only for contacts with AI score > 60 (warm/hot leads)

---

### 2. Content Approval Workflow

**Draft → Review → Approve → Send:**
1. AI generates content (status: 'draft')
2. User reviews and edits
3. User approves (status: 'approved')
4. Content sent via Email Agent (status: 'sent')

---

## Performance Requirements

| Operation | Target | Max |
|-----------|--------|-----|
| Generate email | < 5s | 10s |
| Generate image | < 10s | 20s |
| Generate suggestions | < 1s | 3s |

---

## Error Codes

| Code | Error | Status |
|------|-------|--------|
| `CONTENT_001` | Missing required fields | 400 |
| `CONTENT_002` | Contact not found | 404 |
| `CONTENT_003` | Anthropic API error | 500 |
| `CONTENT_004` | Content generation failed | 500 |
| `CONTENT_005` | Prompt too long | 400 |
| `CONTENT_006` | DALL-E safety filter | 400 |
| `CONTENT_007` | Image upload failed | 500 |

---

## Future Enhancements

### Phase 2
- Video script generation (for product demos)
- Podcast show notes generation
- LinkedIn post generation
- Newsletter generation

### Phase 3
- Voice cloning (personalized video messages)
- Multi-language content (10+ languages)
- Brand voice training (custom fine-tuned models)

---

**Status:** ✅ Specification Complete
**Implementation:** 3-4 weeks
**Dependencies:** Contact Agent (P0), Email Agent (P0)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5)
