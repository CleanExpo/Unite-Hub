# 📱 Social Media Management Agent

## Agent Overview

**Agent Name:** Social Media Management Agent
**Agent ID:** `unite-hub.social-media-agent`
**Type:** Multi-Channel Marketing Agent
**Priority:** P2 (Enhancement - Week 5)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-sonnet-4-5-20250929` (content generation), `claude-opus-4-1-20250805` (strategy planning)

### Database Tables Used

This agent manages 3 social media marketing tables:

1. **`calendar_posts`** - Social media content calendar
2. **`marketing_personas`** - Target audience personas
3. **`marketing_strategies`** - Content strategy frameworks

### Related Tables (Read-Only Access)

- **`generated_images`** - AI-generated social graphics
- **`contacts`** - Contact data for targeting
- **`generated_content`** - Repurpose email content for social
- **`campaign_enrollments`** - Cross-channel coordination

---

## Purpose & Scope

### Responsibilities

The Social Media Agent extends Unite-Hub's reach **beyond email** to social channels:

#### 1. Content Calendar Management
- **Multi-platform scheduling** - LinkedIn, Twitter, Facebook, Instagram, TikTok
- **Content planning** - 30/60/90-day content calendars
- **Posting frequency optimization** - AI-recommended posting schedule
- **Content mix management** - Educational, promotional, engagement posts
- **Holiday/event planning** - Automated holiday content suggestions
- **Content gap detection** - Identify missing content types

#### 2. AI-Powered Content Generation
- **Platform-specific copy** - Optimized for each platform's character limits and style
- **Hashtag generation** - Trending and relevant hashtags (max 30 per post)
- **Image prompts** - DALL-E prompts for social graphics
- **Carousel content** - Multi-slide LinkedIn/Instagram carousels
- **Video scripts** - Short-form video content (TikTok, Reels, Stories)
- **Thread generation** - Twitter/X threads (8-12 tweets)

#### 3. Marketing Strategy Development
- **Content pillar creation** - 3-5 core themes (education, thought leadership, product, culture)
- **Audience persona definition** - Demographics, pain points, goals
- **Platform selection** - Best platforms for target audience
- **Posting frequency planning** - Platform-specific schedules
- **Content ratio planning** - 80% value, 20% promotional
- **Competitive analysis** - Benchmark against industry leaders (future)

#### 4. Cross-Platform Publishing
- **Native posting** - Direct API integration with platforms (future)
- **Scheduled publishing** - Queue posts for optimal times
- **Cross-posting** - Adapt content for multiple platforms
- **UTM parameter tracking** - Track social → website conversions
- **Social listening** - Monitor mentions and engagement (future)

#### 5. Performance Analytics
- **Engagement metrics** - Likes, comments, shares, saves
- **Reach & impressions** - Organic vs. paid reach
- **Follower growth** - Track follower count over time
- **Best-performing content** - Top posts by engagement rate
- **Optimal posting times** - When audience is most active
- **Content type analysis** - Which formats perform best (video vs. image vs. text)

#### 6. Content Repurposing
- **Email → Social** - Turn email content into social posts
- **Blog → Social** - Break articles into bite-sized posts
- **Long-form → Short-form** - Repurpose webinars, podcasts into clips
- **Cross-platform adaptation** - LinkedIn article → Twitter thread → Instagram carousel

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== CALENDAR POSTS TABLE (Social Media Content Calendar) =====
interface CalendarPost {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id: string; // UUID - Client/brand this post is for
  strategy_id?: string; // UUID - References marketing_strategies.id

  // Scheduling
  scheduled_date: string; // ISO timestamp - When to publish
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'general';
  post_type: 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'article';

  // Content details
  content_pillar?: string; // e.g., "Thought Leadership", "Product Updates"
  suggested_copy: string; // The actual post text
  suggested_hashtags?: string[]; // Array of hashtags (max 30)
  suggested_image_prompt?: string; // DALL-E prompt for image generation

  // AI metadata
  ai_reasoning?: string; // Why AI chose this content/timing
  best_time_to_post?: string; // Recommended time based on engagement data
  target_audience?: string; // Who this post targets
  call_to_action?: string; // CTA (e.g., "Learn more", "Sign up", "Download")

  // Status tracking
  status: 'draft' | 'approved' | 'published' | 'archived';
  approved_at?: string; // ISO timestamp
  approved_by?: string; // UUID - User who approved
  published_at?: string; // ISO timestamp - When actually published

  // Performance tracking (populated after publishing)
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement_rate?: number; // (likes + comments + shares) / impressions × 100

  // External IDs (for API integration)
  platform_post_id?: string; // LinkedIn post ID, Twitter tweet ID, etc.
  platform_url?: string; // Direct URL to published post

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== MARKETING PERSONAS TABLE (Target Audience Definition) =====
interface MarketingPersona {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id: string; // UUID - Client this persona is for

  // Persona details
  persona_name: string; // e.g., "Tech-Savvy CMO", "Small Business Owner"
  description?: string; // Narrative description

  demographics: {
    age_range?: string; // e.g., "35-50"
    location?: string; // e.g., "Australia", "Sydney"
    income?: string; // e.g., "$100k-$150k"
    education?: string; // e.g., "Bachelor's degree or higher"
    job_titles?: string[]; // e.g., ["CMO", "Marketing Director", "VP Marketing"]
    company_size?: 'startup' | 'smb' | 'mid_market' | 'enterprise';
    industry?: string[]; // e.g., ["Technology", "SaaS", "E-commerce"]
    [key: string]: any; // Flexible JSONB storage
  };

  pain_points?: string[]; // e.g., ["Manual data entry", "Poor lead quality"]
  goals?: string[]; // e.g., ["Increase MQLs by 30%", "Reduce CAC"]
  preferred_channels?: string[]; // e.g., ["LinkedIn", "Twitter", "Email"]

  // Usage
  is_active: boolean; // Currently using this persona

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== MARKETING STRATEGIES TABLE (Content Strategy Framework) =====
interface MarketingStrategy {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id: string; // UUID - Client this strategy is for

  // Strategy details
  strategy_title: string; // e.g., "Q4 2025 Social Media Strategy"
  objectives?: string[]; // e.g., ["Increase brand awareness", "Generate 100 MQLs"]

  content_pillars: Array<{
    name: string; // e.g., "Thought Leadership"
    description: string; // e.g., "Industry insights and trends"
    percentage: number; // % of content (e.g., 40)
    topics: string[]; // e.g., ["AI in Marketing", "Marketing Automation"]
  }>;

  target_platforms?: string[]; // e.g., ["LinkedIn", "Twitter"]

  posting_frequency: {
    [platform: string]: {
      posts_per_week: number;
      best_days: string[]; // e.g., ["Tuesday", "Thursday"]
      best_times: string[]; // e.g., ["09:00", "15:00"] (24h format)
    };
  };

  // Example:
  // {
  //   "linkedin": { posts_per_week: 5, best_days: ["Tue", "Wed", "Thu"], best_times: ["09:00", "17:00"] },
  //   "twitter": { posts_per_week: 14, best_days: ["Mon", "Tue", "Wed", "Thu", "Fri"], best_times: ["08:00", "12:00", "18:00"] }
  // }

  // Status
  is_active: boolean; // Currently active strategy

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== CONTENT GENERATION REQUEST (Input Type) =====
interface SocialContentRequest {
  workspace_id: string; // REQUIRED
  contact_id: string; // REQUIRED (which client/brand)
  strategy_id?: string; // Optional (which strategy to follow)

  // Content specs
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  post_type: 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'article' | 'thread';
  content_pillar?: string; // Which pillar this supports

  // Topic/theme
  topic?: string; // What to write about
  repurpose_from?: {
    source_type: 'email' | 'blog' | 'video' | 'podcast';
    source_id: string; // UUID of source content
  };

  // Scheduling
  scheduled_date?: string; // ISO timestamp (default: AI suggests optimal time)

  // Additional context
  include_image?: boolean; // Generate DALL-E image prompt
  include_hashtags?: boolean; // Generate relevant hashtags
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
}

// ===== CONTENT GENERATION RESULT (Output Type) =====
interface SocialContentResult {
  success: boolean;
  post: CalendarPost;

  // AI metadata
  ai_model: string;
  generation_reasoning: string; // Why AI chose this content/angle

  // Variations (for A/B testing)
  variations?: Array<{
    variant_id: string;
    copy: string;
    hashtags?: string[];
  }>;

  // Related assets
  image_prompt?: string; // If include_image = true
  image_url?: string; // If image was generated

  // Cost
  generation_cost_usd: number;
}

// ===== CONTENT CALENDAR REQUEST (Input Type) =====
interface ContentCalendarRequest {
  workspace_id: string; // REQUIRED
  contact_id: string; // REQUIRED
  strategy_id: string; // REQUIRED (which strategy to use)

  // Calendar period
  start_date: string; // ISO timestamp
  end_date: string; // ISO timestamp (e.g., 30/60/90 days)

  // Platforms
  platforms: string[]; // e.g., ["linkedin", "twitter"]

  // Generation settings
  posts_per_day?: number; // Default: Based on strategy
  include_images?: boolean; // Generate image prompts for all posts
  include_weekends?: boolean; // Post on Sat/Sun (default: false)
}

// ===== CONTENT CALENDAR RESULT (Output Type) =====
interface ContentCalendarResult {
  success: boolean;
  calendar: {
    start_date: string;
    end_date: string;
    total_posts: number;
    posts_by_platform: {
      [platform: string]: number;
    };
    posts_by_pillar: {
      [pillar: string]: number;
    };
  };
  posts: CalendarPost[]; // All generated posts
  generation_cost_usd: number;
}
```

