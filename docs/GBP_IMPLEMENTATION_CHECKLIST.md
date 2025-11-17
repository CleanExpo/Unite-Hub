# Google Business Profile Integration - Implementation Checklist

## Pre-Implementation Setup

### Google Cloud Console Setup
- [ ] Create Google Cloud Project: "Unite-Hub GBP Integration"
- [ ] Enable APIs:
  - [ ] Google Business Profile API (My Business API)
  - [ ] Google My Business Business Information API
  - [ ] Google My Business Verifications API
- [ ] Create OAuth 2.0 Credentials:
  - [ ] Application type: Web application
  - [ ] Authorized redirect URIs: `https://unite-hub.com/api/integrations/gbp/callback`
  - [ ] Download credentials JSON
- [ ] Add credentials to environment variables:
  ```env
  GOOGLE_GBP_CLIENT_ID=your-client-id
  GOOGLE_GBP_CLIENT_SECRET=your-client-secret
  GOOGLE_GBP_REDIRECT_URI=https://unite-hub.com/api/integrations/gbp/callback
  ```

### Database Migrations
- [ ] Create migration: `013_gbp_integration.sql`
- [ ] Add tables:
  - [ ] `gbp_locations`
  - [ ] `gbp_posts`
  - [ ] `gbp_reviews`
  - [ ] `nap_consistency_checks`
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify tables created with correct indexes

---

## Phase 1: Foundation (Week 1-2)

### Week 1: API Integration

#### OAuth Flow
- [ ] Create `src/lib/gbp/auth.ts`
  - [ ] `generateGBPAuthUrl()` function
  - [ ] `exchangeCodeForTokens()` function
  - [ ] `refreshGBPAccessToken()` function
- [ ] Create `src/app/api/integrations/gbp/auth-url/route.ts`
  - [ ] POST endpoint to generate OAuth URL
  - [ ] Include orgId in state parameter
- [ ] Create `src/app/api/integrations/gbp/callback/route.ts`
  - [ ] GET endpoint for OAuth callback
  - [ ] Exchange code for tokens
  - [ ] Store tokens in `integrations` table
  - [ ] Redirect to dashboard with success message

#### GBP API Client
- [ ] Create `src/lib/gbp/api-client.ts`
  - [ ] `listGBPAccounts()` function
  - [ ] `listGBPLocations()` function
  - [ ] `getGBPLocation()` function
  - [ ] `updateGBPLocation()` function
  - [ ] Error handling and retry logic
- [ ] Install dependencies:
  ```bash
  npm install googleapis@latest
  ```
- [ ] Test API calls with sample account

#### Database Seeding
- [ ] Update `integrations` table to support GBP provider
- [ ] Create seed data for testing

### Week 2: Dashboard UI

#### GBP Dashboard Page
- [ ] Create `src/app/dashboard/google-business/page.tsx`
  - [ ] Connection status check
  - [ ] "Connect GBP" button (redirects to OAuth)
  - [ ] Loading states
  - [ ] Error handling
- [ ] Create `src/components/gbp/ConnectionCard.tsx`
  - [ ] Display connection status
  - [ ] Show connected account/locations count
  - [ ] Disconnect button
- [ ] Create `src/components/gbp/LocationList.tsx`
  - [ ] List all connected GBP locations
  - [ ] Show profile completion percentage
  - [ ] Display NAP consistency status

#### Location Detail View
- [ ] Create `src/app/dashboard/google-business/[locationId]/page.tsx`
  - [ ] Display full location details
  - [ ] Show business info (name, address, phone, website)
  - [ ] Display categories and services
  - [ ] Show hours of operation
  - [ ] List photos/media
- [ ] Create `src/components/gbp/LocationDetailCard.tsx`
  - [ ] Business information section
  - [ ] NAP consistency indicators
  - [ ] Profile completion progress bar
  - [ ] Last sync timestamp

---

## Phase 2: Synchronization (Week 3-4)

### Week 3: CRM → GBP Sync

#### Sync Engine
- [ ] Create `src/lib/gbp/sync-engine.ts`
  - [ ] `syncGBPFromCRM()` function
  - [ ] Field mapping logic (NAP, description, etc.)
  - [ ] Conflict detection
  - [ ] Audit logging
- [ ] Create `src/app/api/integrations/gbp/sync/route.ts`
  - [ ] POST endpoint to trigger manual sync
  - [ ] Accept fields to sync (selective sync)
  - [ ] Return sync results
- [ ] Create `src/components/gbp/SyncButton.tsx`
  - [ ] Manual sync trigger
  - [ ] Loading state during sync
  - [ ] Success/error notifications

