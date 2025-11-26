# Synthex.social MVP v1 – Final Orchestrated Build Plan

**Date**: 2025-11-26
**Status**: 🚀 **IN PROGRESS – Phase 1 (Landing Page)**
**Build Version**: MVP v1.0.0
**Target Completion**: ~1 week (6 development days)

---

## Executive Summary

This is the **final orchestration plan** to ship Synthex.social MVP v1. The project unifies:

- **Landing Page UX**: Conversion-focused for REAL small businesses (trades, local services, non-profits)
- **AI Visual & Video Generation**: Gemini 3 + Nano Banana 2 (layout, imagery) + VEO (videos)
- **SEO Intelligence Engine**: Unified DataForSEO + SEMrush dashboard panel
- **Test/Live Mode Toggle**: Safe Stripe + SEO provider switching for founders
- **Agent Orchestration**: 6 specialized agents (designer, visual, video, SEO, system, prompt architect)

### Acceptance Criteria

✅ **MVP v1 is DONE when:**

1. Admin + customer flows work end-to-end with real Stripe test mode
2. Landing page is on-brand, conversion-focused for REAL small businesses
3. Live discount counters display from DB (50 @ 50% off, 50 @ 25% off)
4. Stripe test/live toggle exists for founders only
5. SEO Intelligence panel (DataForSEO + SEMrush) runs in live dashboard
6. Visual/video/graphics pipelines wired into visual orchestrator (Gemini/Nano/VEO)
7. All new code passes TypeScript checks & app builds successfully
8. No breaking changes to RBAC, existing Synthex, or Unite-Hub features

---

## Project Structure

### Source of Truth Documents

```
d:\Unite-Hub\
├── CLAUDE.md                                    # System config
├── .claude/claude.md                            # Agent definitions
├── .claude/agents.md                            # Agent orchestration (to be created)
├── .claude/skills.md                            # Skill definitions (to be created)
├── PHASE_0_SYNTHEX_BLUEPRINT.md                 # Original vision
├── PHASE_8_README.md                            # Governance & Parallel Phill
├── SYNTHEX_DEPLOYMENT_GUIDE.md                  # Deployment procedures
├── SYNTHEX_MVP_V1_ORCHESTRATION.md              # THIS FILE
└── [20+ RBAC documentation files]
```

### Code Repositories

```
src/
├── app/                                         # Next.js App Router
│   ├── page.tsx                                 # Root landing page (TO REVAMP – Phase 1)
│   ├── synthex/                                 # Synthex tenant routes
│   │   ├── dashboard/page.tsx                   # Customer dashboard
│   │   └── onboarding/page.tsx
│   ├── founder/                                 # Founder-only routes
│   │   ├── synthex-media/page.tsx              # Video/visual gen control (Phase 3)
│   │   └── system-mode/page.tsx                 # Test/Live toggle (Phase 5)
│   └── api/
│       ├── synthex/                            # Synthex-specific endpoints
│       │   ├── offer/route.ts                   # Discount offer engine
│       │   └── seo/analyze/route.ts             # SEO analysis endpoint (Phase 4)
│       └── [100+ other routes]
├── lib/
│   ├── seo/                                     # SEO Intelligence (Phase 4)
│   │   ├── semrushClient.ts                     # SEMrush integration
│   │   ├── dataforseoClient.ts                  # DataForSEO integration
│   │   └── seoIntelligenceEngine.ts             # Unified engine
│   ├── orchestrators/
│   │   ├── visualOrchestrator.ts                # Visual generation (Phase 2)
│   │   └── videoOrchestrator.ts                 # Video generation (Phase 3)
│   ├── bridges/
│   │   ├── nanoBananaBridge.ts                  # Nano Banana 2 integration
│   │   ├── veo3Bridge.ts                        # VEO integration
│   │   └── gemini3Bridge.ts                     # Gemini 3 integration
│   └── system/
│       └── systemModeService.ts                 # Test/Live mode (Phase 5)
├── components/
│   ├── seo/
│   │   └── SeoAnalysisPanel.tsx                 # SEO dashboard widget (Phase 4)
│   └── [100+ other components]
└── orchestrators/
    └── [Agent-specific prompt templates]
```

---

## 6-Phase Implementation Plan

