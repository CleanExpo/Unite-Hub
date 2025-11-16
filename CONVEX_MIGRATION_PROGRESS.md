# Convex to Supabase Migration Progress

**Date**: November 16, 2025
**Status**: 🎉 COMPLETE - 25/25 endpoints migrated (100%) 🎉

---

## ✅ Completed Migrations (25 endpoints)

### 1. `/api/email/send` - Email Sending ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Migrated to `sent_emails` and `emails` tables
- Added rate limiting (100 req/15min)
- Added input validation with `GmailSendEmailSchema`
- Added authentication check
- Added workspace verification
- Supports both `contactId` and legacy `clientId` parameter

**Database Tables Used**:
- `sent_emails` - Primary storage for outgoing emails
- `emails` - Unified inbox view
- `contacts` - Contact verification
- `workspaces` - Workspace access control

### 2. `/api/email/webhook` - Gmail Webhook Handler ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Auto-creates contacts from incoming emails
- Stores emails in `emails` table with metadata
- Added rate limiting (300 req/15min - public tier)
- Added webhook verification
- Workspace lookup for email processing

**Database Tables Used**:
- `emails` - Incoming email storage
- `contacts` - Auto-create or lookup contact
- `workspaces` - Workspace routing

### 3. `/api/email/oauth/callback` - Gmail OAuth Callback ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Stores OAuth tokens in `email_integrations` table
- Added authentication check
- Added rate limiting (10 req/15min - strict tier)
- Added input validation with `GmailOAuthCallbackSchema`
- Workspace detection from state or user orgs

**Database Tables Used**:
- `email_integrations` - OAuth token storage
- `user_organizations` - User workspace lookup
- `workspaces` - Workspace verification

### 4. `/api/clients/[id]/emails` - Get Contact Emails ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Changed clientId → contactId terminology
- Added comprehensive authorization checks
- Added rate limiting (100 req/15min - API tier)
- Added pagination validation with `PaginationSchema`
- Added UUID validation for contact ID

**Database Tables Used**:
- `contacts` - Contact lookup
- `emails` - Email history
- `workspaces` - Access control
- `user_organizations` - Authorization

### 5. `/api/email/link` - Email Linking ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- POST: Updates contact email address (simplified for single email model)
- DELETE: Removes email from contact (sets to null)
- Added rate limiting (100 req/15min - API tier)
- Added input validation with `EmailSchema` and `UUIDSchema`
- Added workspace verification and conflict detection
- Supports both `contactId` and legacy `clientId` parameter
- Auto-links unlinked emails to contact after update

**Database Tables Used**:
- `contacts` - Email updates
- `emails` - Link emails to contact
- `workspaces` - Access control
- `user_organizations` - Authorization

### 6. `/api/clients/[id]/sequences` - Get Contact Sequences ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Changed clientId → contactId terminology
- Query drip campaigns via `campaign_enrollments` table
- Added support for direct campaign assignments
- Added comprehensive authorization checks
- Added rate limiting (100 req/15min - API tier)
- Added pagination with `PaginationSchema`
- Returns enrollment status, current step, and scheduling info

**Database Tables Used**:
- `drip_campaigns` - Campaign details
- `campaign_enrollments` - Contact enrollment tracking
- `contacts` - Contact verification
- `workspaces` - Access control
- `user_organizations` - Authorization

### 7. `/api/sequences/[id]` - Sequence CRUD ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- GET: Fetch sequence with all steps (joined query)
- PUT: Update sequence (name, description, status, goal, tags)
- DELETE: Remove sequence with cascade deletion
- Added comprehensive authorization checks
- Added rate limiting (100 req/15min - API tier)
- Added UUID validation
- Added status validation (draft, active, paused, archived)

**Database Tables Used**:
- `drip_campaigns` - Sequence storage
- `campaign_steps` - Step details
- `workspaces` - Access control
- `user_organizations` - Authorization