---

## Core Functions

### 1. Generate Social Media Post

**Function:** `generateSocialPost(request: SocialContentRequest): Promise<SocialContentResult>`

**Purpose:** Generate platform-optimized social media content

**Input:**
```typescript
{
  workspace_id: "uuid",
  contact_id: "uuid",
  platform: "linkedin",
  post_type: "post",
  content_pillar: "Thought Leadership",
  topic: "The future of AI in marketing automation",
  include_image: true,
  include_hashtags: true,
  tone: "professional"
}
```

**Output:**
```typescript
{
  success: true,
  post: {
    id: "uuid",
    platform: "linkedin",
    suggested_copy: "🚀 The AI revolution in marketing automation is here—and it's transforming how we engage with customers.\n\nI've spent the last 6 months testing AI-powered marketing tools, and the results are staggering:\n\n• 70% increase in email open rates with AI-generated subject lines\n• 3x faster content creation without sacrificing quality\n• 40% improvement in lead scoring accuracy\n\nBut here's what most people get wrong: AI isn't replacing marketers. It's amplifying our creativity and strategic thinking.\n\nThe marketers who thrive in 2026 will be the ones who learn to work WITH AI, not against it.\n\nWhat's your experience with AI in marketing? 👇",
    suggested_hashtags: [
      "#AIMarketing",
      "#MarketingAutomation",
      "#DigitalMarketing",
      "#MarTech",
      "#FutureOfWork",
      "#ArtificialIntelligence",
      "#B2BMarketing"
    ],
    content_pillar: "Thought Leadership",
    target_audience: "Marketing professionals, CMOs, Marketing Directors",
    call_to_action: "Comment with your AI marketing experiences",
    status: "draft"
  },
  ai_model: "claude-sonnet-4-5-20250929",
  generation_reasoning: "LinkedIn favors personal stories with data-driven insights. Used first-person narrative + specific metrics + open-ended question to drive engagement. Character count: 487 (well under 3000 limit).",
  image_prompt: "Professional business setting, futuristic AI hologram display showing marketing analytics dashboard, modern office, blue and purple color scheme, high-tech atmosphere",
  generation_cost_usd: 0.02
}
```

