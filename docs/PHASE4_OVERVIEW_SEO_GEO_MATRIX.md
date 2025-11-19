# Phase 4: SEO/GEO Intelligence Engine & Singularity Matrix v11.0

**Status**: 🟢 Step 1 Complete (Foundation)
**Created**: 2025-11-19
**Last Updated**: 2025-11-19

---

## Overview

Phase 4 adds a comprehensive **SEO/GEO Intelligence Engine** to Unite-Hub, positioning it as an internal AHREFS/SEMRUSH alternative for both Phill's businesses and client businesses. This module integrates seamlessly with existing Unite-Hub infrastructure (Docker tenants, multi-organization architecture, financial reporting, AI cost tracking) and lays the foundation for **The Singularity Matrix v11.0** - an advanced SEO scoring and optimization system.

---

## Strategic Positioning

### For Phill's Businesses
- Track SEO performance across all portfolio companies
- Monitor Google/Bing/Brave rankings in real-time
- Automated competitor analysis
- GMB (Google My Business) integration
- Cost: **$65-165/mo** vs $1,066-6,986/mo (traditional stack) = **94-98% savings**

### For Client Businesses
- White-label SEO intelligence platform
- Package-tier based feature access (Good/Better/Best)
- Secure credential management (isolated per organization)
- Integration with existing project/time tracking

---

## The Singularity Matrix v11.0

A proprietary SEO scoring algorithm that combines multiple signals into a composite "Matrix Score" (0-100). The Matrix v11.0 architecture includes:

### Core Modules

1. **Neuro_Engagement_Core**
   - User behavior signals (time on page, bounce rate, scroll depth)
   - Click-through rate optimization
   - Engagement velocity tracking

2. **Gamified_Signal_Engine**
   - Competitive ranking signals
   - SERP position tracking
   - Opportunity gap identification

3. **Golden_Key_Protocol**
   - High-value keyword identification
   - Intent classification (informational/commercial/transactional)
   - Search volume vs competition analysis

4. **Information_Gain_Engine**
   - Content freshness signals
   - Topical authority scoring
   - E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) metrics

5. **IndexNow_Velocity_Loop**
   - Instant indexing via IndexNow API
   - Bing/Yandex integration
   - Indexation speed tracking

6. **Brave_Goggle_Fabricator**
   - Custom search lens creation for Brave Search
   - Niche SERP optimization
   - Privacy-first SEO strategies

7. **Nano_Banana_Protocol** (Advanced - Best tier only)
   - Micro-content optimization
   - Featured snippet targeting
   - Voice search optimization

### Matrix Score Calculation

```
Matrix Score = Σ(module_score × module_weight)

Where:
- Neuro_Engagement_Core: 20%
- Gamified_Signal_Engine: 20%
- Golden_Key_Protocol: 15%
- Information_Gain_Engine: 15%
- IndexNow_Velocity_Loop: 10%
- Brave_Goggle_Fabricator: 10%
- Nano_Banana_Protocol: 10%
```

---

## Package Tiers

### Good (Basic) - $45-65/mo
- ✅ Singularity Matrix v11.0 scoring
- ✅ Google Search Console integration
- ✅ Basic keyword tracking (up to 50 keywords)
- ✅ Competitor analysis (up to 3 competitors)
- ❌ Social media integration
- ❌ IndexNow Velocity Loop
- ❌ Brave Goggles
- ❌ Nano Banana Protocol

### Better (Advanced) - $95-125/mo
- ✅ Everything in Good
- ✅ **Social media integration** (Facebook, Instagram, LinkedIn, TikTok)
- ✅ **IndexNow Velocity Loop** (instant indexing)
- ✅ Keyword tracking (up to 200 keywords)
- ✅ Competitor analysis (up to 10 competitors)
- ✅ GMB integration
- ❌ Brave Goggles
- ❌ Nano Banana Protocol

### Best (Premium) - $195-265/mo
- ✅ Everything in Better
- ✅ **Brave Goggle Fabricator**
- ✅ **Nano Banana Protocol** (micro-content optimization)
- ✅ **Golden Key Protocol** (premium insights)
- ✅ Unlimited keywords
- ✅ Unlimited competitors
- ✅ Bing Webmaster integration
- ✅ Brave Search Console integration
- ✅ Priority support