### 8. `/api/demo/initialize` - Demo Environment Setup ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- POST: Creates complete demo environment (idempotent)
  - Demo organization "Demo Organization"
  - Demo workspace "Demo Workspace"
  - 3 sample contacts with varying AI scores
  - 5-step welcome drip campaign
  - 2 sample emails with AI processing
- GET: Check demo status and stats
- DELETE: Clean up demo data (cascade deletion)
- Added rate limiting (300 req/15min - public tier)
- Includes comprehensive sample data for testing

**Database Tables Used**:
- `organizations` - Demo org creation
- `workspaces` - Demo workspace
- `contacts` - Sample contacts
- `drip_campaigns` - Demo campaign
- `campaign_steps` - Campaign steps
- `emails` - Sample emails

**New Database Migration**:
- Created `008_drip_campaigns.sql` with 4 new tables:
  - `drip_campaigns` (formerly emailSequences)
  - `campaign_steps` (formerly emailSequenceSteps)
  - `campaign_enrollments` (formerly emailSequenceContacts)
  - `campaign_execution_logs` (new - for tracking execution)

### 9. `/api/sequences/generate` - AI Sequence Generation ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Integrated Anthropic SDK with Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Added AI-specific rate limiting (20 req/15min - AI agent tier)
- Added input validation with `UUIDSchema`
- Generates complete email sequences with AI reasoning
- Supports 5 sequence types: cold_outreach, lead_nurture, onboarding, re_engagement, custom
- Creates campaign + steps atomically with rollback on failure
- JSON parsing with regex extraction to handle markdown-wrapped responses
- Supports both `contactId` and legacy `clientId` parameter
- Returns complete sequence with all generated steps and AI reasoning

**Database Tables Used**:
- `drip_campaigns` - Campaign creation
- `campaign_steps` - Step creation with AI metadata
- `contacts` - Contact verification
- `workspaces` - Access control
- `user_organizations` - Authorization

**AI Integration**:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 4000
- Structured JSON prompt for consistent output
- Personalization tags: {{first_name}}, {{company_name}}
- Each step includes AI reasoning for timing and content

### 10. `/api/images/generate` - AI Image Generation ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Integrated DALL-E 3 via OpenAI SDK
- Added AI-specific rate limiting (20 req/15min - AI agent tier)
- Added UUID validation for contact ID
- Stores images in `generated_images` table
- Supports tier-based variation limits (Starter: 3, Professional/Enterprise: 5)
- Usage tracking with monthly limits (Starter: 50, Professional: 200, Enterprise: 1000)
- Brand color extraction from contact custom fields
- Comprehensive cost tracking ($0.04-$0.12 per image)
- Supports both `contactId` and legacy `clientId` parameter
- Platform-optimized prompts (Facebook, Instagram, TikTok, LinkedIn, general)

**Database Tables Used**:
- `generated_images` - Image storage with metadata
- `contacts` - Contact verification and brand colors
- `organizations` - Plan tier and usage tracking
- `workspaces` - Access control
- `user_organizations` - Authorization

**Image Generation**:
- Provider: OpenAI DALL-E 3
- Sizes: 1024x1024, 1792x1024, 1024x1792
- Quality: standard ($0.04-$0.08), HD ($0.08-$0.12)
- Style: vivid (default)
- Prompt engineering with business context

### 11. `/api/images/regenerate` - Image Regeneration ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- AI-specific rate limiting (20 req/15min)
- UUID validation for image ID
- Creates new image record with incremented revision number
- Tracks parent image lineage via `parent_image_id`
- Supports optional new prompt (defaults to original)
- Subscription status verification
- Trial expiration check
- Cost tracking for regenerations

**Database Tables Used**:
- `generated_images` - Image versioning and lineage
- `organizations` - Subscription verification
- `workspaces` - Access control
- `user_organizations` - Authorization

