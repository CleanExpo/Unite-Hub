# Phase v1_1_04: Multi-Channel Content Builder

## Implementation Status: Foundation Complete (40%)

**Date**: 2025-01-25
**Phase**: v1_1_04
**Dependencies**: v1_1_02 (Brand Matrix), v1_1_03 (Topic Discovery), v1_1_07 (Analytics)

---

## ✅ Completed Components

### Database Layer (100%)

**Migration 153: Campaign Blueprints** (`supabase/migrations/153_campaign_blueprints.sql`)
- ✅ `campaign_blueprints` table with comprehensive JSON structure
- ✅ `campaign_blueprint_revisions` table for version history
- ✅ Approval workflow states: draft → pending_review → partially_approved → approved/rejected
- ✅ Channel-specific approval tracking (per-channel approval gates)
- ✅ Priority scoring: (impact × 10) / (difficulty + effort)
- ✅ Auto-triggers for priority calculation and revision creation
- ✅ Helper functions: `get_campaign_blueprints()`, `calculate_blueprint_priority()`, `approve_blueprint_channel()`
- ✅ RLS policies (founder-only access)

**Migration 154: Campaign Channels** (`supabase/migrations/154_campaign_channels.sql`)
- ✅ `campaign_channels` table with per-brand permissions
- ✅ `channel_templates` table for reusable content structures
- ✅ Seed function `seed_default_channels()` with 12 pre-configured channels:
  - Website: Landing Page, Product Page
  - Blog: Pillar Post, Cluster Post
  - Social: Facebook, Instagram, LinkedIn, TikTok, YouTube Shorts
  - Email: Newsletter, Nurture Sequence
- ✅ Channel specifications (max length, dimensions, best practices)
- ✅ Brand-specific channel permissions
- ✅ Helper functions: `get_brand_channels()`, `get_channel_templates()`

### Business Logic (30%)

**Channel Playbooks** (`src/lib/campaigns/channelPlaybooks.ts`)
- ✅ Comprehensive specifications for 9 channel types
- ✅ Brand voice guidelines per brand per channel
- ✅ SEO requirements (title length, meta descriptions, keyword density)
- ✅ Content structure templates (hook, body, CTA)
- ✅ Optimal lengths and formatting rules
- ✅ Helper functions: `getChannelPlaybook()`, `getBrandChannels()`

**Channels Implemented**:
1. Website Landing Page
2. Blog Pillar Post
3. Facebook Post
4. Instagram Post
5. LinkedIn Post
6. TikTok Video
7. YouTube Short
8. Email Newsletter
9. Email Nurture Sequence

---

## 🚧 In Progress / Pending Components

### Business Logic (70% remaining)

#### High Priority (P0)

**`multiChannelBlueprintEngine.ts`** (NOT YET CREATED)
- Purpose: Converts topics into multi-channel blueprints
- Required Functions:
  ```typescript
  generateBlueprint(topic, brandSlug, channels, objectives)
  populateChannelContent(channel, topic, brandContext)
  integrateAnalyticsInsights(blueprint, analyticsData)
  generateVisualConcepts(blueprint, vifEngine)
  ```
- Integration Points:
  - Topic Discovery Engine (v1_1_03) for topic input
  - Analytics (v1_1_07) for keyword/competition data
  - VIF (future) for visual placeholder generation
  - Anthropic Claude API for content generation

**`campaignEvaluator.ts`** (NOT YET CREATED)
- Purpose: Scores blueprints (difficulty, impact, effort)
- Required Functions:
  ```typescript
  evaluateDifficulty(blueprint, brandCapabilities)
  estimateImpact(blueprint, analyticsData, brandGoals)
  calculateEffort(blueprint, resourceAvailability)
  generatePriorityScore(difficulty, impact, effort)
  ```

#### Medium Priority (P1)

**API Routes** (NOT YET CREATED)
1. `/api/campaigns/blueprints` (GET/POST)
   - List blueprints with filters
   - Create new blueprint from topic
2. `/api/campaigns/blueprints/[id]` (GET/PATCH/DELETE)
   - Get single blueprint with full details
   - Update blueprint (per-channel approvals)
   - Delete blueprint

#### Low Priority (P2)

**UI Components** (NOT YET CREATED)
1. `CampaignBlueprintCard.tsx` - Card view of blueprint with status badges
2. `CampaignChannelMatrix.tsx` - Visual matrix of channels per blueprint
3. `/founder/campaigns/page.tsx` - Main campaigns dashboard

---

