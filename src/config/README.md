# Founder Intelligence OS - Configuration System

## Overview

The configuration system provides centralized, type-safe management of all Founder Intelligence OS modules. All 10 modules use environment variables with sensible defaults.

## Configuration Files

### 1. **founderOS.config.ts** - Core Platform Configuration
Master configuration for the entire Founder Intelligence OS platform.

**Key Settings:**
- `FOUNDER_OS_ENABLED` - Enable/disable entire platform
- `FOUNDER_OS_GOVERNANCE_MODE` - Human Governed | AI Assisted | Autonomous (default: HUMAN_GOVERNED)
- `FOUNDER_OS_MAX_BUSINESSES` - Max businesses per user (default: 50)
- `FOUNDER_OS_SNAPSHOT_RETENTION_DAYS` - Business snapshot retention (default: 90)
- `FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS` - Cross-module signal aggregation (default: 6)
- `FOUNDER_OS_MAX_CONCURRENT_JOBS` - Parallel job limit (default: 20)

**Environment Variables:**
```bash
FOUNDER_OS_ENABLED=true
FOUNDER_OS_DEFAULT_OWNER_ID=user-uuid
FOUNDER_OS_MAX_BUSINESSES=50
FOUNDER_OS_GOVERNANCE_MODE=HUMAN_GOVERNED
FOUNDER_OS_DEFAULT_REGION=AU
FOUNDER_OS_SNAPSHOT_RETENTION_DAYS=90
FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS=6
FOUNDER_OS_CROSS_BUSINESS_INSIGHTS_ENABLED=true
FOUNDER_OS_EMERGENCY_PROTOCOLS_ENABLED=true
FOUNDER_OS_MAX_CONCURRENT_JOBS=20
```

---

### 2. **aiPhill.config.ts** - AI Brain Configuration
Master brain configuration for AI Phill - the Founder Intelligence System.

**Key Settings:**
- `AI_PHILL_ENABLED` - Enable AI Phill (default: true)
- `AI_PHILL_GOVERNANCE_MODE` - Human Governed (default) | AI Assisted | Autonomous
- `AI_PHILL_MODEL` - Claude model to use (default: claude-opus-4-5-20251101)
- `AI_PHILL_MAX_INSIGHTS_PER_DAY` - Daily insight limit (default: 100)
- `AI_PHILL_THINKING_BUDGET_TOKENS` - Extended thinking budget (default: 10,000)
- `AI_PHILL_ALLOWED_INTENTS` - Allowed action types
- `AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD` - Minimum confidence (default: 0.75)

**Environment Variables:**
```bash
AI_PHILL_ENABLED=true
AI_PHILL_GOVERNANCE_MODE=HUMAN_GOVERNED
AI_PHILL_MODEL=claude-opus-4-5-20251101
AI_PHILL_MAX_INSIGHTS_PER_DAY=100
AI_PHILL_MAX_UMBRELLA_SYNOPSIS_FREQUENCY_HOURS=24
AI_PHILL_ALLOWED_INTENTS=read_data,generate_insights,propose_actions,trigger_workflows
AI_PHILL_THINKING_BUDGET_TOKENS=10000
AI_PHILL_REAL_TIME_ANALYSIS_ENABLED=true
AI_PHILL_MAX_CONCURRENT_ANALYSIS=10
AI_PHILL_INSIGHT_CACHE_HOURS=4
AI_PHILL_PREDICTIVE_INSIGHTS_ENABLED=true
AI_PHILL_ANOMALY_DETECTION_ENABLED=true
AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD=0.75
```

---

### 3. **seoLeakEngine.config.ts** - SEO Opportunity Detection
Real-time SEO opportunity detection and analysis engine.