### Phase 1: Landing Page UX + Branding Overhaul (48 hours)

**Owner**: `designer_agent`

**Goals**:
- Transform landing page to speak directly to REAL small businesses
- Implement tagline: "Finally, an AI platform built for REAL small businesses."
- Surface live offer counters (50 @ 50% off, 50 @ 25% off)
- Create conversion-focused CTAs

**Deliverables**:

1. **P1-T1**: Revamp `src/app/page.tsx`
   - [ ] New hero section with small-business tagline
   - [ ] "Who we help" band: trades, local services, non-profits, coaches, eCom
   - [ ] "The Problem" section (fragmented tools, high costs, confusing AI)
   - [ ] "How Synthex Works" (4 steps: Connect, Diagnose, Generate, Launch)
   - [ ] "What you get" grid (website, SEO, social, AI, reporting)
   - [ ] Trust elements (Phill/CARSI quote + DRQ context)
   - [ ] Pricing teaser with live offer counter integration
   - [ ] Primary CTA: "Start my AI marketing trial" + Secondary: "See how it works"

2. **P1-T2**: Update `src/components/layout/Header.tsx` (optional)
   - [ ] Clear nav: How it works, Pricing, Login
   - [ ] Distinguish Login as prominent button
   - [ ] Mobile menu support

3. **P1-T3**: Create discount counter component
   - [ ] Wire to `/api/synthex/offer/summary`
   - [ ] Show "X of 50 Launch Founder spots left at 50% off"
   - [ ] Gracefully hide if slots consumed
   - [ ] Update in real-time

**Acceptance Tests**:
- `npm run lint && npm run build` passes
- Root route (/) renders new landing page
- No console errors
- Discount counters reflect real DB values
- Hero copy clearly targets small businesses (not generic "enterprise")
- Mobile responsive

**Timeline**: ~48 hours (designer_agent)

---

### Phase 2: Visual & Layout Orchestration (48 hours)

**Owner**: `branding_visual_agent`

**Goals**:
- Use Gemini 3 + Nano Banana 2 to generate hero images, backgrounds, layouts, graphs
- Extend visual orchestrator with Synthex-specific pipelines
- Enable on-demand visual generation for landing page and dashboards

**Deliverables**:

1. **P2-T1**: Extend `src/orchestrators/visualOrchestrator.ts`
   - [ ] Add pipelines: `synthex_landing_hero`, `synthex_section_backgrounds`, `synthex_stats_graphics`, `synthex_social_carousels`
   - [ ] Each pipeline accepts `brand_context` (Synthex messaging, colours) + `usage_context` (hero, section, stat, etc.)
   - [ ] Outputs structured image descriptors, not binary
   - [ ] Strong TypeScript types (no `any`)

2. **P2-T2**: Update `src/bridges/nanoBananaBridge.ts`
   - [ ] Add intent enums: `synthex_landing`, `synthex_social`, `synthex_stats`
   - [ ] Support `gemini_prompt_hint` from content agents
   - [ ] Maintain backward compatibility

3. **P2-T3**: Integrate into landing page
   - [ ] Call visual orchestrator for hero image
   - [ ] Use generated backgrounds for sections
   - [ ] Wire Gemini 3 prompts for content-aware layouts

**Acceptance Tests**:
- Visual orchestrator pipelines are callable and return typed results
- No breaking changes to existing visual bridges
- Gemini 3 + Nano Banana 2 integration is cost-tracked and logged
- Landing page uses generated visuals (where appropriate)

**Timeline**: ~48 hours (branding_visual_agent)

---

### Phase 3: Video Creation & Editing (56 hours)

**Owner**: `video_agent`

**Goals**:
- Create minimal but powerful video pipeline for Synthex marketing
- Use Gemini 3 (scripts, shot lists) + VEO (video generation/editing)
- Expose founder control panel for asset generation

**Deliverables**:

1. **P3-T1**: Create `src/orchestrators/videoOrchestrator.ts`
   - [ ] Functions: `generateSynthexExplainerVideo()`, `generateCustomerTestimonialStoryboard()`, `generateSocialTeaserReel()`
   - [ ] Gemini 3 drafts scripts + scene breakdowns
   - [ ] VEO generates/edits video segments
   - [ ] Returns structured JSON (script, shots, asset refs; NOT binary video)
   - [ ] Wire into `veo3Bridge.ts` with cost-aware logging