---

## Architecture Integration

### Multi-Tenant Isolation

The SEO/GEO module respects Unite-Hub's multi-tenant architecture:

```
organizations
    └── workspaces
            └── seo_profiles (one per domain)
                    ├── seo_credentials (OAuth tokens, API keys)
                    ├── seo_keywords (tracked keywords)
                    ├── seo_competitors (competitor domains)
                    ├── seo_snapshots (historical data)
                    └── seo_packages (entitlements)
```

**RLS Policies**: All queries are scoped to `organization_id` via `user_organizations` join, ensuring perfect isolation.

### Docker Tenant Infrastructure

Each tenant can optionally have their own containerized environment:
- Isolated database schema
- Dedicated cron jobs for snapshot collection
- Independent credential storage
- Custom Matrix v11.0 configuration

See [`docker/tenant/README.md`](../docker/tenant/README.md) for tenant provisioning.

### Financial Reporting Integration

SEO/GEO costs (API calls, storage) are tracked via existing `operational_expenses` table:

```sql
INSERT INTO operational_expenses (
  organization_id,
  category,
  description,
  amount,
  expense_date
) VALUES (
  'org-123',
  'seo_api_calls',
  'Google Search Console API - 1000 requests',
  0.50,
  CURRENT_DATE
);
```

### AI Cost Tracking

Matrix v11.0 computations (using Claude/GPT for intent classification) are logged to `ai_usage_tracking`:

```sql
INSERT INTO ai_usage_tracking (
  organization_id,
  agent_type,
  model,
  input_tokens,
  output_tokens,
  total_cost
) VALUES (
  'org-123',
  'seo_matrix_v11',
  'claude-sonnet-4-5',
  1500,
  300,
  0.015
);
```

---

## Database Schema

### Core Tables (Phase 4 Step 1)

1. **seo_profiles** - One per domain per organization
   - Links to: organizations, workspaces, client_users, projects
   - Stores: domain, geo_region, service_vertical, package_tier
   - Platform IDs: GSC, GMB, Bing, Brave

2. **seo_credentials** - Secure credential vault (organization-scoped)
   - OAuth tokens (Google, Bing, Brave, Facebook, etc.)
   - API keys
   - Expiration tracking
   - Encrypted JSONB storage

3. **seo_keywords** - Tracked keywords per profile
   - Keyword text, intent, priority (1-5)
   - Target URL, is_primary flag
   - Unique per (seo_profile_id, keyword)

4. **seo_competitors** - Competitor domains
   - Domain, label (e.g., "Main Competitor")
   - Unique per (seo_profile_id, competitor_domain)

5. **seo_snapshots** - Historical SEO state
   - Snapshot date, source (google/bing/brave/internal_matrix)
   - JSONB payload (flexible schema)
   - Matrix score (0-100)

6. **seo_packages** - Package entitlements
   - Package tier (good/better/best)
   - Feature flags (social, matrix_v11, indexnow, etc.)
   - Effective date range

---

## Security Model

### Credential Storage

Credentials are stored in `seo_credentials` table (organization-scoped, separate from client `digital_vault`):

```typescript
{
  "credential_type": "gsc",
  "credential_data": {
    "access_token": "ya29.encrypted...",
    "refresh_token": "1//encrypted...",
    "expires_at": "2025-01-20T12:00:00Z",
    "scope": "https://www.googleapis.com/auth/webmasters.readonly"
  }
}
```

**Encryption**: Application-level encryption using `@aws-crypto/client-node` (AES-256-GCM)
**Rotation**: OAuth tokens refreshed automatically 5 minutes before expiration
**Audit**: All credential access logged to `auditLogs`

### RLS Policies

All SEO tables have Row Level Security enabled:

