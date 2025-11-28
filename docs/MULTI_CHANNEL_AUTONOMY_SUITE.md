# Multi-Channel Autonomy Suite

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-11-28

## Overview

The Multi-Channel Autonomy Suite extends Unite-Hub with four powerful modules for comprehensive marketing automation:

1. **Social Inbox + Comment Autopilot** - Unified social media inbox with AI triage
2. **Ads Automation Engine** - Cross-platform ad management with optimization suggestions
3. **Search Engine Master Suite** - GSC, Bing, and keyword tracking with volatility alerts
4. **Browser Automation Power Boost** - State persistence, DOM caching, and pattern learning

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-Channel Autonomy Suite                      │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Social Inbox   │  Ads Engine     │  Search Suite   │ Browser Auto  │
├─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ - FB/IG/YT/TT   │ - Google Ads    │ - GSC Client    │ - Session     │
│ - LinkedIn/X    │ - Meta Ads      │ - Bing Client   │   State Store │
│ - Reddit        │ - TikTok Ads    │ - SERP Capture  │ - DOM Cache   │
│ - AI Triage     │ - Optimization  │ - Keyword Track │ - Replay      │
│ - Reply Suggest │ - Suggestions   │ - Volatility    │ - Pattern     │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │      Orchestrator Router       │
              │   (5 new intent handlers)      │
              └───────────────────────────────┘
```

## Module 1: Social Inbox + Comment Autopilot

### Supported Platforms
- Facebook (Pages & Groups)
- Instagram (Business & Creator)
- YouTube (Comments)
- TikTok (Comments)
- LinkedIn (Company Pages)
- Reddit (Subreddits)
- X/Twitter

### Features
- **Unified Inbox**: All messages in one place
- **AI Triage**: Automatic priority, sentiment, intent detection
- **Reply Suggestions**: AI-generated responses with tone control
- **Auto-Reply**: Configurable autopilot for common queries

### API Endpoints
```
GET  /api/social-inbox/accounts    - List connected accounts
POST /api/social-inbox/accounts    - Connect/disconnect/refresh accounts

GET  /api/social-inbox/messages    - Fetch messages (paginated)
POST /api/social-inbox/messages    - Mark read, archive, star messages

POST /api/social-inbox/triage      - AI triage analysis
POST /api/social-inbox/reply       - Generate/send/queue replies
```

### Configuration
```typescript
// config/socialEngagement.ts
export const socialEngagementConfig = {
  providers: {
    facebook: { appId: process.env.FACEBOOK_APP_ID },
    instagram: { enabled: true },
    youtube: { enabled: true },
    // ...
  },
  triage: {
    sentimentThreshold: 0.3,
    priorityKeywords: ['urgent', 'help', 'complaint'],
    autoReplyEnabled: false,
  },
};
```

### Database Tables
- `social_accounts` - Connected platform accounts
- `social_messages` - Ingested messages/comments
- `social_replies` - Sent/queued replies
- `social_triage_results` - AI analysis results

---

## Module 2: Ads Automation Engine

### Supported Platforms
- Google Ads
- Meta Ads (Facebook/Instagram)
- TikTok Ads

### Features
- **Account Connection**: OAuth integration per platform
- **Campaign Sync**: Import campaigns, ad sets, ads
- **Performance Metrics**: CTR, CPC, ROAS, conversions
- **Opportunity Detection**: AI-powered optimization suggestions
- **Suggestions Only**: No auto-apply (user approval required)

### API Endpoints
```
GET  /api/ads/accounts             - List connected ad accounts
POST /api/ads/accounts             - Connect/disconnect accounts

GET  /api/ads/campaigns            - Fetch campaigns with metrics
POST /api/ads/campaigns            - Sync campaigns