**Key Settings:**
- `SEO_LEAK_ENGINE_ENABLED` - Enable SEO analysis (default: true)
- `SEO_LEAK_REFRESH_INTERVAL_HOURS` - Analysis frequency (default: 24)
- `SEO_LEAK_MAX_DOMAINS_PER_BUSINESS` - Domain tracking limit (default: 10)
- `SEO_LEAK_RECOMMENDATION_INTENSITY` - minimal | standard | aggressive | expert (default: standard)
- `SEO_LEAK_SAFE_MODE` - Validate changes before suggesting (default: true)

**Ranking Factors (must sum to 100):**
- `SEO_LEAK_Q_STAR_WEIGHT` - Query intent match (default: 18)
- `SEO_LEAK_P_STAR_WEIGHT` - Page quality (default: 16)
- `SEO_LEAK_T_STAR_WEIGHT` - Topic quality (default: 14)
- `SEO_LEAK_NAVBOOST_WEIGHT` - Chrome behavioral signals (default: 15)
- `SEO_LEAK_EEAT_WEIGHT` - Google quality signals (default: 14)
- `SEO_LEAK_SANDBOX_WEIGHT` - New domain penalty (default: 8)
- `SEO_LEAK_SPAM_WEIGHT` - Spam detection (default: 10)
- `SEO_LEAK_TOPICALITY_WEIGHT` - Semantic relevance (default: 5)

**Environment Variables:**
```bash
SEO_LEAK_ENGINE_ENABLED=true
SEO_LEAK_REFRESH_INTERVAL_HOURS=24
SEO_LEAK_MAX_DOMAINS_PER_BUSINESS=10
SEO_LEAK_RECOMMENDATION_INTENSITY=standard
SEO_LEAK_SAFE_MODE=true
SEO_LEAK_Q_STAR_WEIGHT=18
SEO_LEAK_P_STAR_WEIGHT=16
# ... (all factor weights)
SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD=5
SEO_LEAK_CACHE_HOURS=12
```

---

### 4. **boostBump.config.ts** - Maps & Local Search
Google Business Profile, Maps, and local search optimization.

**Key Settings:**
- `BOOST_BUMP_ENABLED` - Enable Boost Bump (default: true)
- `BOOST_BUMP_GOVERNANCE_MODE` - Governance level (default: HUMAN_GOVERNED)
- `BOOST_BUMP_MAX_DAILY_BOOSTS` - Daily boost limit (default: 10)
- `BOOST_BUMP_DEFAULT_GEO_TARGET` - CITY | REGION | STATE | COUNTRY | NATIONAL (default: CITY)
- `BOOST_BUMP_CTR_SIMULATION_ENABLED` - CTR testing (default: true)
- `BOOST_BUMP_SAFE_MODE` - Validate before applying (default: true)

**Optimization Areas:**
- GBP Profile Completion (25%)
- Review Generation & Sentiment (20%)
- Local Citations & Consistency (15%)
- Maps Keyword Optimization (15%)
- GBP Post Cadence (15%)
- Photos & Video Content (10%)

**Environment Variables:**
```bash
BOOST_BUMP_ENABLED=true
BOOST_BUMP_GOVERNANCE_MODE=HUMAN_GOVERNED
BOOST_BUMP_MAX_DAILY_BOOSTS=10
BOOST_BUMP_DEFAULT_GEO_TARGET=CITY
BOOST_BUMP_CTR_SIMULATION_ENABLED=true
BOOST_BUMP_VIDEO_RETENTION_ENABLED=true
BOOST_BUMP_MAPS_PERSONA_ENABLED=true
BOOST_BUMP_SAFE_MODE=true
BOOST_BUMP_GBP_OPTIMIZATION_ENABLED=true
BOOST_BUMP_LOCAL_PACK_OPTIMIZATION_ENABLED=true
BOOST_BUMP_MAX_ACTIVE_BOOSTS=5
BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS=30
BOOST_BUMP_MIN_IMPACT_THRESHOLD=15
```

---

### 5. **socialEngagement.config.ts** - Multi-Platform Social
Social media monitoring, engagement, and sentiment analysis.