```sql
-- Example: seo_profiles SELECT policy
CREATE POLICY "seo_profiles_select"
  ON seo_profiles FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

**Access Levels**:
- **SELECT**: All authenticated users in organization
- **INSERT/UPDATE**: Owners and Admins only
- **DELETE**: Owners only
- **Service Role**: Full access (for cron jobs, webhooks)

---

## API Integration Roadmap

### Phase 4 Step 2: Google Search Console (GSC)
- OAuth 2.0 flow
- Search Analytics API (clicks, impressions, CTR, position)
- URL Inspection API (indexation status)
- Sitemaps API

### Phase 4 Step 3: Google My Business (GMB)
- Business Profile API
- Reviews, Q&A, Posts
- Insights (views, searches, actions)

### Phase 4 Step 4: Bing Webmaster Tools
- Site verification
- URL submission
- Keyword rankings
- Backlink data

### Phase 4 Step 5: Brave Search Console
- Search analytics
- Custom Goggle creation
- Privacy-focused insights

### Phase 4 Step 6: Social Media APIs
- Facebook Graph API (pages, posts, insights)
- Instagram Graph API (media, comments, insights)
- LinkedIn API (organization pages, analytics)
- TikTok Business API (videos, analytics)

### Phase 4 Step 7: Matrix v11.0 Engine
- Composite scoring algorithm
- AI-powered intent classification (Claude Sonnet)
- Real-time rank tracking
- Automated competitor analysis

### Phase 4 Step 8: IndexNow & Goggle Fabricator
- IndexNow API integration (Bing, Yandex)
- Brave Goggle creation and management
- Nano Banana micro-content optimization

---

## Cost Analysis

### Traditional Stack (Monthly)
| Tool | Cost |
|------|------|
| Semrush Pro | $119.95 |
| Ahrefs Lite | $99 |
| Moz Pro | $99 |
| BuzzSumo | $99 |
| Social media tools | $150-300 |
| **Total** | **$566-716/mo** |

### Unite-Hub SEO/GEO Module (Monthly)
| Component | Cost |
|-----------|------|
| Perplexity Sonar (SEO research) | $10-20 |
| Google Search Console API | Free |
| Bing Webmaster API | Free |
| Brave Search Console | Free |
| OpenRouter (Claude/GPT) | $30-60 |
| IndexNow API | Free |
| Storage (Supabase) | $25-35 |
| **Total** | **$65-165/mo** |

**Savings**: **88-94%** vs traditional stack

---

## Success Metrics

### Phase 4 Completion Goals

1. **Data Collection**
   - ✅ 100% uptime for snapshot collection cron jobs
   - ✅ <5 min latency for real-time rank checks
   - ✅ 99.9% OAuth token refresh success rate

2. **Matrix Accuracy**
   - ✅ Matrix Score correlation >0.85 with actual SERP rankings
   - ✅ <10% false positive rate for opportunity identification
   - ✅ 90% precision in intent classification

3. **Client Adoption**
   - ✅ 50% of active clients using SEO module within 6 months
   - ✅ 4.5+ average client satisfaction rating
   - ✅ 30% upsell rate from Good → Better/Best tiers

4. **Cost Efficiency**
   - ✅ <$100/mo total API costs for 10 client profiles
   - ✅ 90% cost reduction vs external tools
   - ✅ ROI positive within 3 months

---

## Next Steps

**Phase 4 Step 1** ✅ COMPLETE - Foundation architecture (this step)
**Phase 4 Step 2** 🔄 IN PROGRESS - Google Search Console integration
**Phase 4 Step 3** 📋 PLANNED - Google My Business integration
**Phase 4 Step 4** 📋 PLANNED - Bing Webmaster integration
**Phase 4 Step 5** 📋 PLANNED - Brave Search Console integration
**Phase 4 Step 6** 📋 PLANNED - Social Media APIs
**Phase 4 Step 7** 📋 PLANNED - Matrix v11.0 Engine
**Phase 4 Step 8** 📋 PLANNED - IndexNow & Goggle Fabricator

---

## References

- [Google Search Console API Docs](https://developers.google.com/webmaster-tools)
- [Bing Webmaster API Docs](https://learn.microsoft.com/en-us/bingwebmaster/)
- [Brave Search Console Docs](https://search.brave.com/help/webmaster-program)
- [IndexNow Protocol Spec](https://www.indexnow.org/documentation)
- [Perplexity Sonar API](https://docs.perplexity.ai/)
- [OpenRouter Multi-Model Routing](https://openrouter.ai/docs)

---

**Document Owner**: Orchestrator Agent
**Review Cycle**: After each Phase 4 step completion
**Stakeholders**: Phill (CEO), Development Team, Clients