2. **P3-T2**: Create `src/app/founder/synthex-media/page.tsx`
   - [ ] Founder-only route (guarded by RBAC)
   - [ ] Select video type: Explainer, Testimonial, Social Teaser
   - [ ] Display script + storyboard output
   - [ ] NOT a full video editor; just control center

3. **P3-T3**: Integrate into founder dashboard
   - [ ] Add "Media Generation" section
   - [ ] Link to synthex-media page
   - [ ] Show recent generated assets

**Acceptance Tests**:
- Video orchestrator is callable with typed inputs/outputs
- Founder page is guarded and accessible to Phill + team only
- Gemini 3 + VEO integration is logged and cost-tracked
- Video assets are stored with metadata (script, shots, usage)

**Timeline**: ~56 hours (video_agent)

---

### Phase 4: SEO Intelligence Engine (40 hours)

**Owner**: `seo_intelligence_agent`

**Goals**:
- Unify DataForSEO + SEMrush into single SEO analysis engine
- Expose SeoAnalysisPanel in Synthex dashboard for admins
- Enable keyword research, competitor analysis, opportunity discovery

**Deliverables**:

1. **P4-T1**: Create `supabase/migrations/261_seo_providers.sql`
   - [ ] Table: `seo_providers` (id, provider_name, mode, enabled, config, created_at, updated_at)
   - [ ] Seed: dataforseo, semrush
   - [ ] RLS: Admin/founder only

2. **P4-T2**: Create/update `src/lib/seo/semrushClient.ts`
   - [ ] Support: `phrase_kdi`, `domain_overview`, `phrase_related`
   - [ ] Use `SEMRUSH_API_KEY` from env (no hardcoded keys)
   - [ ] Parse pipe-delimited CSV → typed objects
   - [ ] PQueue rate-limiter (concurrency + backoff)

3. **P4-T3**: Create/update `src/lib/seo/seoIntelligenceEngine.ts`
   - [ ] `runSeoAnalysis({ keyword, domain, mode, country }) => unified result`
   - [ ] Call both DataForSEO + SEMrush, merge results
   - [ ] Compute: difficulty, search_volume, cpc, opportunities, reliability_score
   - [ ] Handle degraded ops (one provider fails, still return partial data)

4. **P4-T4**: Create `src/app/api/seo/analyze/route.ts`
   - [ ] POST endpoint; JSON: { keyword, domain, mode? }
   - [ ] Verify caller is admin/founder
   - [ ] Return JSON with strong typing
   - [ ] Simple error codes for invalid input or provider failure

5. **P4-T5**: Create `src/components/seo/SeoAnalysisPanel.tsx`
   - [ ] Inputs: keyword, domain, optional country
   - [ ] Button to trigger analysis
   - [ ] Results: difficulty, volume, CPC, related keywords, recommended move
   - [ ] Admin/founder only

6. **P4-T6**: Mount panel in Synthex dashboard
   - [ ] `src/app/synthex/dashboard/page.tsx` includes SeoAnalysisPanel
   - [ ] Visible to admins/founders; hidden from customers
   - [ ] Responsive layout

**Acceptance Tests**:
- Migration runs without errors
- SEMrush + DataForSEO clients callable and typed
- API endpoint returns proper error codes (400, 401, 403, 500)
- SeoAnalysisPanel integrates smoothly into dashboard
- Real SEO data is returned (not hardcoded)

**Timeline**: ~40 hours (seo_intelligence_agent)

---

### Phase 5: Test/Live Mode Toggle (24 hours)

**Owner**: `system_agent`

**Goals**:
- Implement safe test/live mode toggle for Stripe and SEO providers
- Visible only to founders (Phill, Rana)
- Ensure no test keys leak into production

**Deliverables**:

1. **P5-T1**: Create `supabase/migrations/262_system_mode_flags.sql`
   - [ ] Table: `system_settings` (id, key, value, updated_by, updated_at)
   - [ ] Seed: stripe_mode='test', seo_mode='test'
   - [ ] RLS: Founders only can modify; broader read if needed