**Platform-Specific Optimization:**

```typescript
const platformSpecs = {
  linkedin: {
    max_characters: 3000,
    optimal_length: '400-600 characters',
    max_hashtags: 5,
    best_format: 'Professional stories with data + question',
    tone: 'Professional, insightful, data-driven',
  },
  twitter: {
    max_characters: 280,
    optimal_length: '200-280 characters',
    max_hashtags: 3,
    best_format: 'Quick insights, hot takes, threads for depth',
    tone: 'Concise, punchy, conversational',
  },
  facebook: {
    max_characters: 63206,
    optimal_length: '40-80 characters',
    max_hashtags: 2,
    best_format: 'Short, engaging, visual-first',
    tone: 'Friendly, casual, conversational',
  },
  instagram: {
    max_characters: 2200,
    optimal_length: '138-150 characters (first line)',
    max_hashtags: 30,
    best_format: 'Visual storytelling, emoji-rich, hashtag-optimized',
    tone: 'Casual, inspirational, visual',
  },
  tiktok: {
    max_characters: 2200,
    optimal_length: '50-100 characters',
    max_hashtags: 5,
    best_format: 'Hook + value + CTA, video-first',
    tone: 'Casual, energetic, trend-aware',
  },
};

async function generateSocialPost(
  request: SocialContentRequest
): Promise<SocialContentResult> {
  const specs = platformSpecs[request.platform];

  // Build AI prompt
  const systemPrompt = `You are a social media expert creating content for ${request.platform}.