**Supported Platforms:**
- facebook, instagram, linkedin, twitter, tiktok, youtube, threads, bluesky

**Key Settings:**
- `SOCIAL_ENGAGEMENT_ENABLED` - Enable social monitoring (default: true)
- `AUTO_RESPONSE_ENABLED` - Always false (human governed)
- `SENTIMENT_ANALYSIS_ENABLED` - Analyze message sentiment (default: true)
- `MESSAGE_POLLING_INTERVAL_SECONDS` - Polling frequency (default: 300)
- `MAX_MESSAGES_PER_CYCLE` - Messages per poll (default: 100)
- `MENTION_DETECTION_ENABLED` - Track mentions (default: true)
- `REVIEW_MONITORING_ENABLED` - Monitor reviews (default: true)
- `NEGATIVE_SENTIMENT_ALERT_THRESHOLD` - Alert threshold (default: 0.6)

**Environment Variables:**
```bash
SOCIAL_ENGAGEMENT_ENABLED=true
SOCIAL_FACEBOOK_ENABLED=true
SOCIAL_INSTAGRAM_ENABLED=true
SOCIAL_LINKEDIN_ENABLED=true
SOCIAL_TWITTER_ENABLED=true
SOCIAL_TIKTOK_ENABLED=true
AUTO_RESPONSE_ENABLED=false
SENTIMENT_ANALYSIS_ENABLED=true
MESSAGE_POLLING_INTERVAL_SECONDS=300
MAX_MESSAGES_PER_CYCLE=100
MENTION_DETECTION_ENABLED=true
REVIEW_MONITORING_ENABLED=true
COMPETITOR_TRACKING_ENABLED=true
OPPORTUNITY_DETECTION_ENABLED=true
NEGATIVE_SENTIMENT_ALERT_THRESHOLD=0.6
HASHTAG_TRACKING_ENABLED=true
MAX_TRACKED_HASHTAGS=50
VIRAL_TREND_DETECTION_ENABLED=true
```

---

### 6. **adsAutomation.config.ts** - Multi-Platform Ads
Advertising automation and optimization across platforms.

**Supported Platforms:**
- google_ads, facebook_ads, instagram_ads, linkedin_ads, tiktok_ads, amazon_ads, microsoft_ads, pinterest_ads

**Key Settings:**
- `ADS_AUTOMATION_ENABLED` - Enable ads automation (default: true)
- `AUTO_OPTIMIZATION_ENABLED` - AI suggestions only (default: false)
- `PRIMARY_OPTIMIZATION_STRATEGY` - ROAS | CPA | CTR | Impressions | Conversions (default: ROAS)
- `BUDGET_ALLOCATION_STRATEGY` - equal | performance | seasonal | manual (default: performance)
- `MAX_DAILY_SPEND_ACROSS_PLATFORMS` - Global daily limit (default: $10,000)
- `MIN_ROAS_THRESHOLD` - Minimum ROAS (default: 2.0)
- `MAX_CPA_THRESHOLD` - Maximum CPA (optional)

**Environment Variables:**
```bash
ADS_AUTOMATION_ENABLED=true
AUTO_OPTIMIZATION_ENABLED=false
PRIMARY_OPTIMIZATION_STRATEGY=return_on_ad_spend
BUDGET_ALLOCATION_STRATEGY=performance_based
DYNAMIC_BUDGET_REALLOCATION_ENABLED=true
OPPORTUNITY_DETECTION_ENABLED=true
AB_TESTING_ENABLED=true
BUDGET_ALERT_THRESHOLD_PERCENT=80
MAX_DAILY_SPEND_ACROSS_PLATFORMS=10000
SPEND_PACE_MONITORING_ENABLED=true
COMPETITOR_AD_TRACKING_ENABLED=true
KEYWORD_BID_MANAGEMENT_ENABLED=true
AUDIENCE_TARGETING_ENABLED=true
CREATIVE_ANALYSIS_ENABLED=true
LANDING_PAGE_OPTIMIZATION_ENABLED=true
MIN_ROAS_THRESHOLD=2.0
MAX_CPA_THRESHOLD=50.00
```

