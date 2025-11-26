# CONTENT CALENDAR AGENT SPECIFICATION

**Agent Name**: Content Calendar Agent
**Agent Type**: Tier 4 - Autonomous Execution Agent
**Priority**: P1 - Critical
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `calendar_posts` - Scheduled content calendar (read/write)
- `marketing_strategies` - Content pillars and campaign phases (read-only)
- `generated_content` - AI-generated content to schedule (read-only)
- `contacts` - Contact information (read-only)

### Agent Purpose
Generates 90-day content calendars from marketing strategies, schedules posts across platforms (LinkedIn, Facebook, Instagram), balances content pillars, optimizes posting times for Australian audiences, and manages approval workflows.

---

## 2. CORE FUNCTIONS

### 2.1 generateCalendar()
**Purpose**: Generate complete 90-day content calendar from strategy.

**Input**:
```typescript
interface GenerateCalendarRequest {
  contact_id: string;
  workspace_id: string;
  strategy_id: string;
  start_date?: Date; // Default: today
  duration_days?: number; // Default: 90
}
```

**Output**:
```typescript
interface GenerateCalendarResult {
  success: boolean;
  calendar_id: string;
  posts_created: number;
  calendar: {
    start_date: Date;
    end_date: Date;
    total_posts: number;
    posts_by_platform: Record<string, number>;
    posts_by_pillar: Record<string, number>;
    posts: CalendarPost[];
  };
}

interface CalendarPost {
  id: string;
  scheduled_date: Date;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  post_type: 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'article';
  content_pillar: string;
  suggested_copy: string;
  suggested_hashtags: string[];
  suggested_image_prompt: string;
  ai_reasoning: string;
  best_time_to_post: string;
  target_audience: string;
  call_to_action: string;
  status: 'draft' | 'approved' | 'published';
}
```

**Business Logic**:
1. **Fetch strategy**:
   ```typescript
   const { data: strategy, error } = await supabase
     .from('marketing_strategies')
     .select('*')
     .eq('id', strategy_id)
     .eq('workspace_id', workspace_id)
     .single();

   if (!strategy) throw new Error('Strategy not found');
   ```

2. **Calculate posting frequency**:
   ```typescript
   const totalPosts = calculateTotalPosts(strategy, duration_days);
   const postsPerWeek = Math.ceil(totalPosts / (duration_days / 7));

   // Example: 90 days = ~13 weeks, 90 total posts = ~7 posts/week
   ```

3. **Distribute posts by platform**:
   ```typescript
   const platformDistribution = {
     linkedin: Math.ceil(totalPosts * 0.35), // 35% (B2B focus)
     facebook: Math.ceil(totalPosts * 0.20), // 20%
     instagram: Math.ceil(totalPosts * 0.20), // 20%
     twitter: Math.ceil(totalPosts * 0.15), // 15%
     tiktok: Math.ceil(totalPosts * 0.10), // 10%
   };
   ```

4. **Distribute posts by content pillar**:
   ```typescript
   const pillarDistribution = strategy.content_pillars.map(pillar => ({
     pillar: pillar.name,
     count: Math.ceil(totalPosts * (pillar.percentage_allocation / 100)),
   }));
   ```

5. **Generate schedule via Claude**:
   ```typescript
   const prompt = `Generate a ${duration_days}-day content calendar.

STRATEGY OVERVIEW:
- Campaign: ${strategy.strategy_name}
- Content Pillars: ${strategy.content_pillars.map(p => `${p.name} (${p.percentage_allocation}%)`).join(', ')}
- Target Platforms: ${strategy.target_platforms.join(', ')}

POSTING FREQUENCY:
- Total Posts: ${totalPosts}
- Posts per Week: ${postsPerWeek}
- Platform Distribution: ${JSON.stringify(platformDistribution)}

CALENDAR PHASES:
${strategy.campaign_calendar.phases.map(phase => `
Phase: ${phase.phase_name} (${phase.start_date} - ${phase.end_date})
Objectives: ${phase.objectives.join(', ')}
Content Focus: ${phase.content_focus.join(', ')}
`).join('\n')}