GET  /api/ads/opportunities        - List detected opportunities
POST /api/ads/opportunities        - Analyze campaigns, approve/dismiss
```

### Opportunity Types
- **Budget**: Under/over spending detection
- **Bid**: CPC optimization suggestions
- **Targeting**: Audience overlap, expansion opportunities
- **Creative**: Fatigue detection, A/B test suggestions
- **Audience**: New segment recommendations

### Configuration
```typescript
// config/adsAutomation.ts
export const adsAutomationConfig = {
  platforms: {
    google_ads: { developerToken: process.env.GOOGLE_ADS_DEV_TOKEN },
    meta_ads: { appId: process.env.META_APP_ID },
    tiktok_ads: { appId: process.env.TIKTOK_APP_ID },
  },
  optimization: {
    roasThreshold: 1.5,
    ctrAlertThreshold: 0.01,
    budgetVariancePercent: 20,
  },
};
```

---

## Module 3: Search Engine Master Suite

### Data Sources
- Google Search Console API
- Bing Webmaster Tools API
- SERP Screenshot Service

### Features
- **Keyword Tracking**: Monitor rankings across Google/Bing
- **Ranking History**: Track position changes over time
- **Volatility Alerts**: Detect SERP instability
- **Top Movers**: Identify improving/declining keywords
- **SERP Snapshots**: Visual capture of search results

### API Endpoints
```
GET  /api/search-suite/keywords    - List tracked keywords
POST /api/search-suite/keywords    - Add/update/delete/import/export

GET  /api/search-suite/alerts      - List volatility alerts
POST /api/search-suite/alerts      - Check volatility, acknowledge alerts
```

### Alert Types
- `ranking_drop` - Position decreased significantly
- `ranking_gain` - Position improved significantly
- `volatility` - SERP instability detected
- `deindex` - Page dropped from index

### Configuration
```typescript
// config/searchSuite.ts
export const searchSuiteConfig = {
  gsc: {
    clientId: process.env.GSC_CLIENT_ID,
    clientSecret: process.env.GSC_CLIENT_SECRET,
  },
  bing: {
    apiKey: process.env.BING_WEBMASTER_API_KEY,
  },
  volatility: {
    significantChangeThreshold: 5,
    volatilityWindowDays: 7,
    alertSeverityThresholds: { critical: 10, warning: 5 },
  },
};
```

---

## Module 4: Browser Automation Power Boost

### Features
- **Session State Store**: Persist cookies, localStorage, auth state
- **DOM Cache**: Cache page structures for faster element location
- **Replay Tasks**: Record and replay browser workflows
- **Pattern Learning**: AI learns element patterns for smart selection

### API Endpoints
```
GET  /api/browser-automation/replay    - List tasks, runs, history
POST /api/browser-automation/replay    - Create/run/cancel/export tasks