---

### 7. **searchSuite.config.ts** - Search Monitoring
Multi-engine search monitoring and keyword tracking.

**Supported Engines:**
- google, bing, brave, duckduckgo

**Key Settings:**
- `SEARCH_SUITE_ENABLED` - Enable search monitoring (default: true)
- `PRIMARY_SEARCH_ENGINE` - Main tracking engine (default: google)
- `KEYWORD_TRACKING_STRATEGY` - daily | weekly | monthly | realtime (default: daily)
- `KEYWORD_TRACKING_INTERVAL_HOURS` - Tracking frequency (default: 24)
- `MAX_KEYWORDS_PER_BUSINESS` - Keyword limit (default: 500)
- `RANK_DROP_ALERT_THRESHOLD` - Drop alert threshold (default: 5 positions)
- `MAX_SERP_PAGES` - Pages to analyze (default: 10)

**SERP Features Tracked:**
- organic, featured_snippet, knowledge_panel, news_box, image_pack, video_block, shopping, local_pack, people_also_ask, related_searches, ads, answer_box

**Environment Variables:**
```bash
SEARCH_SUITE_ENABLED=true
PRIMARY_SEARCH_ENGINE=google
KEYWORD_TRACKING_STRATEGY=daily
KEYWORD_TRACKING_INTERVAL_HOURS=24
MAX_KEYWORDS_PER_BUSINESS=500
VOLATILITY_DETECTION_ENABLED=true
SERP_FEATURES_TO_TRACK=organic,featured_snippet,knowledge_panel,local_pack
POSITION_HISTORY_ENABLED=true
POSITION_HISTORY_RETENTION_DAYS=365
RANK_CHANGE_ALERT_ENABLED=true
RANK_DROP_ALERT_THRESHOLD=5
RANK_RISE_THRESHOLD=3
KEYWORD_SUGGESTIONS_ENABLED=true
COMPETITOR_KEYWORD_TRACKING_ENABLED=true
SEARCH_INTENT_CLASSIFICATION_ENABLED=true
SERP_CACHE_HOURS=12
MOBILE_DESKTOP_COMPARISON_ENABLED=true
LOCAL_NATIONAL_COMPARISON_ENABLED=true
CTR_ESTIMATION_ENABLED=true
BACKLINK_ANALYSIS_ENABLED=true
MAX_SERP_PAGES=10
```

---

### 8. **browserAutomationBoost.config.ts** - Browser Automation
Automated browser testing and pattern learning.

**Supported Browsers:**
- chromium, firefox, webkit, edge

**Key Settings:**
- `BROWSER_AUTOMATION_ENABLED` - Enable automation (default: true)
- `PATTERN_LEARNING_ENABLED` - Learn patterns (default: true)
- `EXECUTION_MODE` - manual | scheduled | event_triggered (default: manual)
- `HEADLESS_MODE_ENABLED` - No UI rendering (default: true)
- `MAX_PARALLEL_INSTANCES` - Concurrent browsers (default: 5)
- `SCREENSHOT_CAPTURE_ENABLED` - Capture screenshots (default: true)
- `VIDEO_RECORDING_ENABLED` - Record runs (default: false)
- `BOT_DETECTION_AVOIDANCE_ENABLED` - Avoid detection (default: true)