REQUIREMENTS:
1. Distribute posts evenly across ${duration_days} days
2. Respect platform distribution percentages
3. Balance content pillars according to allocation
4. Optimal posting times for Australian audience (AEST):
   - LinkedIn: 9-11am Tuesday-Thursday
   - Facebook: 1-3pm Wednesday-Friday
   - Instagram: 7-9pm Monday-Wednesday
   - Twitter: 8-10am Monday-Friday
   - TikTok: 6-9pm Tuesday-Thursday
5. Mix post types (70% regular posts, 20% video, 10% stories/reels)
6. For each post, provide:
   - Date and time (AEST)
   - Platform
   - Post type
   - Content pillar
   - Suggested copy (50-150 words)
   - Hashtags (3-10, platform-appropriate)
   - Image prompt (DALL-E)
   - AI reasoning (why this topic on this day)
   - Best time to post
   - Target audience
   - Call-to-action

Return as JSON array of posts.`;

   const message = await anthropic.messages.create({
     model: 'claude-opus-4-5-20251101',
     max_tokens: 16384, // Large output for 90 posts
     temperature: 0.6,
     thinking: {
       type: 'enabled',
       budget_tokens: 10000, // Strategic planning
     },
     messages: [{ role: 'user', content: prompt }],
   });

   const posts: CalendarPost[] = JSON.parse(message.content[0].text);
   ```

6. **Validate distribution**:
   ```typescript
   // Validate platform distribution (should match target ±10%)
   const actualPlatformDist = calculateDistribution(posts, 'platform');
   Object.entries(platformDistribution).forEach(([platform, expected]) => {
     const actual = actualPlatformDist[platform] || 0;
     if (Math.abs(actual - expected) > expected * 0.1) {
       throw new Error(`Platform distribution mismatch: ${platform} (expected ${expected}, got ${actual})`);
     }
   });

   // Validate pillar distribution
   const actualPillarDist = calculateDistribution(posts, 'content_pillar');
   pillarDistribution.forEach(({ pillar, count: expected }) => {
     const actual = actualPillarDist[pillar] || 0;
     if (Math.abs(actual - expected) > expected * 0.15) {
       throw new Error(`Pillar distribution mismatch: ${pillar}`);
     }
   });
   ```

7. **Save posts to database**:
   ```typescript
   const { data: insertedPosts, error } = await supabase
     .from('calendar_posts')
     .insert(posts.map(post => ({
       contact_id,
       workspace_id,
       strategy_id,
       scheduled_date: post.scheduled_date,
       platform: post.platform,
       post_type: post.post_type,
       content_pillar: post.content_pillar,
       suggested_copy: post.suggested_copy,
       suggested_hashtags: post.suggested_hashtags,
       suggested_image_prompt: post.suggested_image_prompt,
       ai_reasoning: post.ai_reasoning,
       best_time_to_post: post.best_time_to_post,
       target_audience: post.target_audience,
       call_to_action: post.call_to_action,
       status: 'draft',
     })))
     .select();
   ```

8. **Return calendar summary**:
   ```typescript
   return {
     success: true,
     calendar_id: insertedPosts[0].id,
     posts_created: insertedPosts.length,
     calendar: {
       start_date,
       end_date: addDays(start_date, duration_days),
       total_posts: insertedPosts.length,
       posts_by_platform: calculateDistribution(insertedPosts, 'platform'),
       posts_by_pillar: calculateDistribution(insertedPosts, 'content_pillar'),
       posts: insertedPosts,
     },
   };
   ```

**Performance**: < 60 seconds (Extended Thinking + large output)

---

### 2.2 getCalendar()
**Purpose**: Retrieve calendar with filtering.

**Input**:
```typescript
interface GetCalendarRequest {
  workspace_id: string;
  contact_id?: string;
  strategy_id?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
  platform?: string;
  status?: string;
}
```

**Output**:
```typescript
interface GetCalendarResult {
  success: boolean;
  posts: CalendarPost[];
  summary: {
    total_posts: number;
    drafts: number;
    approved: number;
    published: number;
    upcoming: number;
    overdue: number;
  };
}
```