### 12. `/api/clients/[id]/images` - Get Contact Images ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- Changed clientId → contactId terminology
- Added comprehensive authorization checks
- Added rate limiting (100 req/15min - API tier)
- Added pagination with `PaginationSchema`
- Filter by status (pending, processing, completed, failed)
- Filter by provider (dall-e, etc.)
- Sorted by creation date (newest first)
- UUID validation for contact ID

**Database Tables Used**:
- `generated_images` - Image retrieval with filters
- `contacts` - Contact verification
- `workspaces` - Access control
- `user_organizations` - Authorization

### 13. `/api/clients/[id]/images/[imageId]` - Image CRUD ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- GET: Fetch specific image with ownership verification
- DELETE: Remove image (admin/owner only)
- PATCH: Update image metadata (status, additional_params)
- Added comprehensive authorization checks
- Added rate limiting (100 req/15min - API tier)
- UUID validation for both IDs
- Role-based permissions for deletion

**Database Tables Used**:
- `generated_images` - Image CRUD operations
- `workspaces` - Access control
- `user_organizations` - Authorization with role check

**New Database Migration**:
- Created `011_generated_images.sql` with comprehensive image table:
  - Image URLs and metadata
  - Provider and model tracking
  - Brand colors and customization
  - Generation cost tracking
  - Revision history with parent linking
  - Status tracking (pending, processing, completed, failed)

### 14. `/api/subscription/[orgId]` - Get Subscription Details ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- GET: Fetch complete subscription details with Stripe integration
- Added rate limiting (100 req/15min - API tier)
- Added UUID validation for organization ID
- Added authentication and authorization checks
- Fetches subscription from Supabase and Stripe
- Calculates days until renewal
- Returns plan details with features
- Returns both Supabase and Stripe subscription data

**Database Tables Used**:
- `subscriptions` - Subscription storage
- `user_organizations` - Authorization
- `workspaces` - Access control

**Stripe Integration**:
- Fetches full subscription from Stripe API
- Returns payment method status
- Returns cancellation details
- Plan tier mapping with PLAN_TIERS

### 15. `/api/subscription/portal` - Stripe Billing Portal ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- POST: Create Stripe billing portal session for customer self-service
- Added rate limiting (100 req/15min - API tier)
- Added UUID validation for organization ID
- Role-based access control (owner/admin only)
- Added returnUrl validation
- Creates secure Stripe portal session

**Database Tables Used**:
- `subscriptions` - Fetch Stripe customer ID
- `user_organizations` - Authorization with role check
- `workspaces` - Access control

**Stripe Integration**:
- Creates billing portal session
- Returns secure portal URL
- Allows customers to manage subscriptions, payment methods, invoices

### 16. `/api/subscription/invoices` - Get Billing History ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- GET: Fetch billing history and upcoming invoice from Stripe
- Added rate limiting (100 req/15min - API tier)
- Added UUID validation for organization ID
- Role-based access control (owner/admin only)
- Added pagination support (default 12 invoices)
- Fetches customer invoices from Stripe
- Fetches upcoming invoice preview
- Converts amounts and timestamps to client format

**Database Tables Used**:
- `subscriptions` - Fetch Stripe customer and subscription IDs
- `user_organizations` - Authorization with role check
- `workspaces` - Access control

**Stripe Integration**:
- Fetches invoice history with getCustomerInvoices()
- Fetches upcoming invoice with getUpcomingInvoice()
- Returns formatted invoice data with PDFs and hosted URLs
- Returns line items for upcoming invoice

### 17. `/api/stripe/webhook` - Stripe Webhook Handler ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced `ConvexHttpClient` with `getSupabaseServer()`
- POST: Comprehensive webhook handler for all Stripe events
- Webhook signature verification with stripe-signature header
- Handles 10 Stripe event types
- Upsert operations with onConflict for idempotency
- Amount conversion (cents to dollars)
- Timestamp conversion (Unix to ISO 8601)
- Status mapping from Stripe to Supabase
- Comprehensive error handling and logging