**Environment Variables:**
```bash
BROWSER_AUTOMATION_ENABLED=true
PATTERN_LEARNING_ENABLED=true
MAX_PATTERNS_PER_BUSINESS=50
EXECUTION_MODE=manual
SUPPORTED_BROWSERS=chromium,firefox,webkit
HEADLESS_MODE_ENABLED=true
PAGE_LOAD_TIMEOUT_SECONDS=30
MAX_PARALLEL_INSTANCES=5
SCREENSHOT_CAPTURE_ENABLED=true
PERFORMANCE_METRICS_ENABLED=true
JS_ERROR_COLLECTION_ENABLED=true
NETWORK_TRACKING_ENABLED=true
ACCESSIBILITY_SCANNING_ENABLED=true
VIDEO_RECORDING_ENABLED=false
LOG_RETENTION_DAYS=30
BOT_DETECTION_AVOIDANCE_ENABLED=true
PROXY_ROTATION_ENABLED=false
MAX_RETRY_ATTEMPTS=3
ACTION_DELAY_MS=500
COMPETITOR_INTELLIGENCE_ENABLED=true
AUTOMATION_CACHE_HOURS=6
```

---

### 9. **emailIngestion.config.ts** - Email Processing
Email account integration and opportunity detection.

**Supported Providers:**
- gmail, outlook, imap_generic

**Key Settings:**
- `EMAIL_INGESTION_ENABLED` - Enable email sync (default: true)
- `HISTORICAL_INGESTION_ENABLED` - Ingest past emails (default: true)
- `MAX_HISTORICAL_DAYS` - Historical days (default: 365)
- `THREAD_CLUSTERING_ENABLED` - Group threads (default: true)
- `OPPORTUNITY_DETECTION_ENABLED` - Find opportunities (default: true)
- `SENTIMENT_ANALYSIS_ENABLED` - Analyze sentiment (default: true)
- `EMAIL_SYNC_INTERVAL_MINUTES` - Sync frequency (default: 15)
- `OPPORTUNITY_CONFIDENCE_THRESHOLD` - Min confidence (default: 0.65)

**Opportunity Types:**
- inquiry, support_issue, complaint, collaboration_request, referral, feedback, urgent_action_needed, sales_opportunity

**Environment Variables:**
```bash
EMAIL_INGESTION_ENABLED=true
HISTORICAL_INGESTION_ENABLED=true
MAX_HISTORICAL_DAYS=365
THREAD_CLUSTERING_ENABLED=true
THREAD_CLUSTERING_STRATEGY=subject_line
OPPORTUNITY_DETECTION_ENABLED=true
SENTIMENT_ANALYSIS_ENABLED=true
EMAIL_CATEGORIZATION_ENABLED=true
MAX_EMAILS_PER_SYNC=500
EMAIL_SYNC_INTERVAL_MINUTES=15
SPAM_FILTERING_ENABLED=true
ATTACHMENT_EXTRACTION_ENABLED=true
MAX_ATTACHMENT_SIZE_MB=25
OCR_ENABLED=false
SIGNATURE_DETECTION_ENABLED=true
DEDUPLICATION_ENABLED=true
RELATIONSHIP_MAPPING_ENABLED=true
CONVERSATION_FLOW_ANALYSIS_ENABLED=true
EMAIL_CACHE_HOURS=4
EMAIL_RETENTION_DAYS=2555
GDPR_COMPLIANCE_ENABLED=true
PII_DETECTION_ENABLED=true
OPPORTUNITY_CONFIDENCE_THRESHOLD=0.65
```

---

### 10. **connectedApps.config.ts** - OAuth Integrations
OAuth provider management and credential encryption.

**Supported Providers:**
- gmail, outlook, google_calendar, microsoft_calendar, slack, teams, salesforce, hubspot, pipedrive, zapier, make, n8n

**Key Settings:**
- `CONNECTED_APPS_ENABLED` - Enable integrations (default: true)
- `SYNC_INTERVAL_MINUTES` - Sync frequency (default: 15)
- `ENCRYPTION_ENABLED` - Encrypt credentials (default: true)
- `AUTO_SYNC_ENABLED` - Auto sync (default: true)
- `WEBHOOK_SYNC_ENABLED` - Real-time sync (default: true)
- `AUTO_TOKEN_REFRESH_ENABLED` - Auto refresh tokens (default: true)
- `MAX_CONCURRENT_SYNCS` - Parallel syncs (default: 5)