#### Conflict Resolution UI
- [ ] Create `src/components/gbp/ConflictResolutionDialog.tsx`
  - [ ] Show side-by-side comparison (CRM vs GBP)
  - [ ] Radio buttons to choose source of truth
  - [ ] "Apply to all fields" option
  - [ ] Confirmation step
- [ ] Implement conflict detection logic
- [ ] Store conflict history in database

### Week 4: Schema.org Integration

#### LocalBusiness Schema Generator
- [ ] Create `src/lib/gbp/schema-generator.ts`
  - [ ] `generateLocalBusinessSchema()` function
  - [ ] Map GBP data to Schema.org format
  - [ ] Merge with existing Organization schema
  - [ ] Validate generated schema
- [ ] Update `src/components/StructuredData.tsx`
  - [ ] Add `LocalBusinessStructuredData` component
  - [ ] Fetch GBP data for schema generation
  - [ ] Conditionally render if GBP connected
- [ ] Create sync endpoint:
  - [ ] `src/app/api/integrations/gbp/schema-sync/route.ts`
  - [ ] Trigger schema regeneration on GBP update

#### Validation & Preview
- [ ] Create `src/components/gbp/SchemaPreview.tsx`
  - [ ] JSON-LD preview
  - [ ] Validation status
  - [ ] Link to Google Rich Results Test
- [ ] Add schema validation on sync
- [ ] Display validation errors in UI

---

## Phase 3: Automation (Week 5-6)

### Week 5: Auto-Posting

#### Post Scheduler
- [ ] Create `src/lib/gbp/post-scheduler.ts`
  - [ ] `scheduleGBPPost()` function
  - [ ] Queue management (use background jobs)
  - [ ] Post status tracking
- [ ] Create `src/app/api/integrations/gbp/posts/route.ts`
  - [ ] POST: Create GBP post
  - [ ] GET: List posts for a location
  - [ ] DELETE: Remove post
- [ ] Create `src/components/gbp/PostComposer.tsx`
  - [ ] Rich text editor for post content
  - [ ] Character counter (1500 max)
  - [ ] CTA selector (Learn More, Call, Book, etc.)
  - [ ] Image uploader
  - [ ] Preview panel

#### Content Calendar Integration
- [ ] Create `src/app/dashboard/google-business/calendar/page.tsx`
  - [ ] Calendar view of scheduled posts
  - [ ] Drag-and-drop scheduling
  - [ ] Bulk scheduling
- [ ] Integrate with existing content calendar (if available)
- [ ] Auto-post triggers:
  - [ ] New blog post published → GBP post
  - [ ] New feature launched → GBP post
  - [ ] Promotion created → GBP offer post

### Week 6: Advanced Features

#### Review Monitoring
- [ ] Create `src/lib/gbp/review-monitor.ts`
  - [ ] `fetchGBPReviews()` function
  - [ ] Sentiment analysis with Claude AI
  - [ ] Auto-response generation
- [ ] Create `src/app/api/integrations/gbp/reviews/route.ts`
  - [ ] GET: Fetch reviews
  - [ ] POST: Reply to review
- [ ] Create `src/components/gbp/ReviewList.tsx`
  - [ ] List reviews with ratings
  - [ ] Sentiment indicators
  - [ ] Reply composer
  - [ ] Filter by rating/sentiment

#### Insights Dashboard
- [ ] Create `src/app/dashboard/google-business/insights/page.tsx`
  - [ ] Profile views chart (last 30 days)
  - [ ] Search appearances chart
  - [ ] Direction requests chart
  - [ ] Phone calls chart
  - [ ] Photo views chart
- [ ] Create `src/lib/gbp/insights.ts`
  - [ ] Fetch insights from GBP API
  - [ ] Cache insights data
  - [ ] Generate trend analysis
- [ ] Create charts with Recharts or Chart.js

---

## Phase 4: Optimization (Week 7-8)

### Week 7: AI Enhancements

#### AI Description Generator
- [ ] Create `src/lib/gbp/ai-generator.ts`
  - [ ] `generateGBPDescription()` with Claude
  - [ ] Use business info + services as context
  - [ ] Optimize for 750 character limit
  - [ ] Include keywords naturally
- [ ] Create `src/components/gbp/AIDescriptionGenerator.tsx`
  - [ ] "Generate with AI" button
  - [ ] Show generated description
  - [ ] Edit/regenerate options
  - [ ] Apply to GBP profile

#### Category Suggestions
- [ ] Implement AI-suggested categories
  - [ ] Analyze website content
  - [ ] Suggest primary + secondary categories
  - [ ] Show category tree from GBP API
- [ ] Create `src/components/gbp/CategorySelector.tsx`
  - [ ] Autocomplete search
  - [ ] AI suggestions badge
  - [ ] Primary/secondary indicators

