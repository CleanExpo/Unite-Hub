# AI CONTENT GENERATION AGENT SPECIFICATION

**Agent Name**: AI Content Generation Agent
**Agent Type**: Tier 4 - Autonomous Execution Agent
**Priority**: P1 - Critical
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `generated_content` - AI-generated content drafts (read/write)
- `marketing_strategies` - Content pillars and positioning (read-only)
- `email_intelligence` - Client intelligence for personalization (read-only)
- `contacts` - Contact information (read-only)
- `autonomous_tasks` - Task queue (read-only)

### Agent Purpose
Generates high-quality marketing content (blog posts, emails, social media posts, case studies) using Claude AI with Extended Thinking, personalizes content based on client intelligence, follows brand voice guidelines, and creates SEO-optimized, platform-specific content.

---

## 2. CORE FUNCTIONS

### 2.1 generateBlogPost()
**Purpose**: Generate SEO-optimized blog post from content pillar.

**Input**:
```typescript
interface GenerateBlogPostRequest {
  contact_id: string;
  workspace_id: string;
  pillar: ContentPillar;
  topic: string;
  target_word_count?: number; // Default: 1200
  seo_keywords?: string[];
  tone?: 'professional' | 'casual' | 'authoritative'; // Default: from strategy
}
```

**Output**:
```typescript
interface GenerateBlogPostResult {
  success: boolean;
  content_id: string;
  blog_post: BlogPost;
}

interface BlogPost {
  title: string;
  slug: string;
  meta_description: string;
  featured_image_prompt: string; // DALL-E prompt
  introduction: string;
  body: Section[];
  conclusion: string;
  call_to_action: string;
  seo_keywords: string[];
  estimated_read_time: number; // Minutes
  word_count: number;
}

interface Section {
  heading: string;
  content: string;
  subsections?: {
    subheading: string;
    content: string;
  }[];
}
```

**Business Logic**:
1. **Fetch intelligence**:
   ```typescript
   const intelligence = await getClientIntelligence(contact_id);
   const strategy = await getMarketingStrategy(contact_id);
   ```

2. **Build Claude prompt** (Extended Thinking for high quality):
   ```typescript
   const prompt = `Generate a comprehensive blog post for this marketing campaign.

CLIENT CONTEXT:
- Company: ${contact.company}
- Industry: ${contact.industry}
- Brand Voice: ${strategy.brand_positioning.brand_voice}
- Brand Personality: ${strategy.brand_positioning.brand_personality.join(', ')}

CONTENT PILLAR:
- Name: ${pillar.name}
- Description: ${pillar.description}
- Themes: ${pillar.themes.join(', ')}

TOPIC: ${topic}

TARGET AUDIENCE:
- Pain Points: ${intelligence.pain_points.map(p => p.text).join(', ')}
- Goals: ${intelligence.business_goals.map(g => g.text).join(', ')}

SEO KEYWORDS: ${seo_keywords.join(', ')}

REQUIREMENTS:
1. Title: Compelling, includes primary keyword
2. Meta Description: 150-160 characters, includes keyword, enticing
3. Introduction: 100-150 words, hook + preview
4. Body: ${target_word_count} words total
   - 4-6 sections with H2 headings
   - Each section 200-300 words
   - Use H3 subheadings where appropriate
   - Include examples, statistics, actionable tips
   - Address pain points discovered in intelligence
5. Conclusion: 100-150 words, summarize + reinforce value
6. Call-to-Action: Clear next step (book demo, start trial, download resource)
7. Featured Image: DALL-E prompt for hero image
8. Tone: ${tone}
9. SEO: Naturally include keywords, maintain readability

Return as JSON matching BlogPost interface.`;
   ```

3. **Call Claude API** (Extended Thinking):
   ```typescript
   const message = await anthropic.messages.create({
     model: 'claude-opus-4-5-20251101',
     max_tokens: 8192,
     temperature: 0.7, // Creative but controlled
     thinking: {
       type: 'enabled',
       budget_tokens: 5000, // High-quality content creation
     },
     messages: [{ role: 'user', content: prompt }],
   });
   ```