**Handles Event Types**:
- customer.subscription.created - Create subscription in Supabase
- customer.subscription.updated - Update subscription details
- customer.subscription.deleted - Mark subscription as canceled
- invoice.paid - Update subscription status, store invoice
- invoice.payment_failed - Mark subscription as past_due
- invoice.payment_action_required - Log action required
- customer.created - Link Stripe customer to organization
- customer.updated - Sync customer updates
- payment_intent.succeeded - Log successful payment
- payment_intent.payment_failed - Log failed payment

**Database Tables Used**:
- `subscriptions` - Subscription lifecycle management
- `invoices` - Invoice storage with full details
- `organizations` - Link Stripe customers

**Stripe Integration**:
- Webhook signature verification
- Event construction and validation
- getPlanTierFromPriceId() for plan mapping
- mapStripeStatus() for status conversion
- Comprehensive metadata handling

**New Database Migration**:
- Created `012_subscriptions.sql` with 3 new tables:
  - `subscriptions` - Stripe subscription data for organizations
  - `invoices` - Stripe invoice records for billing history
  - `payment_methods` - Payment methods attached to organizations

### 18. `/api/subscription/cancel` - Cancel Subscription ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Cancel subscription (immediately or at period end)
- Added rate limiting (100 req/15min - API tier)
- Role-based access control (owner/admin only)
- Added Zod validation for request body
- Stripe cancellation with `cancelSubscription()`
- Updates Supabase with cancel flags and timestamps
- Supports both immediate and end-of-period cancellation

**Database Tables Used**:
- `subscriptions` - Update cancellation status
- `user_organizations` - Authorization with role check

**Stripe Integration**:
- Uses cancelSubscription() from Stripe client
- Sets cancel_at_period_end or cancels immediately
- Syncs cancellation timestamps

### 19. `/api/subscription/upgrade` - Upgrade Subscription ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Upgrade subscription to higher tier
- Added rate limiting (100 req/15min - API tier)
- Role-based access control (owner/admin only)
- Added Zod validation with plan tier enum
- Proration calculation with `calculateProration()`
- Stripe update with `updateSubscription()`
- Updates Supabase with new plan details
- Returns proration info and plan features

**Database Tables Used**:
- `subscriptions` - Update plan tier and pricing
- `user_organizations` - Authorization with role check

**Stripe Integration**:
- Immediate proration with always_invoice
- Updates subscription items with new price ID
- Returns proration amount and currency

### 20. `/api/subscription/downgrade` - Downgrade Subscription ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Downgrade subscription to lower tier
- Added rate limiting (100 req/15min - API tier)
- Role-based access control (owner/admin only)
- Added Zod validation (starter/professional only)
- Proration calculation with credits
- Stripe update with `updateSubscription()`
- Creates prorations for credits on next invoice
- Updates Supabase with new plan details

**Database Tables Used**:
- `subscriptions` - Update plan tier and pricing
- `user_organizations` - Authorization with role check

**Stripe Integration**:
- create_prorations for credits (downgrade behavior)
- Updates subscription items with new price ID
- Credits applied to next invoice

### 21. `/api/subscription/reactivate` - Reactivate Subscription ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Reactivate a canceled subscription (before period end)
- Added rate limiting (100 req/15min - API tier)
- Role-based access control (owner/admin only)
- Added Zod validation for request body
- Validates subscription is scheduled for cancellation
- Checks subscription hasn't ended yet
- Stripe reactivation with `reactivateStripeSubscription()`
- Updates Supabase to remove cancellation flags

**Database Tables Used**:
- `subscriptions` - Remove cancellation status
- `user_organizations` - Authorization with role check

**Stripe Integration**:
- Uses reactivateSubscription() from Stripe client
- Removes cancel_at_period_end flag
- Clears cancellation timestamps

