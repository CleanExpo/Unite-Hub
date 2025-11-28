# SEO Leak & Multi-Channel API Routes

**Created**: 2025-11-28
**Total Routes**: 10 (4 SEO Leak + 6 Multi-Channel)
**Status**: Complete - Ready for integration

---

## Overview

This document describes the newly implemented API routes for the SEO Leak Engine and Multi-Channel Marketing features. All routes implement proper authentication, workspace isolation via `owner_user_id` and `founder_business_id`, and HUMAN_GOVERNED mode for sensitive actions.

---

## SEO Leak Engine Routes

### 1. `/api/seo-leak/audit` - SEO Audits

**Purpose**: Technical SEO audits and leak detection

**POST** - Start new audit job
```typescript
Body: {
  url: string;
  audit_type: 'full' | 'technical' | 'content' | 'backlinks';
  founder_business_id: string;
}

Response: {
  success: true;
  audit_job: AuditJob;
  message: "Audit job started. Results will be available shortly.";
}
```

**GET** - List audit jobs
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  audit_jobs: AuditJob[];
}
```

**Features**:
- Creates audit job in `seo_leak_audit_jobs` table
- Verifies user owns the business
- Status: pending → running → completed/failed
- TODO: Trigger background job to run audit via DataForSEO

---

### 2. `/api/seo-leak/signals` - Leak Signal Profiles

**Purpose**: Analyzes Q*, P*, T*, NavBoost signals for SEO leak detection

**GET** - Get signal profile for URL
```typescript
Query: {
  url: string;
  founder_business_id: string;
}

Response: {
  success: true;
  signal_profile: SignalProfile | null;
  message: string;
}
```

**POST** - Analyze URL for signals
```typescript
Body: {
  url: string;
  founder_business_id: string;
}

Response: {
  success: true;
  signal_profile: {
    q_star_signals: { topic_relevance, semantic_matching, query_intent_alignment };
    p_star_signals: { content_depth, expertise_signals, uniqueness };
    t_star_signals: { eeat_score, author_authority, trust_signals };
    navboost_signals: { estimated_ctr, dwell_time_score, engagement_rate };
    overall_leak_score: number;
    recommendations: string[];
  };
}
```

**Signal Types**:
- **Q\* (Query Understanding)**: Topic relevance, semantic matching, query intent
- **P\* (Page Quality)**: Content depth, expertise signals, uniqueness
- **T\* (Trust)**: E-E-A-T score, author authority, trust signals
- **NavBoost**: CTR estimation, dwell time, engagement rate

**TODO**: Replace mock data with real DataForSEO analysis

---

### 3. `/api/seo-leak/gaps` - Gap Analysis

**Purpose**: Identifies keyword, content, and backlink gaps vs competitors

**POST** - Run gap analysis
```typescript
Body: {
  founder_business_id: string;
  your_domain: string;
  competitor_domains: string[];
  analysis_type: 'keyword' | 'content' | 'backlink' | 'full';
}

Response: {
  success: true;
  gap_analysis: {
    keyword_gaps?: Array<{
      keyword: string;
      competitors_ranking: string[];
      search_volume: number;
      difficulty: number;
      opportunity_score: number;
    }>;
    content_gaps?: Array<{
      topic: string;
      competitors_covering: string[];
      content_type: string;
      avg_word_count: number;
      opportunity_score: number;
    }>;
    backlink_gaps?: Array<{
      referring_domain: string;
      linking_to: string[];
      domain_authority: number;
      opportunity_score: number;
    }>;
    overall_opportunity_score: number;
    recommendations: string[];
  };
}
```

**GET** - List gap analyses
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  gap_analyses: GapAnalysis[];
}
```

**Analysis Types**:
- **keyword**: Keywords competitors rank for that you don't
- **content**: Content topics and formats competitors cover
- **backlink**: Backlink sources competitors have
- **full**: All three analyses combined

**TODO**: Implement DataForSEO integration for real competitor data

---

### 4. `/api/seo-leak/schema` - Schema Markup

**Purpose**: Generates and validates schema.org markup

**POST** - Generate schema markup
```typescript
Body: {
  founder_business_id: string;
  url: string;
  schema_type: 'LocalBusiness' | 'Organization' | 'Article' | 'Product' | 'Service';
  schema_data?: {
    name?: string;
    address?: { street, city, state, zip, country };
    phone?: string;
    hours?: OpeningHoursSpecification[];
    logo?: string;
  };
}

Response: {
  success: true;
  schema: SchemaRecord;
  markup: object; // JSON-LD schema markup
  message: "Schema markup generated successfully";
}
```