4. **Parse and validate**:
   ```typescript
   const blogPost = JSON.parse(message.content[0].text);

   // Validate word count
   const totalWords = calculateWordCount(blogPost);
   if (totalWords < target_word_count * 0.9 || totalWords > target_word_count * 1.1) {
     throw new Error(`Word count ${totalWords} outside target range`);
   }

   // Validate SEO
   if (blogPost.meta_description.length > 160) {
     blogPost.meta_description = blogPost.meta_description.substring(0, 157) + '...';
   }
   ```

5. **Save to database**:
   ```typescript
   const { data: content, error } = await supabase
     .from('generated_content')
     .insert({
       workspace_id,
       contact_id,
       title: blogPost.title,
       content_type: 'blog_post',
       generated_text: JSON.stringify(blogPost),
       ai_model: 'claude-opus-4-5-20251101',
       status: 'draft',
     })
     .select()
     .single();
   ```

6. **Return blog post**:
   ```typescript
   return {
     success: true,
     content_id: content.id,
     blog_post: blogPost,
   };
   ```

**Performance**: < 40 seconds (Claude Extended Thinking + 8k tokens)

---

### 2.2 generateEmailCopy()
**Purpose**: Generate personalized email for drip campaigns.

**Input**:
```typescript
interface GenerateEmailCopyRequest {
  contact_id: string;
  workspace_id: string;
  email_type: 'welcome' | 'nurture' | 'promotion' | 'followup' | 'reengagement';
  campaign_context?: string;
  personalization_tokens?: Record<string, string>; // {first_name: "John"}
}
```

**Output**:
```typescript
interface GenerateEmailCopyResult {
  success: boolean;
  content_id: string;
  email: EmailContent;
}

interface EmailContent {
  subject_lines: string[]; // 3 variants for A/B testing
  preview_text: string;
  body_html: string;
  body_text: string; // Plain text fallback
  call_to_action: {
    text: string;
    url_placeholder: string;
  };
  personalization_used: string[];
  estimated_read_time: number; // Seconds
}
```

**Business Logic**:
1. **Fetch intelligence and strategy**:
   ```typescript
   const intelligence = await getClientIntelligence(contact_id);
   const contact = await getContact(contact_id);
   ```

2. **Build email prompt**:
   ```typescript
   const prompt = `Generate a personalized marketing email.

RECIPIENT CONTEXT:
- Name: ${contact.name}
- Company: ${contact.company}
- Pain Points: ${intelligence.pain_points.slice(0, 3).map(p => p.text).join(', ')}
- Goals: ${intelligence.business_goals.slice(0, 2).map(g => g.text).join(', ')}
- Decision Readiness: ${intelligence.decision_readiness}/10

EMAIL TYPE: ${email_type}

CAMPAIGN CONTEXT: ${campaign_context || 'N/A'}

REQUIREMENTS:
1. Subject Lines: 3 variants (30-50 characters each)
   - Variant A: Curiosity-driven
   - Variant B: Benefit-focused
   - Variant C: Urgency/FOMO
2. Preview Text: 40-60 characters, complements subject
3. Body: 150-250 words
   - Personalized greeting
   - Reference specific pain point/goal
   - Provide value (tip, insight, resource)
   - Clear call-to-action
   - Professional signature
4. Tone: Professional but approachable
5. Personalization: Use {first_name}, {company} tokens
6. HTML + Plain Text versions
7. CTA: Clear button text + URL placeholder

Return as JSON matching EmailContent interface.`;
   ```

3. **Call Claude API** (Sonnet for speed):
   ```typescript
   const message = await anthropic.messages.create({
     model: 'claude-sonnet-4-5-20250929',
     max_tokens: 2048,
     temperature: 0.7,
     messages: [{ role: 'user', content: prompt }],
   });
   ```