GET  /api/browser-automation/patterns  - List learned patterns
POST /api/browser-automation/patterns  - Learn/update/delete patterns
```

### Pattern Categories
- `login` - Authentication flows
- `form_fill` - Form completion patterns
- `data_extraction` - Scraping patterns
- `navigation` - Multi-page workflows
- `custom` - User-defined patterns

### Configuration
```typescript
// config/browserAutomationBoost.ts
export const browserAutomationBoostConfig = {
  stateStore: {
    encryptionKey: process.env.BROWSER_STATE_ENCRYPTION_KEY,
    ttlDays: 30,
  },
  domCache: {
    maxEntries: 1000,
    ttlHours: 24,
  },
  patternLearner: {
    minConfidence: 0.7,
    minUsageForActive: 3,
  },
};
```

---

## Orchestrator Integration

Five new intents added to `orchestrator-router.ts`:

### Intent: `manage_social_inbox`
**Triggers**: "social inbox", "DM respond", "comment manage"
**Steps**:
1. Fetch connected accounts
2. Fetch messages (filtered by platform)
3. Triage messages (AI analysis)
4. Suggest replies

### Intent: `optimize_ads`
**Triggers**: "ads optimize", "google ads", "meta ads", "ROAS"
**Steps**:
1. Fetch ad accounts
2. Analyze campaigns
3. Detect opportunities
4. Generate recommendations

### Intent: `run_search_audit`
**Triggers**: "search console", "GSC", "keyword tracking"
**Steps**:
1. Fetch GSC data
2. Fetch Bing data
3. Check keyword rankings
4. Analyze volatility
5. Generate report

### Intent: `replay_browser_task`
**Triggers**: "replay task", "browser automation", "RPA"
**Steps**:
1. Fetch task
2. Restore session
3. Execute replay
4. Record result

### Intent: `learn_browser_pattern`
**Triggers**: "learn pattern", "browser pattern", "smart selector"
**Steps**:
1. Fetch session
2. Analyze actions
3. Extract patterns
4. Save pattern

---

## Database Migrations

### Migration 270: Social Inbox Tables
```sql
CREATE TABLE social_accounts (...)
CREATE TABLE social_messages (...)
CREATE TABLE social_replies (...)
CREATE TABLE social_triage_results (...)
```

### Migration 271: Ads Tables
```sql
CREATE TABLE ad_accounts (...)
CREATE TABLE ad_campaigns (...)
CREATE TABLE ad_metrics_snapshots (...)
CREATE TABLE ad_opportunities (...)
```

### Migration 272: Search Suite Tables
```sql
CREATE TABLE tracked_keywords (...)
CREATE TABLE keyword_rankings (...)
CREATE TABLE serp_snapshots (...)
CREATE TABLE volatility_alerts (...)
```

### Migration 273: Browser Automation Tables
```sql
CREATE TABLE browser_sessions (...)
CREATE TABLE browser_dom_cache (...)
CREATE TABLE browser_replay_tasks (...)
CREATE TABLE browser_replay_runs (...)
CREATE TABLE browser_patterns (...)
```

---

## Frontend Pages

### Social Inbox
**Route**: `/staff/social-inbox`
- Unified message list with platform filtering
- AI triage badges (priority, sentiment)
- Reply composition with AI suggestions
- Stats: connected accounts, unread, high priority

### Ads Dashboard
**Route**: `/staff/ads`
- Account selector (Google/Meta/TikTok)
- Campaign performance table
- Opportunity cards with impact assessment
- ROAS, spend, revenue metrics

### Search Suite
**Route**: `/staff/search-suite`
- Keyword tracking table
- Ranking change indicators
- Volatility alerts panel
- Top gainers/losers view

### Browser Automation
**Route**: `/staff/browser-automation`
- Replay task manager
- Run history timeline
- Learned patterns grid
- Task execution controls

---

## Environment Variables

```env
# Social Platforms
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_CLIENT_ID=
YOUTUBE_API_KEY=
TIKTOK_CLIENT_KEY=
LINKEDIN_CLIENT_ID=
REDDIT_CLIENT_ID=
TWITTER_API_KEY=

# Ad Platforms
GOOGLE_ADS_DEV_TOKEN=
GOOGLE_ADS_CLIENT_ID=
META_ADS_APP_ID=
META_ADS_APP_SECRET=
TIKTOK_ADS_APP_ID=

# Search Console
GSC_CLIENT_ID=
GSC_CLIENT_SECRET=
BING_WEBMASTER_API_KEY=

# Browser Automation
BROWSER_STATE_ENCRYPTION_KEY=
```

---

## Security Considerations

1. **Token Encryption**: All OAuth tokens encrypted with AES-256-GCM
2. **RLS Policies**: All tables have workspace-level isolation
3. **Rate Limiting**: API endpoints respect platform rate limits
4. **Audit Logging**: All actions logged for compliance
5. **Suggestions Only**: Ads engine never auto-applies changes

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Message sync latency | <5s | TBD |
| Triage response time | <2s | TBD |
| Ad data sync | <30s | TBD |
| Keyword check | <10s | TBD |
| Pattern match | <100ms | TBD |

---

## Testing

```bash
# Run all suite tests
npm run test:social-inbox
npm run test:ads
npm run test:search-suite
npm run test:browser-automation

# Integration tests
npm run test:integration:autonomy-suite
```

---

## Changelog

### v1.0.0 (2025-11-28)
- Initial release
- 4 config files
- 4 database migrations
- 4 library modules (24 files)
- 11 API routes
- 4 frontend pages
- 5 orchestrator intents
- Full documentation