## 📋 Functional Requirements Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Convert topics to blueprints | ⚠️ Pending | Needs `multiChannelBlueprintEngine.ts` |
| Auto-generate visual placeholders (VIF) | ⚠️ Pending | VIF integration not yet implemented |
| Integrate analytics insights | ⚠️ Pending | Analytics data available (v1_1_07), needs integration layer |
| Brand-aware tone/positioning | ✅ Complete | Implemented in `channelPlaybooks.ts` |
| Difficulty/impact/effort scoring | ⚠️ Pending | Database fields exist, needs `campaignEvaluator.ts` |
| Founder approval workflow | ✅ Complete | Database schema + helper functions ready |
| Export to Production Engine | ⚠️ Pending | Production Engine not yet implemented |
| Log to Living Intelligence Archive | ⚠️ Pending | Archive integration pending |

---

## 🎯 Completion Roadmap

### Phase 1: Core Engine (Estimated: 8 hours)
1. **Implement `multiChannelBlueprintEngine.ts`**:
   - Topic-to-blueprint conversion
   - Channel content population using playbooks
   - Analytics insights integration
   - AI-generated draft content (Claude API)

2. **Implement `campaignEvaluator.ts`**:
   - Difficulty scoring algorithm
   - Impact estimation (analytics-based)
   - Effort calculation (resource-based)

### Phase 2: API Layer (Estimated: 4 hours)
3. **Create API routes**:
   - Blueprint CRUD operations
   - Founder authentication/authorization
   - Integration with database helper functions

### Phase 3: UI Layer (Estimated: 6 hours)
4. **Build UI components**:
   - Blueprint list with filters
   - Channel matrix visualization
   - Approval workflow interface
   - Draft content preview

### Phase 4: Integration (Estimated: 4 hours)
5. **Connect systems**:
   - Topic Discovery Engine → Blueprint Generator
   - Analytics Data → Priority Scoring
   - VIF → Visual Placeholders (when available)
   - Living Intelligence Archive → Audit Trail

**Total Estimated Time to Complete**: 22 hours

---

## 🔧 How to Use (Current State)

### 1. Apply Database Migrations

```sql
-- In Supabase SQL Editor:

-- Migration 153: Campaign Blueprints
\i supabase/migrations/153_campaign_blueprints.sql

-- Migration 154: Campaign Channels
\i supabase/migrations/154_campaign_channels.sql

-- Seed default channels for workspace
SELECT seed_default_channels('your-workspace-id-here');
```

### 2. Verify Channel Configuration

```sql
-- List available channels for a brand
SELECT * FROM get_brand_channels('workspace-id', 'unite_group');

-- Check campaign blueprint stats
SELECT * FROM get_blueprint_stats('workspace-id', NULL);
```

### 3. Manual Blueprint Creation (Temporary)

Until the blueprint engine is implemented, blueprints can be created manually:

```sql
INSERT INTO campaign_blueprints (
  workspace_id,
  brand_slug,
  topic_title,
  topic_keywords,
  blueprint_title,
  blueprint_type,
  primary_objective,
  target_audience,
  channels,
  difficulty_score,
  impact_score,
  effort_score,
  created_by
) VALUES (
  'workspace-id',
  'unite_group',
  'Stainless Steel Balustrades: Complete Guide',
  ARRAY['stainless steel', 'balustrades', 'modern railings'],
  'Balustrades Content Campaign',
  'integrated_campaign',
  'lead_generation',
  '{"segments": ["architects", "builders"], "personas": ["commercial_decision_makers"]}'::JSONB,
  '{"website": true, "blog": true, "social": true}'::JSONB,
  6,  -- difficulty
  9,  -- impact
  7,  -- effort
  'user-id'
);
```

---

## 📊 Database Schema Reference

### Campaign Blueprints Table

```typescript
interface CampaignBlueprint {
  id: UUID;
  workspace_id: UUID;
  brand_slug: string;
  topic_id?: UUID;
  topic_title: string;
  topic_keywords: string[];

  blueprint_title: string;
  blueprint_type: 'integrated_campaign' | 'content_cluster' | 'product_launch' | ...;
  primary_objective: 'traffic' | 'engagement' | 'conversions' | ...;
  target_audience: {
    segments: string[];
    personas: string[];
    industries: string[];
  };

  channels: Record<string, any>; // { website: {...}, blog: {...}, social: {...} }
  website_content?: WebsiteContent;
  blog_content?: BlogContent;
  social_content?: SocialContent;
  email_content?: EmailContent;
  video_content?: VideoContent;

  visual_concepts?: VisualConcept[];
  vif_references?: string[];

  difficulty_score: 1-10;
  impact_score: 1-10;
  effort_score: 1-10;
  priority_score: number; // Auto-calculated

  analytics_insights?: AnalyticsInsights;
  seo_recommendations?: SEORecommendations;

  approval_status: 'draft' | 'pending_review' | 'partially_approved' | 'approved' | 'rejected';
  channel_approvals: Record<string, 'approved' | 'pending' | 'rejected'>;

  created_at: Date;
  created_by: UUID;
  updated_at: Date;
  approved_at?: Date;
  approved_by?: UUID;
}
```