4. **Save to database**:
   ```typescript
   await supabase.from('generated_content').insert({
     workspace_id,
     contact_id,
     title: `Email: ${email_type}`,
     content_type: 'email',
     generated_text: JSON.stringify(emailContent),
     ai_model: 'claude-sonnet-4-5-20250929',
     status: 'draft',
   });
   ```

**Performance**: < 10 seconds

---

### 2.3 generateSocialPost()
**Purpose**: Generate platform-specific social media posts.

**Input**:
```typescript
interface GenerateSocialPostRequest {
  contact_id: string;
  workspace_id: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';
  post_type: 'text' | 'image' | 'video' | 'carousel';
  content_pillar: string;
  topic: string;
}
```

**Output**:
```typescript
interface GenerateSocialPostResult {
  success: boolean;
  content_id: string;
  posts: SocialPost[];
}

interface SocialPost {
  platform: string;
  post_type: string;
  copy: string;
  hashtags: string[];
  image_prompt?: string; // DALL-E prompt
  character_count: number;
  emoji_count: number;
  best_posting_time: string; // "9:00 AM AEST Tuesday"
}
```

**Business Logic**:
1. **Platform-specific constraints**:
   ```typescript
   const platformLimits = {
     linkedin: { maxChars: 3000, hashtagLimit: 5, tone: 'professional' },
     facebook: { maxChars: 63206, hashtagLimit: 10, tone: 'casual' },
     instagram: { maxChars: 2200, hashtagLimit: 30, tone: 'visual-first' },
     twitter: { maxChars: 280, hashtagLimit: 3, tone: 'concise' },
     tiktok: { maxChars: 2200, hashtagLimit: 10, tone: 'trendy' },
   };
   ```

2. **Generate 3 variants**:
   ```typescript
   const prompt = `Generate 3 social media post variants for ${platform}.

PLATFORM CONSTRAINTS:
- Max Characters: ${platformLimits[platform].maxChars}
- Max Hashtags: ${platformLimits[platform].hashtagLimit}
- Tone: ${platformLimits[platform].tone}

CONTENT PILLAR: ${content_pillar}
TOPIC: ${topic}

REQUIREMENTS:
1. 3 Variants:
   - Variant A: Educational/informative
   - Variant B: Engaging/storytelling
   - Variant C: Promotional/CTA-focused
2. Hashtags: ${platformLimits[platform].hashtagLimit} max, relevant, mix popular + niche
3. Emojis: Use strategically (2-4 per post)
4. Image Prompt: If post_type='image', provide DALL-E prompt
5. Best Posting Time: Based on Australian business hours + platform best practices

Return 3 posts as JSON array matching SocialPost interface.`;
   ```

3. **Call Claude API**:
   ```typescript
   const message = await anthropic.messages.create({
     model: 'claude-sonnet-4-5-20250929',
     max_tokens: 2048,
     temperature: 0.8, // More creative for social
     messages: [{ role: 'user', content: prompt }],
   });
   ```

**Performance**: < 8 seconds

---

### 2.4 generateCaseStudy()
**Purpose**: Create client success story from intelligence.

**Input**:
```typescript
interface GenerateCaseStudyRequest {
  contact_id: string;
  workspace_id: string;
  client_name?: string;
  industry?: string;
  results?: {
    metric: string;
    before: string;
    after: string;
  }[];
}
```

**Output**:
```typescript
interface GenerateCaseStudyResult {
  success: boolean;
  content_id: string;
  case_study: CaseStudy;
}

interface CaseStudy {
  title: string;
  client_overview: {
    name: string;
    industry: string;
    size: string;
    challenge: string;
  };
  problem_statement: string;
  solution: {
    approach: string;
    implementation: string[];
    timeline: string;
  };
  results: {
    metric: string;
    improvement: string;
    visual_type: 'graph' | 'number' | 'comparison';
  }[];
  testimonial: {
    quote: string;
    attribution: string;
  };
  call_to_action: string;
  word_count: number;
}
```

