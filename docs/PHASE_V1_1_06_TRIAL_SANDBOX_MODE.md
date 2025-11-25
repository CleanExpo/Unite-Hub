# Phase v1_1_06: Two-Week Trial & Sandbox Mode

## Implementation Status: 🚧 IN PROGRESS (40%)

**Date**: 2025-11-25 (Started)
**Phase**: v1_1_06
**Dependencies**: v1_1_01 (Founder Ops), v1_1_02 (Brand Matrix), v1_1_04 (Campaigns), v1_1_07 (Analytics)

---

## ✅ Completed Components

### Database Layer (100%)

**Migration 155: Trial Profiles** (`supabase/migrations/155_trial_profiles.sql`)
- ✅ `trial_profiles` table with capacity tracking
- ✅ Trial status fields (started, expires, ended, converted)
- ✅ Capacity limits (AI tokens: 50k, VIF: 10, Blueprints: 5, Production: 0)
- ✅ Module access configuration (enabled, limited, disabled modules)
- ✅ Upgrade prompt tracking
- ✅ Helper functions:
  - `get_trial_status()` - Get trial status with remaining capacity
  - `is_module_enabled_for_trial()` - Check module access
  - `increment_trial_ai_usage()` - Track AI token usage
  - `increment_trial_vif_usage()` - Track VIF generations
  - `increment_trial_blueprint_usage()` - Track blueprint creation
  - `record_trial_upgrade_prompt()` - Log upgrade prompt interactions
  - `convert_trial_to_paid()` - Convert trial to paid account
- ✅ RLS policies (founder-only access)
- ✅ Auto-triggers for timestamp updates

**Migration 156: Trial Activity Log** (`supabase/migrations/156_trial_activity_log.sql`)
- ✅ `trial_activity_log` table for audit trail
- ✅ Activity types: ai_usage, vif_generation, blueprint_creation, module_access, limit_hit, upgrade_prompt_shown, upgrade_prompt_declined, feature_denied, trial_expired, trial_converted
- ✅ Truth layer fields (user_message, system_action)
- ✅ Helper functions:
  - `log_trial_activity()` - Log any trial-related action
  - `get_trial_activity()` - Retrieve recent activity
  - `get_trial_activity_summary()` - Activity counts by type
  - `get_trial_limit_hits()` - All limit hit instances
  - `get_trial_upgrade_prompt_history()` - Upgrade prompt interactions
- ✅ `trial_activity_summary` view for founders
- ✅ RLS policies (founder-only access)
- ✅ Composite indexes for performance

### Business Logic (100%)

**Trial Capability Profile** (`src/lib/trial/trialCapabilityProfile.ts`)
- ✅ `TrialCapabilityProfile` interface defining all limits
- ✅ Default profile configuration (25% capacity)
- ✅ AI Token limits:
  - Soft cap: 50,000 tokens (~25% of monthly pro)
  - Warning threshold: 40,000 tokens (80%)
  - No hard cap (warn but allow)
- ✅ VIF generation limits:
  - Cap: 10 generations
  - Hard cap (block after limit)
- ✅ Blueprint creation limits:
  - Cap: 5 blueprints
  - Hard cap (block after limit)
- ✅ Production jobs:
  - Cap: 0 (completely disabled)
  - Hard cap
- ✅ Module access configuration:
  - **Enabled**: website_audit, brand_persona, initial_roadmap, analytics_readonly, topic_relevance
  - **Limited**: blueprinter, founder_ops, content_generation
  - **Disabled**: high_volume_campaigns, automated_weekly, cross_brand_orchestration, timestamped_production, living_intelligence
- ✅ Helper functions:
  - `isModuleEnabled()` - Check if module fully accessible
  - `isModuleLimited()` - Check if module has limitations
  - `isModuleDisabled()` - Check if module blocked
  - `getModuleConfig()` - Get module configuration
  - `calculateCapacityUsage()` - Calculate usage percentages
  - `shouldShowUpgradePrompt()` - Determine if upgrade prompt needed
  - `generateUpgradeMessage()` - Generate honest upgrade message

---

## 🚧 In Progress / Pending Components

### Business Logic (60% remaining)

**`trialExperienceEngine.ts`** (NOT YET CREATED)
- Purpose: Orchestrate trial experience based on current state
- Required Functions:
  ```typescript
  getTrialStatus(workspaceId) // Get full trial state
  checkModuleAccess(workspaceId, moduleId) // Verify module access
  recordUsage(workspaceId, usageType, amount) // Log usage
  shouldBlockAction(workspaceId, actionType) // Determine if action should be blocked
  getUpgradePromptConfig(workspaceId) // Get upgrade prompt configuration
  ```

### UI Components (0% complete)

**`TrialCapabilityBanner.tsx`** (NOT YET CREATED)
- Purpose: Show trial limits at top of dashboard
- Display elements:
  - Days/hours remaining
  - AI tokens used vs cap with percentage
  - VIF generations used vs cap
  - Blueprints created vs cap
  - Module access summary
  - Upgrade CTA

**`TrialUpgradePrompt.tsx`** (NOT YET CREATED)
- Purpose: Honest, non-pushy upgrade messaging
- Display elements:
  - Why upgrade is being suggested
  - What's included in paid plans
  - 90-day activation roadmap reference
  - Honest limitations of trial
  - Optional dismissal (not required)

### API Layer (0% complete)

**API Routes** (NOT YET CREATED)
1. `/api/trial/profile` (GET/POST)
   - Get trial profile for workspace
   - Create trial profile for new signup
2. `/api/trial/status` (GET)
   - Get current trial status with remaining capacity