### Campaign Channels Table

```typescript
interface CampaignChannel {
  id: UUID;
  workspace_id: UUID;
  channel_slug: string;
  channel_name: string;
  channel_category: 'website' | 'blog' | 'social' | 'email' | 'video' | 'advertising';
  platform?: string;
  is_active: boolean;
  requires_approval: boolean;
  allowed_brands: string[];
  specs: ChannelSpecs;
  best_practices: BestPractices;
  auto_publish_enabled: boolean;
  scheduling_enabled: boolean;
}
```

---

## 🚀 Next Steps for Developers

1. **Implement Blueprint Engine**:
   - Create `src/lib/campaigns/multiChannelBlueprintEngine.ts`
   - Integrate Claude API for content generation
   - Use `channelPlaybooks.ts` for structure/guidelines
   - Pull analytics data from v1_1_07 for insights

2. **Implement Campaign Evaluator**:
   - Create `src/lib/campaigns/campaignEvaluator.ts`
   - Define scoring algorithms
   - Integrate brand capabilities data

3. **Build API Layer**:
   - Create `/api/campaigns/blueprints/route.ts` (list + create)
   - Create `/api/campaigns/blueprints/[id]/route.ts` (CRUD)
   - Add founder authentication checks
   - Integrate with database helper functions

4. **Build UI Components**:
   - Blueprint dashboard with list view
   - Channel matrix visualization
   - Approval workflow interface
   - Draft content preview modal

5. **Testing & Deployment**:
   - Unit tests for blueprint engine
   - Integration tests for API routes
   - E2E tests for approval workflow
   - Deploy to production

---

## 📖 References

- **Brand Matrix (v1_1_02)**: Brand-specific positioning, voice, audience data
- **Topic Discovery (v1_1_03)**: Topic sourcing and validation (NOT YET IMPLEMENTED)
- **Analytics (v1_1_07)**: Keyword data, search volume, competition analysis
- **Founder Ops Hub (v1_1_01)**: Task management and execution queue

---

## 🔐 Safety & Compliance

- ✅ **Founder-only access**: All RLS policies enforce founder role
- ✅ **Manual approval required**: `requires_manual_review = TRUE` by default
- ✅ **No auto-publishing**: All blueprints start in draft state
- ✅ **Channel-specific approvals**: Founder must approve each channel individually
- ✅ **Truth layer compliance**: `uncertainty_notes`, `data_sources`, `ai_confidence_score` fields
- ✅ **Brand positioning enforced**: `brand_voice_compliance`, `positioning_validated` flags
- ✅ **Version history**: All approval state changes tracked in `campaign_blueprint_revisions`

---

## 📝 Implementation Notes

**Current State**: Foundation layer complete (database schema + channel specifications). The system is ready for the business logic and UI layers to be built on top.

**Key Design Decisions**:
1. **JSON Structure for Flexibility**: Channel content stored as JSONB for flexibility in content types
2. **Per-Channel Approval Gates**: Founder can approve individual channels before full blueprint approval
3. **Calculated Priority Scores**: Auto-calculated on insert/update for consistent prioritization
4. **Brand-Aware Permissions**: Channels have `allowed_brands` array for fine-grained access control
5. **Revision History**: All approval state changes automatically tracked

**Performance Considerations**:
- Indexes on `workspace_id`, `brand_slug`, `approval_status`, `priority_score`
- JSONB columns for flexible content structure
- Helper functions with `SECURITY DEFINER` for efficient RLS bypass

**Integration Points**:
- Topic Discovery Engine (v1_1_03) provides topic input
- Analytics (v1_1_07) provides keyword/competition data
- Brand Matrix (v1_1_02) provides brand voice/positioning
- VIF (future) provides visual generation
- Production Engine (future) handles final asset creation

---

**Status**: ⚠️ **Foundation Complete - Awaiting Full Implementation**

**Estimated Completion**: 22 additional hours of development