**Business Logic**:
1. **Fetch all intelligence**:
   ```typescript
   const intelligence = await getClientIntelligence(contact_id);
   const painPoints = intelligence.pain_points;
   const goals = intelligence.business_goals;
   ```

2. **Generate case study** (Extended Thinking):
   ```typescript
   const prompt = `Generate a compelling case study.

CLIENT INFORMATION:
- Name: ${client_name || 'Confidential Client'}
- Industry: ${industry || contact.industry}

PAIN POINTS (from intelligence):
${painPoints.map(p => `- ${p.text}`).join('\n')}

GOALS (from intelligence):
${goals.map(g => `- ${g.text}`).join('\n')}

RESULTS:
${results.map(r => `- ${r.metric}: ${r.before} → ${r.after}`).join('\n')}

REQUIREMENTS:
1. Title: Compelling, includes key result
2. Client Overview: 50 words, context + challenge
3. Problem Statement: 100 words, detailed challenges
4. Solution: 200 words
   - Approach taken
   - Implementation steps (3-5 bullet points)
   - Timeline
5. Results: 3-5 metrics with visualizations
   - Use actual numbers from results array
   - Suggest visual type (graph/number/comparison)
6. Testimonial: Realistic quote + attribution
7. CTA: Encourage readers to learn more/book demo
8. Total: 800-1000 words

Return as JSON matching CaseStudy interface.`;
   ```

3. **Call Claude API** (Extended Thinking):
   ```typescript
   const message = await anthropic.messages.create({
     model: 'claude-opus-4-5-20251101',
     max_tokens: 4096,
     temperature: 0.6,
     thinking: {
       type: 'enabled',
       budget_tokens: 3000,
     },
     messages: [{ role: 'user', content: prompt }],
   });
   ```

**Performance**: < 25 seconds

---

### 2.5 rewriteContent()
**Purpose**: Rewrite existing content to match different tone/length/platform.

**Input**:
```typescript
interface RewriteContentRequest {
  original_content: string;
  target_platform: string;
  target_tone?: string;
  target_length?: 'shorter' | 'longer' | 'same';
  preserve_facts?: boolean; // Default: true
}
```

**Output**:
```typescript
interface RewriteContentResult {
  success: boolean;
  rewritten_content: string;
  changes_made: string[];
}
```

**Business Logic**:
```typescript
const prompt = `Rewrite this content for ${target_platform}.

ORIGINAL CONTENT:
${original_content}

TARGET PLATFORM: ${target_platform}
TARGET TONE: ${target_tone || 'maintain original'}
TARGET LENGTH: ${target_length || 'same'}
PRESERVE FACTS: ${preserve_facts}

REQUIREMENTS:
1. Adapt to platform conventions
2. Adjust tone as specified
3. ${target_length === 'shorter' ? 'Condense while keeping key points' : target_length === 'longer' ? 'Expand with examples and details' : 'Maintain similar length'}
4. ${preserve_facts ? 'Keep all facts, statistics, quotes accurate' : 'Can paraphrase facts'}

Return rewritten content + list of changes made.`;

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  temperature: 0.5,
  messages: [{ role: 'user', content: prompt }],
});
```

**Performance**: < 10 seconds

---

## 3. API ENDPOINTS