**Business Logic**:
```typescript
let query = supabase
  .from('calendar_posts')
  .select('*')
  .eq('workspace_id', workspace_id);

if (contact_id) query = query.eq('contact_id', contact_id);
if (strategy_id) query = query.eq('strategy_id', strategy_id);
if (date_range) {
  query = query.gte('scheduled_date', date_range.start).lte('scheduled_date', date_range.end);
}
if (platform) query = query.eq('platform', platform);
if (status) query = query.eq('status', status);

query = query.order('scheduled_date', { ascending: true });

const { data: posts } = await query;

const summary = {
  total_posts: posts.length,
  drafts: posts.filter(p => p.status === 'draft').length,
  approved: posts.filter(p => p.status === 'approved').length,
  published: posts.filter(p => p.status === 'published').length,
  upcoming: posts.filter(p => new Date(p.scheduled_date) > new Date()).length,
  overdue: posts.filter(p => new Date(p.scheduled_date) < new Date() && p.status !== 'published').length,
};
```

**Performance**: < 500ms

---

### 2.3 updatePost()
**Purpose**: Update individual calendar post.

**Input**:
```typescript
interface UpdatePostRequest {
  post_id: string;
  updates: Partial<CalendarPost>;
}
```

**Output**:
```typescript
interface UpdatePostResult {
  success: boolean;
  post: CalendarPost;
}
```

**Business Logic**:
```typescript
const { data: post, error } = await supabase
  .from('calendar_posts')
  .update(updates)
  .eq('id', post_id)
  .select()
  .single();

if (error) throw new Error(`Update failed: ${error.message}`);

return { success: true, post };
```

**Performance**: < 200ms

---

### 2.4 approvePost()
**Purpose**: Approve post for publishing.

**Input**:
```typescript
interface ApprovePostRequest {
  post_id: string;
  approved_by: string; // user_id
}
```

**Output**:
```typescript
interface ApprovePostResult {
  success: boolean;
  post: CalendarPost;
}
```

**Business Logic**:
```typescript
const { data: post, error } = await supabase
  .from('calendar_posts')
  .update({
    status: 'approved',
    approved_at: new Date(),
    approved_by,
  })
  .eq('id', post_id)
  .select()
  .single();

// Trigger publishing workflow if scheduled_date is in past
if (new Date(post.scheduled_date) <= new Date()) {
  await publishPost(post_id);
}
```

**Performance**: < 300ms

---

### 2.5 publishPost()
**Purpose**: Publish approved post to platform.

**Input**:
```typescript
interface PublishPostRequest {
  post_id: string;
}
```

**Output**:
```typescript
interface PublishPostResult {
  success: boolean;
  platform_post_id: string;
  platform_url: string;
}
```

**Business Logic**:
```typescript
const { data: post } = await supabase
  .from('calendar_posts')
  .select('*')
  .eq('id', post_id)
  .single();

if (post.status !== 'approved') {
  throw new Error('Post must be approved before publishing');
}

// Route to platform-specific API
let result;
switch (post.platform) {
  case 'linkedin':
    result = await publishToLinkedIn(post);
    break;
  case 'facebook':
    result = await publishToFacebook(post);
    break;
  case 'instagram':
    result = await publishToInstagram(post);
    break;
  // ... other platforms
}

// Update post status
await supabase
  .from('calendar_posts')
  .update({
    status: 'published',
    published_at: new Date(),
  })
  .eq('id', post_id);

return {
  success: true,
  platform_post_id: result.id,
  platform_url: result.url,
};
```

**Performance**: < 5 seconds (depends on platform API)

---

### 2.6 optimizePostingTimes()
**Purpose**: Analyze performance and suggest optimal posting times.

**Input**:
```typescript
interface OptimizePostingTimesRequest {
  workspace_id: string;
  platform: string;
  lookback_days?: number; // Default: 30
}
```

**Output**:
```typescript
interface OptimizePostingTimesResult {
  success: boolean;
  recommendations: {
    platform: string;
    best_days: string[];
    best_times: string[];
    reasoning: string;
  };
}
```

**Business Logic**:
```typescript
// Fetch published posts with engagement metrics
const { data: publishedPosts } = await supabase
  .from('calendar_posts')
  .select('scheduled_date, platform, engagement_metrics')
  .eq('workspace_id', workspace_id)
  .eq('platform', platform)
  .eq('status', 'published')
  .gte('published_at', new Date(Date.now() - lookback_days * 24 * 60 * 60 * 1000));

// Analyze engagement by day of week and time
const dayPerformance = analyzeDayPerformance(publishedPosts);
const timePerformance = analyzeTimePerformance(publishedPosts);

// Use Claude to interpret and recommend
const prompt = `Analyze posting performance and recommend optimal times.

