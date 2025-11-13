# Content Calendar Feature Specification

## Overview

The **Content Calendar** is an AI-powered 30-day (Starter) or 90-day (Professional) content planning system that generates strategic, platform-optimized social media posts with complete copy, hashtags, image prompts, and posting recommendations.

## Features

### AI-Powered Calendar Generation
- **Automated Content Creation**: Claude AI generates complete 30-90 day content calendars
- **Strategic Planning**: Posts aligned with marketing strategy and content pillars
- **Platform Optimization**: Tailored content for Facebook, Instagram, TikTok, LinkedIn, Blog, and Email
- **Intelligent Distribution**: Balanced content mix (40% educational, 30% engagement, 20% promotional, 10% other)
- **Timing Recommendations**: Best posting times based on platform research and audience behavior

### Content Types
1. **Promotional** (20%): Product launches, sales, special offers
2. **Educational** (40%): Tips, how-tos, industry insights, tutorials
3. **Engagement** (30%): Questions, polls, user-generated content prompts
4. **Brand Story** (5%): Company values, mission, behind-the-scenes
5. **User Generated** (5%): Testimonials, reviews, customer features

### Platform-Specific Features

#### Facebook
- Long-form content (40-80 words)
- Community-focused posts
- Link sharing with compelling descriptions
- Best times: Weekdays 9 AM - 2 PM
- Hashtags: 2-3 relevant

#### Instagram
- Visual-first content
- Short, punchy captions (under 150 characters)
- Carousel and Reels suggestions
- Best times: Weekdays 11 AM - 1 PM, 7 PM - 9 PM
- Hashtags: 5-10 (mix of popular and niche)

#### LinkedIn
- Professional thought leadership
- Industry insights (150-300 words)
- Career-focused content
- Best times: Weekdays 8 AM - 10 AM, 12 PM - 2 PM
- Hashtags: 3-5 professional

#### TikTok
- Short-form video hooks
- Entertainment with education
- Trending audio suggestions
- Best times: Weekdays 6 PM - 10 PM, weekends 9 AM - 12 PM
- Hashtags: 3-5 (trending + niche)

#### Blog
- Long-form educational content
- SEO-optimized topics
- Evergreen value content

#### Email
- Newsletter content
- Campaign sequences
- Personalized messaging

## Database Schema

### contentCalendarPosts
```typescript
{
  clientId: Id<"clients">,
  strategyId?: Id<"marketingStrategies">,
  scheduledDate: number, // timestamp
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "blog" | "email",
  postType: "promotional" | "educational" | "engagement" | "brand_story" | "user_generated",
  contentPillar: string, // From marketing strategy
  suggestedCopy: string, // Full post copy with emojis
  suggestedHashtags: string[], // Without # symbol
  suggestedImagePrompt?: string, // DALL-E prompt
  imageConceptId?: Id<"imageConcepts">,
  status: "suggested" | "approved" | "scheduled" | "published",
  engagement?: {
    likes: number,
    comments: number,
    shares: number
  },
  aiReasoning: string, // Why this post works
  bestTimeToPost?: string, // "9:00 AM - 11:00 AM EST"
  targetAudience?: string,
  callToAction?: string,
  createdAt: number,
  updatedAt: number
}
```

## API Endpoints

### POST /api/calendar/generate
Generate AI-powered content calendar

**Request Body:**
```json
{
  "clientId": "string",
  "strategyId": "string (optional)",
  "startDate": "ISO date string",
  "endDate": "ISO date string",
  "platforms": ["facebook", "instagram", "linkedin"]
}
```

**Response:**
```json
{
  "success": true,
  "postsCreated": 30,
  "summary": {
    "totalPosts": 30,
    "platformBreakdown": { "facebook": 10, "instagram": 15, "linkedin": 5 },
    "contentMix": { "promotional": 20, "educational": 40, "engagement": 30, ... }
  },
  "strategicNotes": {
    "weeklyThemes": [...],
    "platformStrategy": {...},
    "seasonalConsiderations": [...],
    "engagementTactics": [...]
  }
}
```