### POST /api/content/blog
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "pillar": {
    "name": "AI Education",
    "description": "Demystify AI for marketing teams",
    "themes": ["How AI works", "AI benefits"]
  },
  "topic": "How AI-Powered Lead Scoring Saves Marketing Teams 10 Hours Per Week",
  "target_word_count": 1200,
  "seo_keywords": ["AI lead scoring", "marketing automation", "lead prioritization"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "content_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "blog_post": {
    "title": "How AI-Powered Lead Scoring Saves Marketing Teams 10 Hours Per Week",
    "slug": "ai-lead-scoring-saves-10-hours-weekly",
    "meta_description": "Discover how AI lead scoring automates prioritization, helping marketing teams focus on high-value prospects and save 10+ hours weekly.",
    "featured_image_prompt": "Modern marketing team celebrating around a laptop showing AI analytics dashboard, bright office, diverse team, professional photography",
    "introduction": "Marketing teams waste an average of 10 hours per week manually qualifying leads...",
    "body": [
      {
        "heading": "The Manual Lead Scoring Problem",
        "content": "Traditional lead scoring requires marketing teams to...",
        "subsections": [
          {
            "subheading": "Hidden Costs of Manual Qualification",
            "content": "Beyond the 10 hours per week spent on lead scoring..."
          }
        ]
      }
    ],
    "conclusion": "AI-powered lead scoring isn't just a time-saver...",
    "call_to_action": "Ready to save 10 hours per week? Start your free 14-day trial of Unite-Hub's AI lead scoring today.",
    "seo_keywords": ["AI lead scoring", "marketing automation", "lead prioritization"],
    "estimated_read_time": 6,
    "word_count": 1247
  }
}
```

### POST /api/content/email
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "email_type": "nurture",
  "campaign_context": "Post-webinar follow-up for attendees who didn't book demo"
}
```

**Response**:
```json
{
  "success": true,
  "content_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "email": {
    "subject_lines": [
      "Quick question about your marketing automation goals",
      "3 ways AI can solve your lead qualification challenge",
      "Last chance: Exclusive demo offer expires Friday"
    ],
    "preview_text": "Based on your webinar questions, I thought you'd find this useful...",
    "body_html": "<p>Hi {first_name},</p><p>Thanks for joining our webinar...</p>",
    "body_text": "Hi {first_name},\n\nThanks for joining our webinar...",
    "call_to_action": {
      "text": "Book Your Personalized Demo",
      "url_placeholder": "{demo_booking_url}"
    },
    "personalization_used": ["first_name", "company"],
    "estimated_read_time": 45
  }
}
```