#### Competitor Benchmarking
- [ ] Create `src/lib/gbp/competitor-analysis.ts`
  - [ ] Fetch competitor profiles
  - [ ] Compare profile completeness
  - [ ] Compare review counts/ratings
  - [ ] Identify gaps
- [ ] Create `src/app/dashboard/google-business/competitors/page.tsx`
  - [ ] Add competitor locations
  - [ ] Comparison table
  - [ ] Recommendations

### Week 8: Reporting & Analytics

#### Performance Dashboard
- [ ] Create `src/app/dashboard/google-business/analytics/page.tsx`
  - [ ] Overview cards (views, calls, directions)
  - [ ] Month-over-month trends
  - [ ] Post performance metrics
  - [ ] Review velocity chart
- [ ] Implement KPI tracking:
  - [ ] Profile completion score
  - [ ] NAP consistency score
  - [ ] Review response rate
  - [ ] Average review rating

#### Automated Reports
- [ ] Create `src/lib/gbp/report-generator.ts`
  - [ ] Generate PDF reports
  - [ ] Include charts and insights
  - [ ] Monthly summary email
- [ ] Schedule monthly report job (cron)
- [ ] Email reports to organization admins

---

## Testing Checklist

### Unit Tests
- [ ] Test OAuth flow
- [ ] Test GBP API client functions
- [ ] Test sync engine field mapping
- [ ] Test NAP consistency checker
- [ ] Test Schema.org generator
- [ ] Test AI description generator

### Integration Tests
- [ ] Test full OAuth flow (end-to-end)
- [ ] Test CRM → GBP sync
- [ ] Test GBP → Schema.org sync
- [ ] Test post creation and publishing
- [ ] Test review fetching and storage

### Manual Testing
- [ ] Connect real GBP account
- [ ] Verify location data fetched correctly
- [ ] Trigger manual sync and verify updates in GBP
- [ ] Create test post and verify in GBP dashboard
- [ ] Check Schema.org output with Google Rich Results Test
- [ ] Verify NAP consistency check accuracy

---

## Deployment Checklist

### Environment Variables
- [ ] Add to production `.env`:
  ```env
  GOOGLE_GBP_CLIENT_ID=
  GOOGLE_GBP_CLIENT_SECRET=
  GOOGLE_GBP_REDIRECT_URI=
  ```
- [ ] Verify OAuth redirect URI in Google Cloud Console

### Database
- [ ] Run migrations in production Supabase
- [ ] Verify indexes created
- [ ] Set up Row Level Security (RLS) policies:
  ```sql
  -- Example RLS for gbp_locations
  CREATE POLICY "Users can view their org's GBP locations"
  ON gbp_locations FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
  ```

### Monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure alerts for:
  - [ ] OAuth token expiration
  - [ ] Sync failures
  - [ ] API rate limit errors
  - [ ] NAP consistency issues
- [ ] Add GBP metrics to observability dashboard

### Documentation
- [ ] Update main README with GBP feature info
- [ ] Create user guide for GBP connection
- [ ] Document API endpoints
- [ ] Add troubleshooting section

---

## Post-Launch Tasks

### Week 1 After Launch
- [ ] Monitor error rates
- [ ] Check sync success rates
- [ ] Gather user feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Optimize sync performance
- [ ] Improve AI description quality
- [ ] Enhance UI based on feedback
- [ ] Add missing features from user requests

### Ongoing
- [ ] Weekly NAP consistency checks
- [ ] Monthly GBP API updates review
- [ ] Quarterly feature enhancements
- [ ] Annual security audit

---

## Success Criteria

### Phase 1 Success
- [ ] 90%+ OAuth connection success rate
- [ ] All GBP locations fetched accurately
- [ ] Dashboard displays location data correctly

### Phase 2 Success
- [ ] 95%+ sync success rate
- [ ] NAP consistency detected with 100% accuracy
- [ ] Schema.org validates with zero errors

### Phase 3 Success
- [ ] Posts publish successfully 98%+ of the time
- [ ] Reviews fetched within 24 hours of posting
- [ ] Insights data updated daily

### Phase 4 Success
- [ ] AI descriptions rated 4+ stars by users
- [ ] Reports generated error-free
- [ ] 80%+ user adoption of GBP features

---

## Resources

- **Implementation Guide**: `docs/GBP_INTEGRATION_STRATEGY.md`
- **Schema Guide**: `docs/UNITE_GROUP_SCHEMA_IMPLEMENTATION.md`
- **API Documentation**: https://developers.google.com/my-business
- **Support**: Internal Slack channel `#gbp-integration`

---

**Use this checklist to track implementation progress. Check off items as completed and update status in project management tool.**

**Last Updated**: 2025-01-17
**Version**: 1.0.0