### PUT /api/calendar/[postId]
Update calendar post

**Request Body:**
```json
{
  "suggestedCopy": "string",
  "suggestedHashtags": ["array"],
  "suggestedImagePrompt": "string",
  "callToAction": "string"
}
```

### POST /api/calendar/[postId]/approve
Approve post for scheduling

**Response:**
```json
{
  "success": true,
  "postId": "string"
}
```

### POST /api/calendar/[postId]/regenerate
Regenerate post content with AI

**Response:**
```json
{
  "success": true,
  "regeneratedContent": {
    "suggestedCopy": "string",
    "suggestedHashtags": ["array"],
    "suggestedImagePrompt": "string",
    "callToAction": "string",
    "aiReasoning": "string"
  }
}
```

### DELETE /api/calendar/[postId]
Delete calendar post

## Convex Functions

### Queries
- `getCalendarPosts(clientId, month, year)` - Get all posts for a month
- `getPostsByDateRange(clientId, startDate, endDate)` - Get posts in date range
- `getPostsByPlatform(clientId, platform, limit?)` - Filter by platform
- `getUpcomingPosts(clientId, days)` - Get next N days of posts
- `analyzePerformance(clientId, startDate?, endDate?)` - Performance analytics
- `getCalendarStats(clientId)` - Calendar overview stats
- `getPost(postId)` - Get single post

### Mutations
- `generateCalendar(clientId, strategyId?, startDate, endDate, platforms)` - Prepare calendar generation
- `createPost(...)` - Create individual post
- `batchCreatePosts(posts[])` - Bulk create posts
- `updatePost(postId, updates)` - Update post content
- `updatePostStatus(postId, status)` - Change post status
- `approvePost(postId)` - Approve post
- `regeneratePost(postId)` - Mark for regeneration
- `deletePost(postId)` - Delete post
- `updateEngagement(postId, engagement)` - Update metrics

## React Components

### CalendarView
Monthly grid calendar showing all posts

**Props:**
- `posts`: Array of calendar posts
- `onPostClick`: Handler for clicking a post
- `onApprove`: Handler for approving a post
- `onRegenerate`: Handler for regenerating a post
- `currentMonth`: Current month (1-12)
- `currentYear`: Current year
- `onMonthChange`: Handler for navigating months

### CalendarPost
Individual post card component

**Props:**
- `post`: Post data
- `onApprove?`: Approve handler
- `onRegenerate?`: Regenerate handler
- `onEdit?`: Edit handler

### PostDetailsModal
Expandable modal with full post details and editing

**Props:**
- `post`: Post data
- `isOpen`: Modal visibility
- `onClose`: Close handler
- `onApprove`: Approve handler
- `onRegenerate`: Regenerate handler
- `onUpdate`: Update handler

### PlatformFilter
Platform selection filter

**Props:**
- `selectedPlatforms`: Array of selected platforms
- `onTogglePlatform`: Toggle platform handler

### CalendarStats
Analytics and performance metrics

**Props:**
- `stats`: Statistics object with engagement and distribution data

## Tier Limits

### Starter Tier
- **Calendar Duration**: 30 days
- **Posts Per Generation**: Up to 30 posts
- **Platforms**: All platforms
- **Regeneration**: Unlimited
- **Editing**: Full editing capabilities

### Professional Tier
- **Calendar Duration**: 90 days (3 months)
- **Posts Per Generation**: Up to 90 posts
- **Platforms**: All platforms
- **Regeneration**: Unlimited
- **Editing**: Full editing capabilities
- **Advanced Analytics**: Detailed performance insights
- **Competitor Analysis**: Integration with competitor data

## AI Prompting Strategy

### System Prompt
The AI is instructed to:
1. Follow platform-specific best practices
2. Balance content types strategically
3. Align with marketing strategy and personas
4. Consider seasonal and timely opportunities
5. Include clear reasoning for each post
6. Optimize for engagement and conversions

### User Prompt
Includes:
- Customer persona data
- Marketing strategy
- Business context
- Target platforms
- Content pillars
- Start date and duration
- Tier limits