**GET** - List generated schemas
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  schemas: SchemaMarkup[];
}
```

**Supported Schema Types**:
- LocalBusiness (with address, phone, hours)
- Organization (with logo, contact points)
- Article (for blog posts)
- Product (for e-commerce)
- Service (for service pages)

**TODO**: Implement schema validation using Google's Structured Data Testing Tool API

---

## Multi-Channel Marketing Routes

### 5. `/api/multi-channel/social/accounts` - Social Inbox Accounts

**Purpose**: Manages connected social media accounts for unified inbox

**GET** - List connected accounts
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  accounts: SocialAccount[];
}
```

**POST** - Connect new account
```typescript
Body: {
  founder_business_id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  account_handle: string;
  access_token: string;
  refresh_token?: string;
  account_metadata?: object;
}

Response: {
  success: true;
  account: SocialAccount;
  message: "Social account connected successfully";
}
```

**DELETE** - Disconnect account
```typescript
Query: {
  account_id: string;
}

Response: {
  success: true;
  message: "Social account disconnected successfully";
}
```

**Supported Platforms**: Facebook, Instagram, Twitter/X, LinkedIn, TikTok

---

### 6. `/api/multi-channel/social/messages` - Social Messages

**Purpose**: Unified inbox for social media messages

**GET** - List messages (unified inbox)
```typescript
Query: {
  founder_business_id: string;
  platform?: string; // Filter by platform
  status?: 'unread' | 'read' | 'replied' | 'archived';
}

Response: {
  success: true;
  messages: Array<{
    id: string;
    platform: string;
    account_handle: string;
    sender: string;
    message_text: string;
    received_at: string;
    status: string;
  }>;
}
```

**POST** - Send message (requires approval)
```typescript
Body: {
  account_id: string;
  message_text: string;
  in_reply_to_id?: string;
}

Response: {
  success: true;
  approval: HumanGovernedApproval;
  message: "Message submitted for approval. It will be sent after review.";
  requires_approval: true;
}
```

**HUMAN_GOVERNED**: All outgoing messages require approval before sending

---

### 7. `/api/multi-channel/ads/accounts` - Ads Accounts

**Purpose**: Manages connected advertising accounts

**GET** - List connected ads accounts
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  accounts: AdsAccount[];
}
```

**POST** - Connect ads account
```typescript
Body: {
  founder_business_id: string;
  platform: 'google_ads' | 'meta_ads' | 'linkedin_ads' | 'tiktok_ads';
  account_id_external: string;
  account_name: string;
  access_token: string;
  refresh_token?: string;
  account_metadata?: object;
}

Response: {
  success: true;
  account: AdsAccount;
  message: "Ads account connected successfully";
}
```

**Supported Platforms**: Google Ads, Meta Ads (Facebook/Instagram), LinkedIn Ads, TikTok Ads

---

### 8. `/api/multi-channel/ads/opportunities` - Ads Opportunities

**Purpose**: AI-detected advertising opportunities

**GET** - List detected opportunities
```typescript
Query: {
  founder_business_id: string;
  status?: 'active' | 'dismissed' | 'acted_on';
}

Response: {
  success: true;
  opportunities: Array<{
    id: string;
    opportunity_type: string;
    platform: string;
    keywords: string[];
    estimated_impact: object;
    ai_suggestion: string;
    opportunity_score: number;
    status: string;
    detected_at: string;
  }>;
}
```

**POST** - Create opportunity from AI suggestion
```typescript
Body: {
  founder_business_id: string;
  opportunity_type: 'keyword_gap' | 'audience_expansion' | 'competitor_threat' | 'seasonal';
  platform: string;
  keywords?: string[];
  estimated_impact?: {
    clicks?: number;
    conversions?: number;
    revenue?: number;
  };
  ai_suggestion?: string;
}

Response: {
  success: true;
  opportunity: AdsOpportunity;
  message: "Ads opportunity created successfully";
}
```

**Opportunity Scoring**: Based on estimated clicks, conversions, and keyword count

---

### 9. `/api/multi-channel/search/keywords` - Keyword Tracking

**Purpose**: Tracks keyword rankings across search engines

**GET** - List tracked keywords with rankings
```typescript
Query: {
  founder_business_id: string;
}

Response: {
  success: true;
  keywords: Array<{
    id: string;
    keyword: string;
    search_engine: string;
    current_ranking: number | null;
    previous_ranking: number | null;
    best_ranking: number | null;
    ranking_history: Array<{ date, ranking }>;
    last_checked_at: string | null;
  }>;
}
```

**POST** - Add keywords to track
```typescript
Body: {
  founder_business_id: string;
  keyword: string;
  search_engine: 'google' | 'bing' | 'brave';
  target_url?: string;
  location?: string; // Default: "US"
}

Response: {
  success: true;
  keyword_tracking: KeywordTracking;
  message: "Keyword added to tracking successfully";
}
```

**DELETE** - Remove keyword
```typescript
Query: {
  keyword_id: string;
}