2. **P5-T2**: Create `src/lib/system/systemModeService.ts`
   - [ ] `getStripeMode()`, `setStripeMode(mode)`
   - [ ] `getSeoMode()`, `setSeoMode(mode)`
   - [ ] Mode: 'test' | 'live' only (typed guards)
   - [ ] Supabase client under hood with error handling

3. **P5-T3**: Wire Stripe client to respect mode
   - [ ] Update `src/lib/payments/stripeClient.ts`
   - [ ] If mode=test, use `STRIPE_TEST_SECRET_KEY`
   - [ ] If mode=live, use `STRIPE_LIVE_SECRET_KEY`
   - [ ] No hardcoded keys; all from env
   - [ ] Hidden from customers; visible to founders

4. **P5-T4**: Wire SEO providers to respect mode
   - [ ] Update `src/lib/seo/seoIntelligenceEngine.ts`
   - [ ] If seo_mode=test, use test credentials/low-volume queries
   - [ ] If seo_mode=live, full capabilities
   - [ ] Log mode in structured way

5. **P5-T5**: Create `src/app/founder/system-mode/page.tsx`
   - [ ] Founders-only route (guarded by RBAC)
   - [ ] Show current Stripe + SEO modes
   - [ ] Toggle controls with confirmation modals
   - [ ] Persist updates via systemModeService
   - [ ] Success/error toasts

**Acceptance Tests**:
- Migrations run without errors
- systemModeService is callable and typed
- Stripe + SEO clients respect current mode
- Founder page is guarded and accessible to Phill + Rana only
- Mode switches are logged and auditable
- No test keys exposed in production

**Timeline**: ~24 hours (system_agent)

---

### Phase 6: Prompt & Agent Orchestration (32 hours)

**Owner**: `prompt_architect_agent`

**Goals**:
- Document agent orchestration patterns
- Create reusable prompt templates for design, video, SEO, visual tasks
- Align with Anthropic Developer Docs and claude.md

**Deliverables**:

1. **P6-T1**: Create `.claude/agents.md`
   - [ ] Define: designer_agent, branding_visual_agent, video_agent, seo_intelligence_agent, system_agent, prompt_architect_agent
   - [ ] For each: role, goals, tools, example tasks, success metrics
   - [ ] Reference this MVP plan as baseline
   - [ ] Align with Anthropic orchestration patterns

2. **P6-T2**: Create `.claude/skills.md`
   - [ ] Skill templates for visual generation (Gemini 3, Nano Banana)
   - [ ] Skill templates for video generation (Gemini 3, VEO)
   - [ ] Skill templates for SEO analysis (DataForSEO, SEMrush)
   - [ ] Skill templates for landing page optimization
   - [ ] Default flavour: "small business, trades, restoration, local service"
   - [ ] Docs on calling visualOrchestrator, videoOrchestrator, seoIntelligenceEngine

3. **P6-T3**: Update `.claude/claude.md`
   - [ ] Add references to new Gemini 3, Nano Banana 2, VEO, DataForSEO, SEMrush integrations
   - [ ] Document environment variables (test/live modes)
   - [ ] Document cost tracking and logging patterns
   - [ ] Link to Phase 8 governance and parallel Phill behaviour

4. **P6-T4**: Create `docs/SYNTHEX_MVP_V1_AGENT_GUIDE.md`
   - [ ] For developers implementing agent tasks:
   - [ ] How to trigger visual generation
   - [ ] How to trigger video generation
   - [ ] How to run SEO analysis
   - [ ] How to switch test/live modes
   - [ ] Cost estimation and logging

**Acceptance Tests**:
- `.claude/agents.md` documents all 6 agents with clear examples
- `.claude/skills.md` provides reusable prompt templates
- Developers can follow guides to use orchestrators without ambiguity
- All docs link to source of truth and maintain alignment with Anthropic patterns

**Timeline**: ~32 hours (prompt_architect_agent)

---

## Parallel Work Opportunities

While implementing these phases, the following can proceed in parallel (with proper dependency management):

- **Phase 1** (landing page) can proceed simultaneously with **Phase 2** (visual generation), as visual generation does not block landing page content
- **Phase 3** (video) and **Phase 4** (SEO) can proceed in parallel with Phases 1–2
- **Phase 5** (test/live toggle) can be started once Phases 3–4 have their API endpoints defined
- **Phase 6** (orchestration docs) can progress incrementally as each phase completes