### 22. `/api/calendar/[postId]/approve` - Approve Calendar Post ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Approve calendar post for publishing
- Added rate limiting (100 req/15min - API tier)
- Added UUID validation for post ID
- Updates post status to 'approved'
- Records approval timestamp and approving user
- Workspace access verification

**Database Tables Used**:
- `calendar_posts` - Update approval status
- `user_organizations` - Authorization check

### 23. `/api/calendar/[postId]` - Calendar Post CRUD ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- PUT: Update calendar post fields
- DELETE: Remove calendar post
- Added rate limiting (100 req/15min - API tier)
- Added Zod validation for update schema
- Partial updates (only provided fields)
- Workspace access verification
- Platform and post type validation

**Database Tables Used**:
- `calendar_posts` - CRUD operations
- `user_organizations` - Authorization check

**Update Fields Supported**:
- suggestedCopy, suggestedHashtags, suggestedImagePrompt
- callToAction, scheduledDate, platform, postType
- contentPillar, status (draft/approved/published/archived)

### 24. `/api/calendar/[postId]/regenerate` - Regenerate Post with AI ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: AI-powered post regeneration
- AI-specific rate limiting (20 req/15min - AI agent tier)
- Fetches existing post, contact, persona, and strategy
- Calls Claude Sonnet 4 with regeneration prompt
- JSON parsing with regex extraction
- Updates post with fresh AI-generated content
- Workspace access verification

**Database Tables Used**:
- `calendar_posts` - Fetch and update post
- `contacts` - Business context
- `marketing_personas` - Target audience
- `marketing_strategies` - Content strategy
- `user_organizations` - Authorization

**AI Integration**:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 2000
- Generates fresh copy, hashtags, image prompts, CTAs
- AI reasoning for content decisions

### 25. `/api/calendar/generate` - AI Content Calendar Generation ✅
**Status**: FULLY MIGRATED
**Changes**:
- Replaced Convex with `getSupabaseServer()`
- POST: Generate complete content calendar with AI
- AI-specific rate limiting (20 req/15min - AI agent tier)
- Added Zod validation for generation parameters
- Requires active persona and marketing strategy
- Calls Claude Sonnet 4 with calendar generation prompt
- Batch creates multiple calendar posts
- Date range and platform configuration
- Returns strategic summary and notes

**Database Tables Used**:
- `calendar_posts` - Batch insert generated posts
- `contacts` - Business context
- `marketing_personas` - Target audience (required)
- `marketing_strategies` - Content strategy (required)
- `user_organizations` - Authorization

**AI Integration**:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 8000 (large calendar generation)
- Uses CONTENT_CALENDAR_SYSTEM_PROMPT
- Uses buildContentCalendarUserPrompt helper
- Platform-specific content generation
- Content pillar distribution
- Optimal posting times and audience targeting

**New Database Migration**:
- Created `013_calendar_system.sql` with 3 new tables:
  - `marketing_personas` - Persona definitions for targeting
  - `marketing_strategies` - Strategic content plans
  - `calendar_posts` - AI-generated content calendar posts

---

## 🔄 In Progress (0 endpoints)

None - ALL ENDPOINTS MIGRATED! 🎉🎉🎉

---

## ⏳ Pending Migrations (0 endpoints)

**🎊 MIGRATION 100% COMPLETE! 🎊**

All 25 endpoints have been successfully migrated from Convex to Supabase!

---

## 🗂️ Database Schema Gaps

### Tables Created

**All calendar tables have been created!** ✅