Response: {
  success: true;
  message: "Keyword removed from tracking successfully";
}
```

**TODO**: Implement automated daily ranking checks via DataForSEO

---

### 10. `/api/multi-channel/boost/jobs` - Boost Jobs (HUMAN_GOVERNED)

**Purpose**: Automated ranking boost jobs that require human approval

**GET** - List boost jobs
```typescript
Query: {
  founder_business_id: string;
  status?: 'pending_approval' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
}

Response: {
  success: true;
  boost_jobs: Array<{
    id: string;
    boost_type: string;
    target_url: string;
    target_keywords: string[];
    boost_config: object;
    status: string;
    created_at: string;
  }>;
}
```

**POST** - Create boost job (pending approval)
```typescript
Body: {
  founder_business_id: string;
  boost_type: 'content_refresh' | 'backlink_campaign' | 'technical_fixes' | 'social_signals';
  target_url: string;
  target_keywords?: string[];
  boost_config?: object;
}

Response: {
  success: true;
  boost_job: BoostJob;
  approval: HumanGovernedApproval;
  message: "Boost job created and pending approval. It will execute after review.";
  requires_approval: true;
}
```

**PUT** - Approve/reject boost job
```typescript
Body: {
  boost_job_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

Response: {
  success: true;
  boost_job: BoostJob;
  message: "Boost job approved/rejected successfully";
}
```

**HUMAN_GOVERNED**: All boost jobs require explicit approval before execution

**Boost Types**:
- **content_refresh**: Update and republish content
- **backlink_campaign**: Outreach for backlinks
- **technical_fixes**: Fix technical SEO issues
- **social_signals**: Generate social engagement

---

## Security Features

All routes implement:

1. **Authentication**: JWT token validation (implicit OAuth)
2. **Authorization**: Ownership verification via `owner_user_id` and `founder_business_id`
3. **Workspace Isolation**: All queries filtered by business ownership
4. **HUMAN_GOVERNED Mode**: Sensitive actions (messages, boost jobs) require approval
5. **Error Handling**: Proper HTTP status codes and error messages
6. **Input Validation**: Required field checks

---

## Database Tables Referenced

**SEO Leak Engine**:
- `seo_leak_audit_jobs`
- `seo_leak_signal_profiles`
- `seo_leak_gap_analyses`
- `seo_leak_schema_markup`

**Multi-Channel Marketing**:
- `social_inbox_accounts`
- `social_inbox_messages`
- `ads_accounts`
- `ads_opportunities`
- `search_keyword_tracking`
- `multi_channel_boost_jobs`
- `human_governed_approvals`

**Shared**:
- `founder_businesses`

---

## Next Steps

1. **Frontend Integration**: Create UI components to consume these APIs
2. **Background Jobs**: Implement job processors for audits, ranking checks, boost execution
3. **DataForSEO Integration**: Replace mock data with real SEO analysis
4. **Webhook Handlers**: Set up social platform webhooks for message receiving
5. **OAuth Flows**: Implement platform OAuth for social/ads account connections
6. **Approval Dashboard**: Build UI for reviewing and approving HUMAN_GOVERNED actions
7. **Testing**: Write integration tests for all endpoints

---

## Cost Optimization

**SEO Intelligence**: Use DataForSEO for on-demand analysis (99% cheaper than Semrush)
**Social APIs**: Direct platform APIs (no middleware costs)
**Ads APIs**: Direct platform APIs (Google Ads API, Meta Marketing API)
**Ranking Checks**: DataForSEO SERP API ($0.01-0.05 per check)

**Estimated Monthly Cost**: $50-150 vs $1,000+ for traditional SEO/marketing stack

---

## Example Usage

```typescript
// Frontend: Start SEO audit
const response = await fetch('/api/seo-leak/audit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    audit_type: 'full',
    founder_business_id: businessId,
  }),
});

const { audit_job } = await response.json();

// Frontend: Connect social account
await fetch('/api/multi-channel/social/accounts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    founder_business_id: businessId,
    platform: 'linkedin',
    account_handle: '@yourcompany',
    access_token: oauthToken,
  }),
});

// Frontend: Send social message (with approval)
const msgResponse = await fetch('/api/multi-channel/social/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: socialAccountId,
    message_text: 'Thank you for reaching out!',
    in_reply_to_id: messageId,
  }),
});

const { approval, requires_approval } = await msgResponse.json();
// User will see: "Message submitted for approval"
```

---

**File Locations**:
- SEO Leak: `src/app/api/seo-leak/*/route.ts`
- Multi-Channel: `src/app/api/multi-channel/*/route.ts`

**Total Lines of Code**: ~2,100 lines across 10 files

---

**Last Updated**: 2025-11-28