### POST /api/content/social
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "platform": "linkedin",
  "post_type": "image",
  "content_pillar": "Marketing Best Practices",
  "topic": "5 Mistakes Killing Your Email Open Rates"
}
```

**Response**:
```json
{
  "success": true,
  "content_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "posts": [
    {
      "platform": "linkedin",
      "post_type": "image",
      "copy": "🚨 5 Mistakes Killing Your Email Open Rates\n\nAfter analyzing 10,000+ campaigns, we found these 5 mistakes destroy email performance...",
      "hashtags": ["#EmailMarketing", "#MarketingAutomation", "#LeadGeneration", "#B2BMarketing", "#MarketingTips"],
      "image_prompt": "Infographic showing 5 email marketing mistakes with icons and statistics, modern design, LinkedIn-style professional",
      "character_count": 487,
      "emoji_count": 3,
      "best_posting_time": "9:00 AM AEST Tuesday"
    }
  ]
}
```

---

## 4. DATABASE SCHEMA

### generated_content Table (EXISTING)
```sql
CREATE TABLE generated_content (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  contact_id UUID REFERENCES contacts(id),

  title TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('followup', 'proposal', 'case_study', 'blog_post', 'email', 'social_post')),
  generated_text TEXT NOT NULL, -- JSON string of content
  ai_model TEXT NOT NULL,

  status TEXT CHECK (status IN ('draft', 'approved', 'sent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Extend content_type Values (MIGRATION NEEDED)
```sql
-- Drop old constraint
ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_content_type_check;

-- Add new constraint with additional types
ALTER TABLE generated_content
ADD CONSTRAINT generated_content_content_type_check
CHECK (content_type IN (
  'followup', 'proposal', 'case_study',
  'blog_post', 'email', 'social_post', 'other'
));
```

---

## 5. BUSINESS RULES

### Content Quality Standards
1. **Minimum Word Counts**:
   - Blog posts: 1000-2000 words
   - Case studies: 800-1200 words
   - Emails: 150-300 words
   - Social posts: Platform-specific (see platformLimits)

2. **SEO Requirements** (Blog Posts):
   - Primary keyword in title, H1, first paragraph
   - Meta description: 150-160 characters
   - Alt text for all images
   - Internal links: 2-3 per post
   - External links: 1-2 authoritative sources

3. **Personalization Requirements**:
   - Use client intelligence in ALL content
   - Reference specific pain points (at least 1 per piece)
   - Align with brand voice from strategy

4. **A/B Testing**:
   - Generate 3 variants for email subject lines
   - Generate 3 variants for social posts
   - Track performance to improve future generation

---

## 6. PERFORMANCE REQUIREMENTS

### Response Times
- **Blog Post**: < 40 seconds (Extended Thinking)
- **Email Copy**: < 10 seconds
- **Social Post**: < 8 seconds
- **Case Study**: < 25 seconds
- **Rewrite**: < 10 seconds

### Quality Metrics
- **Human Approval Rate**: > 80% drafts approved without major edits
- **SEO Score**: > 70/100 (Yoast/SEMrush standards)
- **Readability**: Flesch Reading Ease > 60 (8th-9th grade level)

### Cost Management
- **Claude API Cost**: ~$0.10-0.30 per blog post (Opus + Extended Thinking)
- **Email Cost**: ~$0.01-0.02 per email (Sonnet, no Extended Thinking)
- **Social Cost**: ~$0.01 per post (Sonnet)

---

## 7. TESTING STRATEGY

### Unit Tests
```typescript
describe('AI Content Generation Agent', () => {
  describe('generateBlogPost()', () => {
    it('should generate blog post within word count range', async () => {
      const result = await generateBlogPost({
        contact_id, workspace_id, pillar, topic, target_word_count: 1200
      });
      expect(result.blog_post.word_count).toBeGreaterThanOrEqual(1080); // 90% of target
      expect(result.blog_post.word_count).toBeLessThanOrEqual(1320); // 110% of target
    });

    it('should include SEO keywords', async () => {
      const result = await generateBlogPost({
        contact_id, workspace_id, pillar, topic, seo_keywords: ['AI', 'automation']
      });
      const fullText = JSON.stringify(result.blog_post).toLowerCase();
      expect(fullText).toContain('ai');
      expect(fullText).toContain('automation');
    });
  });
});
```

---

## 8. ERROR CODES

| Code | Description |
|------|-------------|
| CONT_001 | Contact not found |
| CONT_002 | Insufficient intelligence for personalization |
| CONT_003 | Content generation failed (Claude API error) |
| CONT_004 | Word count validation failed |
| CONT_005 | SEO validation failed |
| CONT_006 | Platform constraints violated |

---

## 9. AUSTRALIAN COMPLIANCE

### Spam Act 2003
- **Email Content**: All generated emails include unsubscribe link placeholder
- **Consent**: Verify contact consent before generating promotional emails
- **Business Identity**: Include company ABN/ACN in email footers

### Timezones
- **Best Posting Times**: Optimized for AEST/AEDT business hours (9am-5pm)
- **Email Send Times**: Recommend 9am-12pm AEST for highest open rates

---

## 10. FUTURE ENHANCEMENTS

### Phase 2
1. **Multi-language Content**: Generate content in 10+ languages
2. **Voice Cloning**: Match client's writing style from sample text
3. **Image Generation**: Integrate DALL-E for automatic featured images
4. **Video Script Generation**: Create scripts for video content

### Phase 3
1. **Content Optimization**: A/B test and improve based on performance
2. **SEO Auto-Optimization**: Auto-adjust keywords based on rankings
3. **Content Calendar Integration**: Auto-schedule generated content
4. **Plagiarism Detection**: Ensure all content is original

---

**END OF AI CONTENT GENERATION AGENT SPECIFICATION**