1. **calendar_posts** - ✅ CREATED (013_calendar_system.sql)
   - AI-generated content calendar posts
   - Scheduling and platform management
   - Content approval workflow
   ```sql
   CREATE TABLE calendar_posts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     workspace_id UUID NOT NULL REFERENCES workspaces(id),
     contact_id UUID REFERENCES contacts(id),
     scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
     platform TEXT NOT NULL, -- facebook, instagram, linkedin, etc.
     post_type TEXT NOT NULL, -- post, story, reel, etc.
     content_pillar TEXT,
     suggested_copy TEXT NOT NULL,
     suggested_hashtags TEXT[],
     suggested_image_prompt TEXT,
     ai_reasoning TEXT,
     best_time_to_post TEXT,
     target_audience TEXT,
     call_to_action TEXT,
     status TEXT DEFAULT 'draft', -- draft, approved, published
     approved_at TIMESTAMP WITH TIME ZONE,
     published_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **marketing_personas** - ✅ CREATED (013_calendar_system.sql)
   - Persona definitions for content targeting
   - Demographics and pain points
   - Preferred communication channels
   ```sql
   CREATE TABLE marketing_personas (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     workspace_id UUID NOT NULL REFERENCES workspaces(id),
     contact_id UUID REFERENCES contacts(id),
     name TEXT NOT NULL,
     description TEXT,
     demographics JSONB,
     pain_points TEXT[],
     goals TEXT[],
     preferred_channels TEXT[],
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **marketing_strategies** - ✅ CREATED (013_calendar_system.sql)
   - Strategic content plans
   - Content pillars and objectives
   - Platform-specific posting frequency
   ```sql
   CREATE TABLE marketing_strategies (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     workspace_id UUID NOT NULL REFERENCES workspaces(id),
     contact_id UUID REFERENCES contacts(id),
     name TEXT NOT NULL,
     objectives TEXT[],
     content_pillars JSONB,
     target_platforms TEXT[],
     posting_frequency JSONB,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. **generated_images** - For AI-generated images
   ```sql
   CREATE TABLE generated_images (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     workspace_id UUID NOT NULL REFERENCES workspaces(id),
     contact_id UUID REFERENCES contacts(id),
     calendar_post_id UUID REFERENCES calendar_posts(id),
     prompt TEXT NOT NULL,
     image_url TEXT NOT NULL,
     provider TEXT, -- dall-e, midjourney, etc.
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **subscriptions** - ✅ CREATED (012_subscriptions.sql)
   - Stripe subscription data for organizations
   - Includes billing periods, trial dates, cancellation tracking
   - Usage limits and metadata support

6. **invoices** - ✅ CREATED (012_subscriptions.sql)
   - Stripe invoice records for billing history
   - Amount tracking (due, paid, remaining)
   - PDF and hosted URL links

7. **payment_methods** - ✅ CREATED (012_subscriptions.sql)
   - Payment methods attached to organizations
   - Card and bank account details
   - Default payment method tracking

---

## 📊 Migration Statistics

**Overall Progress**: 25/25 endpoints (100%) 🎊

**By Priority**:
- ✅ High Priority (Email): 3/3 endpoints (100%) - Email infrastructure complete!
- ✅ High Priority (Calendar): 4/4 endpoints (100%) - AI content calendar complete! 🎉
- ✅ Medium Priority (Clients): 3/3 endpoints (100%) - Client data access complete!
- ✅ Medium Priority (Sequences): 3/3 endpoints (100%) - Sequences complete!
- ✅ Medium Priority (Images): 4/4 endpoints (100%) - Image generation complete!
- ✅ High Priority (Subscriptions): 8/8 endpoints (100%) - Complete billing system! 🎉
- ✅ Lower Priority (Demo): 1/1 endpoints (100%) - Demo complete!

**Total Time Investment**: Estimated 24-28 hours across 2 sessions

**🎊🎉 MIGRATION 100% COMPLETE - ALL ENDPOINTS MIGRATED! 🎉🎊**

**Session 1 Progress**:
- ✅ Created drip campaign tables migration (`008_drip_campaigns.sql`)
- ✅ Migrated `/api/email/link` (POST + DELETE)
- ✅ Migrated `/api/clients/[id]/sequences`
- ✅ Migrated `/api/sequences/[id]` (GET + PUT + DELETE)
- ✅ Migrated `/api/demo/initialize` (POST + GET + DELETE)
- **Total Session 1**: 4 endpoints + 1 migration file

**Session 2 Progress (Part 1 - Images)**:
- ✅ Fixed database schema issues (organizations, contacts, emails tables)
- ✅ Created consolidated migration (`apply-migrations-step-by-step.sql`)
- ✅ Migrated `/api/sequences/generate` (AI-powered sequence generation)
- ✅ Created `generated_images` table migration (`011_generated_images.sql`)
- ✅ Migrated `/api/images/generate` (DALL-E 3 integration)
- ✅ Migrated `/api/images/regenerate` (image regeneration with versioning)
- ✅ Migrated `/api/clients/[id]/images` (GET with pagination)
- ✅ Migrated `/api/clients/[id]/images/[imageId]` (GET + PATCH + DELETE)
- **Subtotal**: 5 endpoints + 4 migration files (009, 010, 011, consolidated)

**Session 2 Progress (Part 2 - Subscriptions/Billing - COMPLETE)**:
- ✅ Created subscriptions infrastructure migration (`012_subscriptions.sql`)
  - subscriptions table (plan tier, status, billing periods, trial dates)
  - invoices table (full billing history with amounts and PDFs)
  - payment_methods table (card/bank details, default tracking)
- ✅ Fixed `012_subscriptions.sql` org_id type mismatch (UUID → TEXT)
- ✅ Migrated `/api/subscription/[orgId]` (GET subscription with Stripe integration)
- ✅ Migrated `/api/subscription/portal` (POST billing portal session)
- ✅ Migrated `/api/subscription/invoices` (GET billing history + upcoming invoice)
- ✅ Migrated `/api/stripe/webhook` (comprehensive webhook handler for 10 event types)
- ✅ Migrated `/api/subscription/cancel` (POST cancel subscription)
- ✅ Migrated `/api/subscription/upgrade` (POST upgrade with proration)
- ✅ Migrated `/api/subscription/downgrade` (POST downgrade with credits)
- ✅ Migrated `/api/subscription/reactivate` (POST reactivate canceled subscription)
- **Subtotal**: 8 endpoints + 1 migration file (012) + 1 migration fix

**Total Session 2**: 13 endpoints + 5 migration files + 1 fix

**Session 3 Progress (Calendar System - COMPLETE)**:
- ✅ Created calendar system migration (`013_calendar_system.sql`)
  - marketing_personas table (persona targeting and demographics)
  - marketing_strategies table (content strategy and pillars)
  - calendar_posts table (AI-generated content calendar)
- ✅ Migrated `/api/calendar/[postId]/approve` (POST approve calendar post)
- ✅ Migrated `/api/calendar/[postId]` (PUT update, DELETE calendar post)
- ✅ Migrated `/api/calendar/[postId]/regenerate` (POST AI regeneration)
- ✅ Migrated `/api/calendar/generate` (POST AI calendar generation)
- **Subtotal**: 4 endpoints + 1 migration file (013)

**Total Session 3**: 4 endpoints + 1 migration file

**🎊 GRAND TOTAL: 25 endpoints + 6 migration files (008-013) + 1 fix 🎊**

---

## 🎯 Recommended Migration Order

### Phase 1: Email Infrastructure (4-6 hours)
1. `/api/email/webhook` ✅ (already have emails table)
2. `/api/email/oauth/callback` ✅
3. `/api/email/link` ✅

### Phase 2: Client Data Access (2-3 hours)
4. `/api/clients/[id]/emails` ✅ (simple query)
5. `/api/clients/[id]/sequences` ✅ (use drip_campaigns, campaign_enrollments)

### Phase 3: Calendar Foundation (6-8 hours) **COMPLEX**
6. Create `calendar_posts`, `marketing_personas`, `marketing_strategies` tables
7. `/api/calendar/[postId]/route.ts` ✅
8. `/api/calendar/[postId]/approve` ✅
9. `/api/calendar/generate` ⚠️ (requires significant refactoring)
10. `/api/calendar/[postId]/regenerate` ✅

### Phase 4: Image Generation (COMPLETE) ✅
11. Create `generated_images` table ✅ (011_generated_images.sql)
12. `/api/images/generate` ✅ (DALL-E 3 integration)
13. `/api/images/regenerate` ✅ (image versioning)
14. `/api/clients/[id]/images` ✅ (GET with filters)
15. `/api/clients/[id]/images/[imageId]` ✅ (GET + PATCH + DELETE)

### Phase 5: Sequences (COMPLETE) ✅
16. Create `drip_campaigns` tables ✅ (008_drip_campaigns.sql)
17. `/api/sequences/[id]` ✅ (GET, PUT, DELETE)
18. `/api/sequences/generate` ✅ (AI generation with Claude Sonnet 4)

### Phase 6: Subscriptions (COMPLETE) ✅
19. Create `subscriptions` table ✅ (012_subscriptions.sql with 3 tables)
20. `/api/subscription/[orgId]` ✅ (GET subscription details)
21. `/api/subscription/portal` ✅ (POST billing portal)
22. `/api/subscription/invoices` ✅ (GET billing history)
23. `/api/stripe/webhook` ✅ (webhook handler for 10 event types)

**Remaining Subscription Endpoints** (2):
24. `/api/subscription/cancel` - Cancel subscription
25. `/api/subscription/upgrade` - Upgrade/change subscription

### Phase 7: Demo & Misc (COMPLETE) ✅
26. `/api/demo/initialize` ✅ (POST, GET, DELETE)

---

## ⚠️ Migration Risks & Blockers

### High Risk Items
1. **Calendar Generation** (`/api/calendar/generate`)
   - Requires multiple new tables
   - Complex AI prompt logic depends on personas/strategies
   - May need product decision on feature scope

2. **Stripe Integration**
   - Need to verify Stripe webhook signatures
   - Billing logic must be bulletproof
   - Subscription state management is critical

3. **Data Migration**
   - If production Convex data exists, need migration strategy
   - No rollback plan for partially migrated data

### Blockers
1. **Missing Tables** - Must create 5+ new tables before migrating calendar/images
2. **Schema Uncertainty** - Some Convex collections may not have Supabase equivalents
3. **Testing** - No tests exist to verify migrations don't break functionality

---

## 🔧 Technical Debt Introduced

1. **Legacy Parameter Support**: `/api/email/send` supports both `contactId` and `clientId`
2. **No Data Validation**: Most endpoints lack input validation (Zod schemas needed)
3. **No Rate Limiting**: Only 5 endpoints have rate limiting
4. **Error Handling**: Inconsistent error responses across endpoints

---

## 📚 Resources

- **Supabase Schema**: `supabase/migrations/*.sql`
- **Convex Schema**: `convex/schema.ts`
- **Migration Tool**: Manual (no automated migration script)
- **Testing**: Manual testing only (no automated tests)

---

## 🚀 Next Steps

**Immediate** (Today):
1. ✅ Migrate `/api/email/webhook` (email sync is critical)
2. ✅ Migrate `/api/email/oauth/callback` (auth flow needed)

**Short-Term** (Week 1):
3. ✅ Create calendar-related tables
4. ✅ Migrate calendar CRUD endpoints (not generation yet)
5. ✅ Migrate client data access endpoints

**Medium-Term** (Week 2):
6. ✅ Migrate image generation
7. ✅ Migrate sequences
8. ✅ Migrate subscriptions

**Long-Term** (Post-MVP):
9. ⚠️ Decide on calendar generation feature scope
10. ✅ Complete any remaining low-priority endpoints
11. ✅ Remove Convex dependencies entirely

---

**Status**: Ready to continue migrations with `/api/email/webhook`
**Blocker**: Calendar feature requires product decisions on scope before full migration
**Overall Impact**: ~30% of application still non-functional until calendar/client endpoints migrated