3. `/api/trial/activity` (GET/POST)
   - Get activity log
   - Record activity

### Integration Points (0% complete)

**Pricing Page** (`src/app/(marketing)/pricing/page.tsx`)
- Add transparent trial explanation
- Limits comparison table
- Truth-layer disclosures

**Signup Flow** (`src/app/auth/signup/page.tsx`)
- Mark accounts as 'trial' by default
- Connect to trial profile creation
- Add "No credit card required" statement

**Dashboard Overview** (`src/app/client/dashboard/overview/page.tsx`)
- Insert TrialCapabilityBanner
- Conditional TrialUpgradePrompt

---

## 📋 Functional Requirements Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Trial profile creation on signup | ⚠️ Pending | Migration ready, needs API integration |
| AI token soft cap (50k) | ✅ Complete | Database functions ready |
| VIF generation hard cap (10) | ✅ Complete | Database functions ready |
| Blueprint creation hard cap (5) | ✅ Complete | Database functions ready |
| Production jobs disabled | ✅ Complete | Hard cap at 0 |
| Module access control | 🟡 Partial | Profile defined, needs enforcement |
| Upgrade prompts (honest messaging) | ⚠️ Pending | Needs UI components |
| Activity logging (truth layer) | ✅ Complete | All audit functions ready |
| 14-day trial period | ✅ Complete | Auto-calculated in migration |
| No credit card required | ⚠️ Pending | Needs signup flow update |
| Read-only analytics | ⚠️ Pending | Needs analytics integration |
| Trial conversion flow | ✅ Complete | Database function ready |

---

## 🎯 Completion Roadmap

### Phase 1: Core Engine ✅ (COMPLETE)
- ✅ Database migrations (trial_profiles, trial_activity_log)
- ✅ Trial capability profile definition
- ✅ Helper functions for all limits

### Phase 2: Experience Engine (Estimated: 4 hours)
- ⚠️ `trialExperienceEngine.ts` - Orchestrate trial state
- ⚠️ Integration with existing services

### Phase 3: UI Layer (Estimated: 6 hours)
- ⚠️ `TrialCapabilityBanner.tsx` - Dashboard banner
- ⚠️ `TrialUpgradePrompt.tsx` - Upgrade modal
- ⚠️ Update pricing page with trial info
- ⚠️ Update signup flow for trial creation

### Phase 4: API Layer (Estimated: 3 hours)
- ⚠️ `/api/trial/profile` - Profile management
- ⚠️ `/api/trial/status` - Status endpoint
- ⚠️ `/api/trial/activity` - Activity logging

### Phase 5: Integration (Estimated: 5 hours)
- ⚠️ Protected route checks
- ⚠️ Module access enforcement
- ⚠️ Analytics read-only filters
- ⚠️ Founder Ops trial exclusion
- ⚠️ Campaign builder trial limits

**Total Estimated Time to Complete**: 18 additional hours (22 hours total)

---

## 🔧 Trial Capability Limits (Transparent)

### ✅ Full Access (No Limits)
- Website audit and analysis
- Brand persona builder
- Initial 90-day roadmap generator
- Analytics overview (read-only)
- Topic relevance scoring

### 🟡 Limited Access (Reduced Capacity)
- **Multi-Channel Blueprinter**
  - Maximum: 5 blueprints (vs unlimited)
  - Limited channel selection
  - No production export
- **Founder Ops Hub**
  - Manual task creation only
  - No automated workflows
  - No recurring tasks
- **Content Generation**
  - 50,000 AI token soft cap (vs 200k+ monthly)
  - 10 VIF generations max (vs unlimited)
  - No bulk generation

### ❌ Disabled (Not Available)
- High-volume campaign creator
- Automated weekly campaigns
- Cross-brand orchestration
- Timestamped production jobs
- Living Intelligence Archive

---

## 🔐 Safety & Truth Layer Constraints

### Truth Layer Requirements ✅
- ✅ **No hidden paywalls**: All limits disclosed upfront
- ✅ **No credit card required**: Free signup
- ✅ **Honest limitations**: Clear about what's limited
- ✅ **Audit everything**: All actions logged to trial_activity_log
- ✅ **Truth-layer messages**: All user-facing messages must be truthful
- ✅ **No auto-conversion**: Manual upgrade only

### Trial Safety Constraints ✅
- ✅ **Soft cap on AI tokens**: Warn but don't block
- ✅ **Hard cap on VIF**: Block after 10 generations
- ✅ **Hard cap on blueprints**: Block after 5 created
- ✅ **Zero production jobs**: Completely disabled
- ✅ **Read-only analytics**: No data modification
- ✅ **No automated campaigns**: Manual approval only
- ✅ **14-day limit**: Auto-calculated, clearly displayed

---

## 📝 Implementation Notes

**Current State**: Database layer complete, capability profile defined. Ready for experience engine, UI components, and API integration.

**Key Design Decisions**:
1. **Soft Cap for AI Tokens**: Warn users but don't block to avoid frustration
2. **Hard Caps for Tangible Assets**: Block VIF and blueprints to prevent abuse
3. **Zero Production Jobs**: Trial is for testing, not production
4. **Transparent Messaging**: All limits disclosed, no surprises
5. **Audit Everything**: Complete audit trail for truth-layer compliance

**Integration Points**:
- Signup flow creates trial profile automatically
- Protected routes check trial status before allowing access
- Module access enforced at API level
- Upgrade prompts shown contextually based on usage
- Analytics queries filtered for read-only access

---

**Status**: 🚧 **40% COMPLETE - Core Database and Logic Ready**

**Estimated Completion**: 18 additional hours