**Environment Variables:**
```bash
CONNECTED_APPS_ENABLED=true
OAUTH_GMAIL_ENABLED=true
OAUTH_GMAIL_CLIENT_ID=your-id.apps.googleusercontent.com
OAUTH_GMAIL_CLIENT_SECRET=your-secret

OAUTH_OUTLOOK_ENABLED=true
OAUTH_OUTLOOK_CLIENT_ID=your-id
OAUTH_OUTLOOK_CLIENT_SECRET=your-secret

# ... (other OAuth providers)

SYNC_INTERVAL_MINUTES=15
ENCRYPTION_ENABLED=true
ENCRYPTION_ALGORITHM=AES-256
AUTO_SYNC_ENABLED=true
WEBHOOK_SYNC_ENABLED=true
MAX_SYNC_RETRIES=3
SYNC_ERROR_NOTIFICATIONS_ENABLED=true
SYNC_LOG_RETENTION_DAYS=30
AUDIT_LOGGING_ENABLED=true
RATE_LIMIT_HANDLING_ENABLED=true
AUTO_TOKEN_REFRESH_ENABLED=true
TOKEN_REFRESH_BUFFER_MINUTES=5
DEDUPLICATION_ENABLED=true
MAX_CONCURRENT_SYNCS=5
CONFLICT_RESOLUTION_ENABLED=true
APPS_CACHE_HOURS=4
USAGE_ANALYTICS_ENABLED=true
HEALTH_MONITORING_ENABLED=true
```

---

## Usage

### Import Configurations
```typescript
import {
  FOUNDER_OS_CONFIG,
  AI_PHILL_CONFIG,
  SEO_LEAK_ENGINE_CONFIG,
  BOOST_BUMP_CONFIG,
  SOCIAL_ENGAGEMENT_CONFIG,
  ADS_AUTOMATION_CONFIG,
  SEARCH_SUITE_CONFIG,
  BROWSER_AUTOMATION_BOOST_CONFIG,
  EMAIL_INGESTION_CONFIG,
  CONNECTED_APPS_CONFIG,
  MASTER_CONFIG,
} from '@/config';

// Use individual config
console.log(FOUNDER_OS_CONFIG.FOUNDER_OS_MAX_BUSINESSES); // 50

// Use master config
console.log(MASTER_CONFIG.aiPhill.AI_PHILL_MODEL);
```

### Validate Configurations
```typescript
import {
  validateAllConfigs,
  logConfigValidationResults,
  getConfigurationSummary,
} from '@/config';

// Validate all configs
const validation = validateAllConfigs();
if (!validation.valid) {
  console.error('Configuration errors:', validation.results);
}

// Log results with formatting
logConfigValidationResults();

// Get summary
const summary = getConfigurationSummary();
console.log('Enabled modules:', summary.modulesEnabled);
```