**Platform Specs:**
- Max characters: ${specs.max_characters}
- Optimal length: ${specs.optimal_length}
- Max hashtags: ${specs.max_hashtags}
- Best format: ${specs.best_format}
- Tone: ${specs.tone}

**Content Pillar:** ${request.content_pillar}
**Topic:** ${request.topic}
**Tone:** ${request.tone}

**Requirements:**
- Hook readers in first line
- Include ${specs.max_hashtags} relevant hashtags
- Add engaging question or CTA at end
- Use line breaks for readability
- Optimize for mobile viewing

**Output:** Return ONLY the post text. No explanations.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a ${request.platform} ${request.post_type} about: ${request.topic}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  const generatedCopy = textBlock?.text || '';

  // Extract hashtags (if included in copy)
  const hashtagMatches = generatedCopy.match(/#\w+/g) || [];
  const suggested_hashtags = request.include_hashtags
    ? hashtagMatches
    : [];

  // Generate image prompt (if requested)
  let image_prompt: string | undefined;
  if (request.include_image) {
    image_prompt = await generateImagePrompt(request.topic, request.platform);
  }

  // Store in database
  const post = await storeCalendarPost({
    workspace_id: request.workspace_id,
    contact_id: request.contact_id,
    strategy_id: request.strategy_id,
    platform: request.platform,
    post_type: request.post_type,
    content_pillar: request.content_pillar,
    suggested_copy: generatedCopy,
    suggested_hashtags,
    suggested_image_prompt: image_prompt,
    status: 'draft',
    scheduled_date: request.scheduled_date || (await suggestOptimalPostTime(request)),
  });

  return {
    success: true,
    post,
    ai_model: 'claude-sonnet-4-5-20250929',
    generation_reasoning: `Optimized for ${request.platform} specs. Character count: ${generatedCopy.length}.`,
    image_prompt,
    generation_cost_usd: 0.02,
  };
}
```

---

### 2. Generate Content Calendar (30/60/90 Days)

**Function:** `generateContentCalendar(request: ContentCalendarRequest): Promise<ContentCalendarResult>`

**Purpose:** Generate complete multi-platform content calendar

**Input:**
```typescript
{
  workspace_id: "uuid",
  contact_id: "uuid",
  strategy_id: "uuid",
  start_date: "2025-12-01T00:00:00Z",
  end_date: "2025-12-31T23:59:59Z", // 31 days
  platforms: ["linkedin", "twitter"],
  include_images: true,
  include_weekends: false
}
```

**Output:**
```typescript
{
  success: true,
  calendar: {
    start_date: "2025-12-01T00:00:00Z",
    end_date: "2025-12-31T23:59:59Z",
    total_posts: 145, // LinkedIn: 5/week × 4 weeks + Twitter: 14/week × 4 weeks
    posts_by_platform: {
      "linkedin": 20,
      "twitter": 60
    },
    posts_by_pillar: {
      "Thought Leadership": 32,
      "Product Updates": 24,
      "Industry News": 24,
      "Company Culture": 16,
      "Customer Success": 8
    }
  },
  posts: [
    {
      id: "uuid1",
      platform: "linkedin",
      scheduled_date: "2025-12-02T09:00:00+10:00", // Tuesday 9 AM AEST
      content_pillar: "Thought Leadership",
      suggested_copy: "🚀 The AI revolution...",
      status: "draft"
    },
    // ... 144 more posts
  ],
  generation_cost_usd: 2.90 // 145 posts × ~$0.02 each
}
```

**Implementation:**
```typescript
async function generateContentCalendar(
  request: ContentCalendarRequest
): Promise<ContentCalendarResult> {
  // 1. Load strategy
  const strategy = await getMarketingStrategy(request.strategy_id);

  // 2. Calculate posting schedule
  const schedule = calculatePostingSchedule({
    start_date: request.start_date,
    end_date: request.end_date,
    platforms: request.platforms,
    strategy: strategy.posting_frequency,
    include_weekends: request.include_weekends,
  });

  // Example schedule:
  // [
  //   { date: "2025-12-02T09:00:00Z", platform: "linkedin", pillar: "Thought Leadership" },
  //   { date: "2025-12-02T12:00:00Z", platform: "twitter", pillar: "Industry News" },
  //   ...
  // ]

  const posts: CalendarPost[] = [];

  // 3. Generate content for each slot (in batches of 10)
  for (let i = 0; i < schedule.length; i += 10) {
    const batch = schedule.slice(i, i + 10);

    const batchResults = await Promise.all(
      batch.map((slot) =>
        generateSocialPost({
          workspace_id: request.workspace_id,
          contact_id: request.contact_id,
          strategy_id: request.strategy_id,
          platform: slot.platform,
          post_type: 'post',
          content_pillar: slot.pillar,
          topic: await generateTopicIdea(slot.pillar),
          scheduled_date: slot.date,
          include_image: request.include_images,
          include_hashtags: true,
        })
      )
    );

    posts.push(...batchResults.map((r) => r.post));
  }

  // 4. Calculate aggregated stats
  const calendar = {
    start_date: request.start_date,
    end_date: request.end_date,
    total_posts: posts.length,
    posts_by_platform: countByField(posts, 'platform'),
    posts_by_pillar: countByField(posts, 'content_pillar'),
  };

  return {
    success: true,
    calendar,
    posts,
    generation_cost_usd: posts.length * 0.02,
  };
}
```

---

### 3. Create Marketing Strategy

**Function:** `createMarketingStrategy(data: StrategyInput): Promise<MarketingStrategy>`

**Purpose:** Define content strategy with pillars, platforms, and frequency

**Input:**
```typescript
{
  workspace_id: "uuid",
  contact_id: "uuid",
  strategy_title: "Q1 2026 Social Media Strategy",
  objectives: [
    "Increase brand awareness by 50%",
    "Generate 200 MQLs from social",
    "Grow LinkedIn following to 10,000"
  ],
  content_pillars: [
    {
      name: "Thought Leadership",
      description: "Industry insights, trends, predictions",
      percentage: 40,
      topics: ["AI in marketing", "Marketing automation", "Data-driven marketing"]
    },
    {
      name: "Product Updates",
      description: "New features, improvements, announcements",
      percentage: 30,
      topics: ["Feature releases", "Product roadmap", "Use cases"]
    },
    {
      name: "Customer Success",
      description: "Case studies, testimonials, results",
      percentage: 20,
      topics: ["Customer wins", "ROI metrics", "Before/after"]
    },
    {
      name: "Company Culture",
      description: "Team, values, behind-the-scenes",
      percentage: 10,
      topics: ["Team spotlights", "Company news", "Community involvement"]
    }
  ],
  target_platforms: ["linkedin", "twitter"],
  posting_frequency: {
    "linkedin": {
      posts_per_week: 5,
      best_days: ["Tuesday", "Wednesday", "Thursday"],
      best_times: ["09:00", "17:00"]
    },
    "twitter": {
      posts_per_week: 14,
      best_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      best_times: ["08:00", "12:00", "18:00"]
    }
  }
}
```

**Output:**
```typescript
{
  id: "uuid",
  workspace_id: "uuid",
  contact_id: "uuid",
  strategy_title: "Q1 2026 Social Media Strategy",
  content_pillars: [...],
  posting_frequency: {...},
  is_active: true,
  created_at: "2025-11-18T10:00:00Z"
}
```

---

### 4. Repurpose Content (Email → Social)

**Function:** `repurposeContent(source_id: string, target_platform: string): Promise<SocialContentResult>`

**Purpose:** Convert existing content (email, blog, video) into social posts

**Input:**
```typescript
{
  source_type: "email",
  source_id: "uuid", // References generated_content.id
  target_platform: "linkedin",
  post_type: "post"
}
```

**Output:**
```typescript
{
  success: true,
  post: {
    id: "uuid",
    platform: "linkedin",
    suggested_copy: "📧 Just wrapped up a discovery call with a potential client...\n\n[Repurposed from email content]",
    status: "draft"
  }
}
```

---

### 5. Analyze Post Performance

**Function:** `analyzePostPerformance(post_id: string): Promise<PerformanceAnalysis>`

**Purpose:** Track engagement metrics and insights

**Input:**
```typescript
{
  post_id: "uuid"
}
```

**Output:**
```typescript
{
  post_id: "uuid",
  platform: "linkedin",
  published_at: "2025-12-02T09:00:00Z",
  metrics: {
    impressions: 5420,
    reach: 3890,
    likes: 287,
    comments: 45,
    shares: 32,
    saves: 18,
    clicks: 156,
    engagement_rate: 9.98 // (287+45+32) / 3890 × 100
  },
  insights: [
    "Engagement rate 2.3x above account average (4.2%)",
    "Peak engagement at 11 AM AEST (2 hours after posting)",
    "Top demographics: 35-44 year olds, Marketing professionals"
  ],
  recommendations: [
    "Similar content performs well - create series",
    "Post more at Tuesday 9 AM for this audience",
    "Add data visualizations to boost shares"
  ]
}
```

---

## API Endpoints

### 1. Generate Social Post

**Endpoint:** `POST /api/social/generate/post`

**Request:**
```json
{
  "workspaceId": "uuid",
  "contactId": "uuid",
  "platform": "linkedin",
  "topic": "AI in marketing",
  "includeImage": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "post": {...},
  "generationCostUsd": 0.02
}
```

---

### 2. Generate Content Calendar

**Endpoint:** `POST /api/social/generate/calendar`

**Request:**
```json
{
  "workspaceId": "uuid",
  "contactId": "uuid",
  "strategyId": "uuid",
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "platforms": ["linkedin", "twitter"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "calendar": {...},
  "totalPosts": 145,
  "generationCostUsd": 2.90
}
```

---

### 3. Get Calendar Posts

**Endpoint:** `GET /api/social/calendar`

**Query:**
```
?workspaceId=uuid
&startDate=2025-12-01
&endDate=2025-12-31
&platform=linkedin
&status=draft
```

**Response (200 OK):**
```json
{
  "success": true,
  "posts": [...],
  "total": 20
}
```

---

## Integration Points

### Inputs
- **Content Agent:** Repurpose email content for social
- **Contact Agent:** Target audience data
- **Analytics Agent:** Performance tracking

### Outputs
- **Dashboard UI:** Social media calendar view
- **Content Agent:** Cross-channel content sync
- **Analytics Agent:** Social engagement data

---

## Business Rules

### 1. Platform-Specific Character Limits

Enforce strict character limits:
- LinkedIn: 3,000 characters
- Twitter: 280 characters
- Facebook: 63,206 characters (but optimal: 40-80)
- Instagram: 2,200 characters (but optimal: first 138)
- TikTok: 2,200 characters (but optimal: 50-100)

### 2. Optimal Posting Times (AEST)

**LinkedIn:**
- Best days: Tuesday, Wednesday, Thursday
- Best times: 9 AM, 12 PM, 5 PM

**Twitter:**
- Best days: Monday-Friday
- Best times: 8 AM, 12 PM, 6 PM

**Instagram:**
- Best days: Wednesday, Friday
- Best times: 11 AM, 1 PM, 7 PM

### 3. Content Mix (80/20 Rule)

- 80% value (educational, inspirational, entertaining)
- 20% promotional (product features, sales)

---

## Performance Requirements

| Operation | Target | Max |
|-----------|--------|-----|
| Generate single post | < 2s | 5s |
| Generate 30-day calendar | < 30s | 60s |
| Repurpose content | < 3s | 8s |

---

## Error Codes

| Code | Error | Status |
|------|-------|--------|
| `SOCIAL_001` | Missing required fields | 400 |
| `SOCIAL_002` | Invalid platform | 400 |
| `SOCIAL_003` | Content too long for platform | 400 |
| `SOCIAL_004` | Strategy not found | 404 |
| `SOCIAL_005` | Rate limit exceeded | 429 |

---

## Future Enhancements

### Phase 2
- Direct API publishing (LinkedIn, Twitter, Facebook)
- Social listening & monitoring
- Competitor content analysis
- Influencer identification

### Phase 3
- AI video script generation (TikTok, Reels, YouTube Shorts)
- Automated A/B testing
- Smart hashtag research
- Trending topic detection

---

**Status:** ✅ Specification Complete
**Implementation:** 2-3 weeks
**Dependencies:** Content Agent (P1), Analytics Agent (P1)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5)