### Recommended Execution Timeline

| Phase | Start | End | Duration | Owner | Parallel With |
|-------|-------|-----|----------|-------|---------------|
| **Phase 1** | Day 1 | Day 3 | 48h | designer_agent | Phase 2 |
| **Phase 2** | Day 1 | Day 3 | 48h | branding_visual_agent | Phase 1 |
| **Phase 3** | Day 2 | Day 4 | 56h | video_agent | Phases 4–5 |
| **Phase 4** | Day 2 | Day 4 | 40h | seo_intelligence_agent | Phase 3 |
| **Phase 5** | Day 4 | Day 5 | 24h | system_agent | Phases 1–4 |
| **Phase 6** | Day 1 | Day 6 | 32h | prompt_architect_agent | All phases |

**Total**: ~1 week (with careful parallelization)

---

## Critical Constraints & Dependencies

### Non-Goals

❌ Do not break existing Synthex or Unite-Hub features
❌ Do not change RBAC semantics or database RLS
❌ Do not hardcode API keys or secrets
❌ Do not create placeholder UI without real data wiring
❌ Do not introduce circular imports or build failures

### Key Dependencies

| Phase | Depends On | Notes |
|-------|-----------|-------|
| Phase 1 | synthexOfferEngine.ts, offer/summary API | Landing page must integrate live offer counters |
| Phase 2 | nanoBananaBridge.ts, gemini3Bridge.ts | Visual orchestrator must be functional |
| Phase 3 | veo3Bridge.ts, videoOrchestrator.ts | VEO integration must be cost-aware |
| Phase 4 | DataForSEO + SEMrush API keys in env | Both providers must be configured |
| Phase 5 | Stripe + SEO providers working | Mode toggle must not break existing flows |
| Phase 6 | Phases 1–5 complete | Documentation should reflect final implementation |

### Environment Variables Required

```env
# Already configured (from previous setup)
SEMRUSH_API_KEY=<key>
DATAFORSEO_API_KEY=<key>
STRIPE_TEST_SECRET_KEY=<key>
STRIPE_LIVE_SECRET_KEY=<key>
GEMINI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>

# New (Phase 5)
SYSTEM_MODE=test|live  # Default: test

# New (Phase 3)
NANO_BANANA_API_KEY=<key>  # If not already set
VEO_API_KEY=<key>          # If not already set
```

---

## Success Metrics

### Build Quality

- ✅ `npm run lint` passes
- ✅ `npm run build` succeeds (exit 0, 0 TypeScript errors)
- ✅ No warnings in build output (RBAC-specific)
- ✅ All new code has proper TypeScript types (no `any`)

### Feature Completeness

- ✅ Landing page speaks to real small businesses
- ✅ Live offer counters display from DB
- ✅ Stripe test mode flows end-to-end
- ✅ SEO analysis panel returns real data
- ✅ Video/visual generation runs without errors
- ✅ Test/live toggle accessible to founders only

### User Experience

- ✅ Landing page is mobile responsive
- ✅ No visual glitches or layout shifts
- ✅ SEO panel loads within 2 seconds
- ✅ Video generation provides clear feedback
- ✅ Test/live toggle has confirmation modals

### Security & Compliance

- ✅ RBAC guards all founder-only pages
- ✅ No test API keys in production builds
- ✅ All API calls logged and auditable
- ✅ Cost tracking enabled for all AI model calls

---

## Rollout Plan

### Stage 1: Internal Testing (Day 6–7)

- Phill + Rana test all MVP v1 features
- Verify Stripe test mode with real test cards
- Run SEO analysis with sample keywords
- Generate sample marketing videos
- Test landing page on multiple devices

### Stage 2: Stakeholder Review (Day 7–8)

- DRQ stakeholders review landing page messaging
- CARSI team provides feedback on small-business relevance
- Approve visual + video assets
- Sign off on pricing strategy

### Stage 3: Beta Deployment (Day 8)

- Deploy to production with feature flags (if available)
- Monitor error logs and Sentry
- Gradual rollout to early-access customers

### Stage 4: Full Launch (Day 9+)