### Helper Functions
```typescript
// AI Phill
import { isAiPhillIntentAllowed } from '@/config';
if (isAiPhillIntentAllowed('trigger_workflows')) {
  // Safe to trigger workflows
}

// SEO Leak Engine
import { getSeoFactorWeights } from '@/config';
const weights = getSeoFactorWeights();
// { q_star: 18, p_star: 16, ... }

// Boost Bump
import { getBoostBumpOptimizationWeights } from '@/config';
const boostWeights = getBoostBumpOptimizationWeights();

// Social Engagement
import { getEnabledPlatforms, getPlatformConfig } from '@/config';
const platforms = getEnabledPlatforms();
const facebookConfig = getPlatformConfig('facebook');

// Ads Automation
import { getEnabledAdsPlatforms, getAdsPlatformCount } from '@/config';
const adsPlatforms = getEnabledAdsPlatforms();
const { total, enabled } = getAdsPlatformCount();

// Search Suite
import { getEnabledSearchEngines, isSearchEngineEnabled } from '@/config';
const engines = getEnabledSearchEngines();
if (isSearchEngineEnabled('google')) {
  // Track Google rankings
}

// Browser Automation
import { getSupportedBrowsers, getDefaultPatterns } from '@/config';
const browsers = getSupportedBrowsers();
const patterns = getDefaultPatterns();

// Email Ingestion
import { detectOpportunityType, getOpportunityPriority } from '@/config';
const type = detectOpportunityType('Very interested in your product!');
const priority = getOpportunityPriority(type);

// Connected Apps
import { getEnabledOAuthProviders, getOAuthProviderConfig } from '@/config';
const providers = getEnabledOAuthProviders();
const gmailConfig = getOAuthProviderConfig('gmail');
```

---

## Initialization

### At Application Startup
```typescript
// src/app/layout.tsx or main server entry point
import { validateAllConfigs, logConfigValidationResults } from '@/config';

if (process.env.NODE_ENV === 'development') {
  const validation = validateAllConfigs();
  if (!validation.valid) {
    console.error('Configuration validation failed!');
    process.exit(1);
  }
  logConfigValidationResults();
}
```

---

## Environment Variables Reference

All modules support environment variables for configuration. Pattern:
```
MODULE_SETTING_NAME=value
```

Examples:
- `FOUNDER_OS_ENABLED=true`
- `AI_PHILL_MODEL=claude-opus-4-5-20251101`
- `SEO_LEAK_ENGINE_ENABLED=true`
- `SOCIAL_FACEBOOK_ENABLED=true`

---

## Best Practices

1. **Always validate configurations at startup** - Use `validateAllConfigs()`
2. **Use type-safe imports** - Import from `@/config` index
3. **Leverage default values** - No env var = sensible defaults
4. **Never hardcode settings** - Always use config objects
5. **Test configuration changes** - Run validation after env changes
6. **Document custom settings** - Comment why you changed defaults
7. **Use MASTER_CONFIG for demos** - Easy to show all settings

---

## Governance Model

All configurations enforce the **HUMAN_GOVERNED** model by default:

- ✅ **Read operations** - Always allowed (data analysis)
- ✅ **Suggestions** - Always allowed (recommendations only)
- ⚠️ **Actions** - Require human approval
- ❌ **Automation** - Disabled by default (opt-in only)

To enable autonomous features:
```bash
FOUNDER_OS_GOVERNANCE_MODE=AUTONOMOUS
AI_PHILL_GOVERNANCE_MODE=AUTONOMOUS
BOOST_BUMP_GOVERNANCE_MODE=AUTONOMOUS
```

---

## Performance Notes

- Default cache hours (4-12h) balance freshness vs API calls
- Signal aggregation (6h) reduces database load
- Max concurrent jobs (20) prevents resource exhaustion
- SERP cache (12h) for keyword tracking
- Email sync (15m) for real-time opportunities

Adjust based on your infrastructure:
```bash
# High-traffic SaaS
FOUNDER_OS_MAX_CONCURRENT_JOBS=50
MAX_PARALLEL_INSTANCES=20
EMAIL_SYNC_INTERVAL_MINUTES=5

# Budget-conscious startup
FOUNDER_OS_MAX_CONCURRENT_JOBS=5
SEARCH_SUITE_CONFIG.SERP_CACHE_HOURS=24
EMAIL_SYNC_INTERVAL_MINUTES=60
```

---

## Version History

- **v1.0.0** - All 10 modules with complete configuration (Nov 2025)
  - Founder OS, AI Phill, SEO Leak Engine, Boost Bump
  - Social Engagement, Ads Automation, Search Suite
  - Browser Automation, Email Ingestion, Connected Apps
