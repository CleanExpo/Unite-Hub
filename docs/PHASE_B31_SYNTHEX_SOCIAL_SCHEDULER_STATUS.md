# Phase B31: Omni-Channel Social Posting & Scheduling Engine

**Status**: Complete
**Date**: 2025-12-07
**Phase**: B31 of Synthex Portal

## Overview

Phase B31 implements a comprehensive social media scheduling and automation system supporting 10 platforms: Facebook, Instagram, LinkedIn, X/Twitter, YouTube, TikTok, Threads, Pinterest, Snapchat, and Reddit. It includes AI-powered content optimization and cross-platform publishing.

## Components Implemented

### 1. Database Migration (437_synthex_social_scheduler.sql)

**Tables Created**:
- `synthex_social_accounts` - Connected social media accounts with OAuth tokens
- `synthex_social_posts` - Scheduled and published posts
- `synthex_social_post_analytics` - Post performance metrics
- `synthex_social_errors` - Error logging for failed posts
- `synthex_social_templates` - Reusable post templates
- `synthex_social_calendar` - Calendar view events

**Supported Platforms** (10 total):
- Facebook, Instagram, LinkedIn, Twitter (X)
- YouTube, TikTok, Threads
- Pinterest, Snapchat, Reddit

**Post Statuses**:
- draft, scheduled, publishing, published, failed

**Key Features**:
- `get_due_social_posts()` helper function for scheduler
- OAuth token storage with expiration tracking
- Full RLS policies for multi-tenant isolation
- Cascade deletes for referential integrity

### 2. Service Layer (socialService.ts)

**Platform Specifications**:
```typescript
PLATFORM_SPECS = {
  facebook: { max_length: 63206, max_media: 10 },
  instagram: { max_length: 2200, max_media: 10, max_hashtags: 30 },
  linkedin: { max_length: 3000, max_media: 9 },
  twitter: { max_length: 280, max_media: 4 },
  youtube: { max_length: 5000 },
  tiktok: { max_length: 2200, max_media: 1 },
  threads: { max_length: 500, max_media: 10 },
  pinterest: { max_length: 500, max_media: 5 },
  snapchat: { max_length: 250, max_media: 1 },
  reddit: { max_length: 40000, max_media: 20 }
}
```

**Core Functions**:
- `connectAccount(tenantId, provider, tokens)` - Connect social account
- `disconnectAccount(tenantId, accountId)` - Remove connected account
- `getAccounts(tenantId)` - List connected accounts
- `schedulePost(tenantId, data)` - Schedule new post
- `publishPost(postId)` - Publish immediately
- `processDuePosts()` - Process scheduled posts (for cron)

**AI-Powered Functions**:
- `rewriteForPlatform(content, platform)` - Adapt content per platform
- `optimizeHashtags(content, platform, limit)` - AI hashtag suggestions
- `getSocialSummary(tenantId)` - Analytics summary

**Helper Functions**:
- `getOptimalPostTimes(platform)` - Best posting times
- `validatePostContent(content, platform)` - Platform validation

### 3. API Routes

**GET/POST/DELETE /api/synthex/social/accounts**
- List, connect, disconnect social accounts
- Validates provider against 10 supported platforms

**GET/POST/PATCH /api/synthex/social/posts**
- GET: List posts with status filter
- POST: Create/schedule new post
- PATCH: Update post content or status

**GET/POST /api/synthex/social/run**
- GET: Status of social scheduler
- POST: Manually trigger post processing

### 4. UI Page (/synthex/social)

**Tabs**:
- **Compose**: Create new posts with platform selection
- **Scheduled**: View and manage scheduled posts
- **Accounts**: Manage connected social accounts

**Features**:
- Multi-platform post composer
- Scheduled time picker
- Platform-specific badges
- Account connection management
- Dark theme consistent with Synthex portal

## Usage Examples

### Connect Account
```typescript
const account = await connectAccount('tenant-123', 'instagram', {
  account_id: 'ig-123456',
  account_name: 'My Business',
  account_handle: '@mybusiness',
  access_token: 'oauth-token',
  refresh_token: 'refresh-token',
  expires_at: '2024-12-31T23:59:59Z'
});
```

### Schedule Post
```typescript
const post = await schedulePost('tenant-123', {
  account_id: 'account-123',
  content: 'Check out our latest blog post! #marketing #seo',
  scheduled_at: '2024-12-15T10:00:00Z',
  media_urls: ['https://example.com/image.jpg']
});
```

### AI Content Optimization
```typescript
// Rewrite for platform
const optimized = await rewriteForPlatform(
  'Long form content here...',
  'twitter'
);

// Optimize hashtags
const hashtags = await optimizeHashtags(
  'Post about local SEO',
  'instagram',
  15
);
```

### Process Scheduled Posts
```typescript
// Called by cron job
const processed = await processDuePosts();
console.log(`Processed ${processed} posts`);
```

## Optimal Posting Times

| Platform | Best Times |
|----------|------------|
| Facebook | 9:00, 13:00, 16:00 |
| Instagram | 11:00, 13:00, 19:00 |
| LinkedIn | 7:30, 12:00, 17:00 |
| Twitter | 8:00, 12:00, 17:00 |
| YouTube | 12:00, 15:00, 18:00 |
| TikTok | 7:00, 10:00, 19:00 |
| Threads | 10:00, 13:00, 20:00 |
| Pinterest | 14:00, 20:00, 21:00 |
| Snapchat | 10:00, 13:00, 20:00 |
| Reddit | 6:00, 8:00, 12:00, 17:00 |

## OAuth Integration Notes

Each platform requires specific OAuth setup:
- Facebook/Instagram: Meta Business Suite API
- LinkedIn: LinkedIn Marketing API
- Twitter: Twitter API v2
- YouTube: YouTube Data API v3
- TikTok: TikTok for Business API
- Threads: Meta Threads API
- Pinterest: Pinterest API v5
- Snapchat: Snapchat Marketing API
- Reddit: Reddit API (OAuth2)

## Dependencies

- Anthropic Claude API (for AI optimization)
- Supabase client libraries
- Platform-specific OAuth libraries

## Migration Notes

Run migration 437 in Supabase SQL Editor:
```sql
\i supabase/migrations/437_synthex_social_scheduler.sql
```

## Related Phases

- B11: Content Generation (content source)
- B12: Campaign Scheduling (scheduling patterns)
- B25: Brand Intelligence (brand voice)
- B29: Knowledge Graph (content linking)