- Full production deployment
- Marketing campaign activation
- Monitor conversion metrics and SEO data
- Iterate based on customer feedback

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Build failures in Phase 2** | Blocks visual generation | Ensure nanoBananaBridge tests pass before merging |
| **Stripe test/live confusion** | Real charges on test | Double-check mode toggle logic; add confirmation modals |
| **SEO API rate limits** | Dashboard hangs | Implement PQueue with proper backoff; test with load |
| **Video generation costs** | Unexpected bills | Log all VEO calls; set usage alerts in Anthropic dashboard |
| **RBAC bypass in Phase 5** | Security issue | Re-verify getUserRole() on all founder-only routes |
| **Database migration failure** | Data loss risk | Test migrations on staging first; have rollback plan |

---

## Deliverables Checklist

### Code Deliverables

- [ ] `src/app/page.tsx` (revamped landing page)
- [ ] `src/components/layout/Header.tsx` (updated nav)
- [ ] `src/components/discount-counter/OfferCounter.tsx` (new)
- [ ] `src/orchestrators/visualOrchestrator.ts` (extended)
- [ ] `src/bridges/nanoBananaBridge.ts` (updated)
- [ ] `src/orchestrators/videoOrchestrator.ts` (new)
- [ ] `src/app/founder/synthex-media/page.tsx` (new)
- [ ] `src/lib/seo/semrushClient.ts` (new)
- [ ] `src/lib/seo/seoIntelligenceEngine.ts` (updated)
- [ ] `src/app/api/seo/analyze/route.ts` (new)
- [ ] `src/components/seo/SeoAnalysisPanel.tsx` (new)
- [ ] `src/lib/system/systemModeService.ts` (new)
- [ ] `src/app/founder/system-mode/page.tsx` (new)
- [ ] `supabase/migrations/261_seo_providers.sql` (new)
- [ ] `supabase/migrations/262_system_mode_flags.sql` (new)

### Documentation Deliverables

- [ ] `.claude/agents.md` (new)
- [ ] `.claude/skills.md` (new)
- [ ] `.claude/claude.md` (updated with Phase 2–5 references)
- [ ] `docs/SYNTHEX_MVP_V1_AGENT_GUIDE.md` (new)
- [ ] `SYNTHEX_MVP_V1_ORCHESTRATION.md` (this file)

### Test & Verification Deliverables

- [ ] Landing page load test (mobile + desktop)
- [ ] Offer counter integration test
- [ ] Stripe test mode end-to-end test
- [ ] SEO analysis API test
- [ ] Video generation cost tracking test
- [ ] Test/live mode toggle verification test

---

## Post-Launch Roadmap (Phase 7+)

Once MVP v1 ships, future phases may include:

- **Phase 7**: Advanced A/B testing for landing page copy + visuals
- **Phase 8**: Ahrefs/Moz integration for SEO Intelligence
- **Phase 9**: AI-powered landing page generation (auto-create variants)
- **Phase 10**: Video testimonial scripting from customer interviews
- **Phase 11**: Automated SEO opportunity alerts
- **Phase 12**: Billing portal enhancements (custom invoices, reporting)

---

## Contact & Escalation

**Orchestrator Agent**: Coordinates all phases
**Designer Agent**: Phase 1 lead
**Branding Visual Agent**: Phase 2 lead
**Video Agent**: Phase 3 lead
**SEO Intelligence Agent**: Phase 4 lead
**System Agent**: Phase 5 lead
**Prompt Architect Agent**: Phase 6 lead

For blockers or dependencies, raise with orchestrator agent.

---

**Generated**: 2025-11-26
**Status**: 🚀 IN PROGRESS (Phase 1)
**Next Update**: Daily progress reports
**Estimated Completion**: ~1 week

---

## Quick Navigation

- [Phase 1 Details](#phase-1-landing-page-ux--branding-overhaul-48-hours)
- [Phase 2 Details](#phase-2-visual--layout-orchestration-48-hours)
- [Phase 3 Details](#phase-3-video-creation--editing-56-hours)
- [Phase 4 Details](#phase-4-seo-intelligence-engine-40-hours)
- [Phase 5 Details](#phase-5-testlive-mode-toggle-24-hours)
- [Phase 6 Details](#phase-6-prompt--agent-orchestration-32-hours)
- [Parallel Work](#parallel-work-opportunities)
- [Success Metrics](#success-metrics)
- [Rollout Plan](#rollout-plan)