### AI Response Format
JSON structure with:
- Summary statistics
- Array of posts with all details
- Strategic notes and themes
- Platform-specific strategies
- Weekly themes and focus areas

## User Workflows

### 1. Generate New Calendar
1. Click "Generate Calendar"
2. Select date range (30 or 90 days based on tier)
3. Choose target platforms
4. AI generates complete calendar in 30-60 seconds
5. Review and approve posts

### 2. Review and Approve Posts
1. Browse calendar in grid or list view
2. Click post to see full details
3. Review copy, hashtags, image prompts
4. Approve, edit, or regenerate
5. Mark as scheduled when ready

### 3. Edit Post Content
1. Open post details modal
2. Click "Edit Post"
3. Modify copy, hashtags, image prompt, CTA
4. Save changes
5. AI reasoning preserved

### 4. Regenerate Post
1. Select post to regenerate
2. Click "Regenerate with AI"
3. AI creates fresh version maintaining strategic intent
4. Review and approve new version

### 5. Track Performance
1. Publish posts to platforms
2. Manually update engagement metrics
3. View analytics in stats panel
4. Identify top-performing content
5. Adjust future strategy

## Best Practices

### For Clients
1. **Review Weekly**: Approve posts weekly to stay ahead
2. **Customize Copy**: Edit AI suggestions to match your unique voice
3. **Track Engagement**: Input actual engagement data for insights
4. **Use Image Prompts**: Generate visuals with DALL-E for each post
5. **Test and Learn**: Try different content types and track what works

### For Platform Managers
1. **Maintain Consistency**: Post at recommended times
2. **Engage Authentically**: Respond to comments and messages
3. **Use Analytics**: Track what content performs best
4. **Stay Current**: Update with trending topics and seasonality
5. **Build Community**: Focus on value and relationships, not just promotion

## Integration Points

### Marketing Strategy
- Content pillars feed into post topics
- Platform strategies guide content creation
- Success metrics inform performance tracking

### Personas
- Target audience informs tone and messaging
- Pain points shape educational content
- Goals drive CTAs and conversions

### DALL-E Image Generation
- Image prompts can be sent to DALL-E
- Generated images stored as image concepts
- Linked to calendar posts for easy access

### Social Campaigns
- Calendar posts can align with active campaigns
- Campaign themes influence content mix
- Coordinated cross-platform messaging

## Future Enhancements

1. **Auto-Scheduling**: Direct integration with social media APIs for automated posting
2. **Smart Recycling**: Repurpose high-performing content automatically
3. **Trend Integration**: Real-time trending topic suggestions
4. **A/B Testing**: Built-in post variations for testing
5. **Collaboration**: Team commenting and approval workflows
6. **Analytics Integration**: Auto-import engagement data from platforms
7. **Content Library**: Save and reuse evergreen content
8. **Seasonal Templates**: Pre-built calendars for holidays and events

## Technical Architecture

### AI Generation Flow
1. User initiates calendar generation
2. System fetches persona and strategy data
3. Claude AI prompt constructed with all context
4. AI generates 30-90 posts in structured JSON
5. Posts inserted into database in batch
6. User receives generated calendar

### Performance Optimization
- Batch inserts for speed
- Indexed queries for fast filtering
- Cached AI responses when regenerating
- Lazy loading for calendar views
- Optimistic UI updates

### Error Handling
- Graceful AI failure fallbacks
- Retry logic for API calls
- Clear error messages to users
- Data validation at multiple layers

## Security & Privacy

- Client data isolated by clientId
- API routes protected with authentication
- Sensitive data encrypted in transit
- AI prompts don't expose sensitive business details
- Engagement data stored securely

## Analytics & Metrics

### Tracked Metrics
- Total posts generated
- Posts by platform
- Posts by content type
- Approval rate
- Engagement per post (when provided)
- Average engagement by platform
- Best performing content types
- Posting consistency

### Insights Provided
- Platform distribution recommendations
- Content type effectiveness
- Engagement trends over time
- Optimal posting patterns
- ROI on content strategy

---

**Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: Unite-Hub AI Development Team