PLATFORM: ${platform}
DATA PERIOD: Last ${lookback_days} days

PERFORMANCE BY DAY:
${JSON.stringify(dayPerformance, null, 2)}

PERFORMANCE BY TIME:
${JSON.stringify(timePerformance, null, 2)}

Provide:
1. Top 3 best days to post (e.g., ["Tuesday", "Wednesday", "Thursday"])
2. Top 3 best times to post (AEST, e.g., ["9:00 AM", "1:00 PM", "6:00 PM"])
3. Reasoning based on data patterns

Return as JSON.`;

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  temperature: 0.3,
  messages: [{ role: 'user', content: prompt }],
});

const recommendations = JSON.parse(message.content[0].text);
```

**Performance**: < 8 seconds

---

## 3. API ENDPOINTS

### POST /api/calendar/generate
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "start_date": "2025-10-01T00:00:00+10:00",
  "duration_days": 90
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "calendar_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "posts_created": 90,
  "calendar": {
    "start_date": "2025-10-01T00:00:00+10:00",
    "end_date": "2025-12-31T23:59:59+10:00",
    "total_posts": 90,
    "posts_by_platform": {
      "linkedin": 32,
      "facebook": 18,
      "instagram": 18,
      "twitter": 14,
      "tiktok": 8
    },
    "posts_by_pillar": {
      "AI Education": 23,
      "Customer Success Stories": 18,
      "Marketing Best Practices": 23,
      "Product Updates": 14,
      "Industry Insights": 12
    },
    "posts": [
      {
        "id": "post-001",
        "scheduled_date": "2025-10-01T09:00:00+10:00",
        "platform": "linkedin",
        "post_type": "post",
        "content_pillar": "AI Education",
        "suggested_copy": "🤖 What is AI-powered lead scoring?\n\nMarketing teams waste hours manually qualifying leads...",
        "suggested_hashtags": ["#AIMarketing", "#LeadScoring", "#MarketingAutomation", "#B2BMarketing", "#MarketingTips"],
        "suggested_image_prompt": "Infographic showing AI lead scoring process, modern design, professional",
        "ai_reasoning": "Launch Phase 1 with educational content to build trust and establish thought leadership",
        "best_time_to_post": "9:00 AM AEST Tuesday",
        "target_audience": "Marketing managers at B2B SaaS companies",
        "call_to_action": "Download our free AI Lead Scoring Guide",
        "status": "draft"
      }
    ]
  }
}
```

### GET /api/calendar
**Query Params**: `?workspace_id=770e8400&platform=linkedin&status=draft`

**Response**:
```json
{
  "success": true,
  "posts": [...],
  "summary": {
    "total_posts": 90,
    "drafts": 85,
    "approved": 3,
    "published": 2,
    "upcoming": 88,
    "overdue": 0
  }
}
```

### PUT /api/calendar/:post_id
**Request**:
```json
{
  "updates": {
    "suggested_copy": "Updated post copy with new insights...",
    "scheduled_date": "2025-10-02T09:00:00+10:00"
  }
}
```

**Response**:
```json
{
  "success": true,
  "post": { ... }
}
```

### POST /api/calendar/:post_id/approve
**Request**:
```json
{
  "approved_by": "user-id-123"
}
```

**Response**:
```json
{
  "success": true,
  "post": {
    "id": "post-001",
    "status": "approved",
    "approved_at": "2025-09-20T14:30:00+10:00",
    "approved_by": "user-id-123"
  }
}
```

### POST /api/calendar/:post_id/publish
**Response**:
```json
{
  "success": true,
  "platform_post_id": "linkedin-post-xyz",
  "platform_url": "https://linkedin.com/posts/xyz"
}
```

---

## 4. DATABASE SCHEMA

### calendar_posts Table (EXISTING)
```sql
CREATE TABLE calendar_posts (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  workspace_id UUID REFERENCES workspaces(id),
  strategy_id UUID REFERENCES marketing_strategies(id),

  scheduled_date TIMESTAMPTZ NOT NULL,
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'general')),
  post_type TEXT CHECK (post_type IN ('post', 'story', 'reel', 'carousel', 'video', 'article')),

  content_pillar TEXT,
  suggested_copy TEXT NOT NULL,
  suggested_hashtags TEXT[],
  suggested_image_prompt TEXT,

  ai_reasoning TEXT,
  best_time_to_post TEXT,
  target_audience TEXT,
  call_to_action TEXT,

  status TEXT CHECK (status IN ('draft', 'approved', 'published', 'archived')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. BUSINESS RULES

### Calendar Generation Rules
1. **Minimum Posts**: 30 posts minimum (1 per day for monthly calendar)
2. **Maximum Posts**: 300 posts maximum (prevents overwhelming schedule)
3. **Platform Balance**: Each platform >= 10% of total posts
4. **Pillar Balance**: Actual distribution within ±15% of target
5. **Post Type Mix**: 70% regular posts, 20% video/carousel, 10% stories/reels

### Optimal Posting Times (Australian Audience)
- **LinkedIn**: 9-11am Tuesday-Thursday (B2B professionals at work)
- **Facebook**: 1-3pm Wednesday-Friday (lunch breaks, post-work)
- **Instagram**: 7-9pm Monday-Wednesday (evening relaxation)
- **Twitter**: 8-10am Monday-Friday (morning commute)
- **TikTok**: 6-9pm Tuesday-Thursday (evening entertainment)

### Approval Workflow
1. **Draft**: AI-generated, requires review
2. **Approved**: Reviewed by human, ready to publish
3. **Published**: Posted to platform
4. **Archived**: Past post, kept for reference

---

## 6. PERFORMANCE REQUIREMENTS

### Response Times
- **Generate Calendar**: < 60 seconds (90 posts)
- **Get Calendar**: < 500ms
- **Update Post**: < 200ms
- **Approve Post**: < 300ms
- **Publish Post**: < 5 seconds

### Throughput
- **Calendars Generated**: 100 per day
- **Posts Published**: 500 per day

### Quality Metrics
- **Approval Rate**: > 85% posts approved without major edits
- **Publishing Success Rate**: > 95% published posts succeed

---

## 7. TESTING STRATEGY

### Unit Tests
```typescript
describe('Content Calendar Agent', () => {
  describe('generateCalendar()', () => {
    it('should generate 90 posts for 90-day calendar', async () => {
      const result = await generateCalendar({ contact_id, workspace_id, strategy_id, duration_days: 90 });
      expect(result.posts_created).toBe(90);
    });

    it('should respect platform distribution', async () => {
      const result = await generateCalendar({ contact_id, workspace_id, strategy_id });
      const linkedInPosts = result.calendar.posts_by_platform.linkedin;
      const totalPosts = result.calendar.total_posts;
      expect(linkedInPosts / totalPosts).toBeCloseTo(0.35, 1); // 35% ±10%
    });
  });
});
```

---

## 8. ERROR CODES

| Code | Description |
|------|-------------|
| CAL_001 | Strategy not found |
| CAL_002 | Calendar generation failed |
| CAL_003 | Distribution validation failed |
| CAL_004 | Post not found |
| CAL_005 | Approval required before publishing |
| CAL_006 | Platform API error |

---

## 9. AUSTRALIAN COMPLIANCE

### Timezones
- **All Dates**: AEST/AEDT (Australia/Sydney)
- **Optimal Times**: Business hours 9am-5pm AEST

### Best Practices
- **Avoid Holidays**: Australian public holidays (Christmas, Australia Day, ANZAC Day)
- **Cultural Sensitivity**: Avoid scheduling posts on national days of mourning

---

## 10. FUTURE ENHANCEMENTS

### Phase 2
1. **Auto-Publishing**: Automatically publish approved posts at scheduled time
2. **Engagement Tracking**: Track likes, comments, shares for each published post
3. **A/B Testing**: Test different copy/images for same post
4. **Content Recycling**: Re-use high-performing posts after 6 months

### Phase 3
1. **AI Performance Analysis**: Use AI to analyze which content performs best
2. **Dynamic Rescheduling**: Auto-adjust posting times based on performance
3. **Multi-Account Support**: Manage calendars for multiple client accounts
4. **Collaboration Features**: Team comments, task assignments on posts

---

**END OF CONTENT CALENDAR AGENT SPECIFICATION**
