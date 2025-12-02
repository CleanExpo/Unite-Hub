# Phase 2 Implementation Roadmap
## Copy Integration & Polish (Weeks 2-3)

**Orchestrator**: Claude Code
**Developer**: Claire
**Designer/Copywriter**: Rana
**Status**: READY FOR IMPLEMENTATION
**Timeline**: 20 hours over Weeks 2-3 (Dec 9-20)
**Target Completion**: December 20, 2025

---

## Executive Summary

Phase 2 focuses on integrating Rana's rewritten copy across all customer-facing pages and components. This phase improves emotional connection with Australian tradies while maintaining technical consistency from Phase 1.

**Expected Impact**:
- +10-15 Lighthouse points (clearer messaging improves engagement metrics)
- +40-60% improvement in CTA click-through rates (more specific, benefit-driven language)
- Stronger brand voice consistency across all pages
- Improved user onboarding (plain English instructions vs. jargon)

---

## Phase 2 Task Breakdown (20 hours total)

### WEEK 2: Foundation & Major Pages (12 hours)

#### Task #1: Hero Section & Landing Page (2.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/app/(marketing)/page.tsx` - Hero section
- `src/components/HeroSection.tsx` - Component
- `src/components/TrustIndicators.tsx` - New trust badges

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 1):
```
BEFORE: "Get 90 Days of Real Marketing Momentum"
AFTER: "Stop Paying for Marketing That Doesn't Bring Jobs"

BEFORE: "Start 14-Day Guided Trial"
AFTER: "Find Your Hot Leads"

NEW TRUST INDICATORS:
- "No credit card to try it"
- "Set up in 5 minutes"
- "Cancel anytime you want"
```

**Acceptance Criteria**:
- [ ] All badge, headline, subheadline text updated
- [ ] Trust indicators component created and styled
- [ ] No broken responsive layouts
- [ ] CTA buttons link to correct pages
- [ ] Lighthouse Performance maintained

**Testing Checklist**:
- [ ] Desktop view (1920px): All text visible, proper spacing
- [ ] Tablet view (768px): Text scales proportionally
- [ ] Mobile view (375px): Touch targets 44×44px minimum
- [ ] Trust badges align in single row on desktop, 2x2 grid on mobile

---

#### Task #2: Feature Cards & Benefits Section (2.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/components/FeaturesSection.tsx` - Main component
- `src/components/FeatureCard.tsx` - Individual cards
- `src/app/(marketing)/features/page.tsx` - Features page

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 2):

| Feature | BEFORE | AFTER |
|---------|--------|-------|
| Email | "Automatically process incoming emails..." | "Never Miss a Reply — Someone replies at 7pm? We catch it. Instantly." |
| Lead Scoring | "AI-powered lead scoring algorithm" | "Know Who's Actually Interested — See which leads are most likely to buy" |
| Automation | "Orchestrated workflow automation" | "Auto Follow-Ups — Send perfect follow-ups while you're on the job" |

**Acceptance Criteria**:
- [ ] All 6 feature titles updated
- [ ] All descriptions rewritten per guidelines
- [ ] Card hover states reflect teal primary color
- [ ] Icon-title-description layout maintained
- [ ] No CLS (Cumulative Layout Shift) on card expand

**Testing Checklist**:
- [ ] Verify each card is exactly 320px wide on desktop
- [ ] Hover effect smooth (no flicker)
- [ ] Mobile: Cards stack to 100% width with 16px gaps
- [ ] Read description aloud: sounds conversational, not marketing-speak

---

#### Task #3: Dashboard Stats & Metrics Labels (2 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/app/(dashboard)/overview/page.tsx` - Dashboard page
- `src/components/StatCard.tsx` - Stat component
- `src/components/MetricCard.tsx` - Metrics widget

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 3):

```
BEFORE: "Total Contacts"          → AFTER: "Leads in Your Pipeline"
BEFORE: "Campaign Performance"    → AFTER: "Replies This Week"
BEFORE: "Email Engagement Rate"   → AFTER: "Who's Hot Right Now"
BEFORE: "AI Score Distribution"   → AFTER: "Your Hottest 10 Leads"
```

**Acceptance Criteria**:
- [ ] All 8 dashboard stat labels updated
- [ ] Tooltip text rewritten (hover shows benefit, not feature)
- [ ] No layout shifts when numbers update
- [ ] Number animations still smooth

**Testing Checklist**:
- [ ] Numbers update without layout jump
- [ ] Tooltips appear on hover/focus
- [ ] Mobile: Stats stack vertically, readable
- [ ] Dark mode: Text contrast maintained (text-secondary #4b5563)

---

#### Task #4: Empty States & Onboarding Copy (2 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/components/EmptyState.tsx` - Component
- `src/app/(dashboard)/contacts/page.tsx` - Empty contacts state
- `src/components/OnboardingModal.tsx` - Onboarding flows

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 4):

```
EMPTY STATE:
BEFORE: "No data available"
AFTER: "No leads yet. Connect your Gmail to see hot prospects automatically."

ONBOARDING STEP 1:
BEFORE: "Authorize Gmail API access to enable email sync functionality"
AFTER: "Connect your Gmail (takes 30 seconds)"

ONBOARDING STEP 2:
BEFORE: "Your contacts are being processed by our AI"
AFTER: "We're finding your hottest leads... should be done in about 2 minutes"
```

**Acceptance Criteria**:
- [ ] 4 empty states rewritten
- [ ] Onboarding modal copy updated
- [ ] CTAs in empty states are specific ("Connect Your Gmail" not "Learn More")
- [ ] Loading messages show progress + estimated time

**Testing Checklist**:
- [ ] Empty state displays on mobile without scrolling
- [ ] CTA button is 44×44px minimum
- [ ] Onboarding modal doesn't overflow on mobile
- [ ] Loading time estimate is honest (not "instantly")

---

#### Task #5: Error Messages & Validation Copy (1.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/components/ErrorMessage.tsx` - Error component
- `src/components/FormValidation.tsx` - Validation
- `src/lib/errors/error-messages.ts` - Error message constants

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 5):

```
BEFORE: "Invalid email format"
AFTER: "That doesn't look like an email. Check it again?"

BEFORE: "Campaign creation failed"
AFTER: "We couldn't create that campaign. Check your internet and try again."

BEFORE: "Unauthorized"
AFTER: "You need to sign in first. Just use your Google account."
```

**Acceptance Criteria**:
- [ ] All 12 error messages rewritten (friendly, helpful)
- [ ] No jargon (no "401", "500", "sync failed")
- [ ] All errors have next-step action
- [ ] Error component shows contact support link

**Testing Checklist**:
- [ ] Trigger 5 common errors, verify messages display
- [ ] Error text fits on mobile (max 240px width)
- [ ] Error icon + text + CTA align vertically on small screens
- [ ] Error doesn't block page content

---

### WEEK 3: Refinement & Secondary Pages (8 hours)

#### Task #6: Success Messages & Confirmations (1.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/components/SuccessMessage.tsx` - Success component
- `src/components/Toast.tsx` - Toast notifications
- `src/lib/messages/success-messages.ts` - Success copy

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 6):

```
BEFORE: "Campaign created successfully"
AFTER: "✓ Campaign ready! Schedule it to run Tuesday?"

BEFORE: "Email sent"
AFTER: "✓ Sent! You'll see replies by tomorrow morning."

BEFORE: "5 contacts imported"
AFTER: "✓ 5 new leads found. Ready to send follow-ups?"
```

**Acceptance Criteria**:
- [ ] 8 success messages rewritten (celebrate + next action)
- [ ] Checkmark icon consistent
- [ ] Toast notifications auto-dismiss after 4 seconds
- [ ] No blocking of page interaction

**Testing Checklist**:
- [ ] Trigger campaign creation, verify success message
- [ ] Success toast doesn't cover CTAs
- [ ] Mobile: Toast is readable at 320px width
- [ ] Dark mode: Green success color meets contrast requirements

---

#### Task #7: Settings & Account Pages (1.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/app/(dashboard)/settings/page.tsx` - Settings page
- `src/app/(dashboard)/account/page.tsx` - Account page
- `src/components/SettingsSection.tsx` - Settings components

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 7):

```
SECTION HEADERS:
BEFORE: "Gmail Integration Settings"
AFTER: "Your Email — Where We Find Hot Leads"

BEFORE: "Notification Preferences"
AFTER: "Get Alerts When — Choose how you hear about hot prospects"

BUTTON LABELS:
BEFORE: "Disconnect Integration"
AFTER: "Stop Reading My Email"
```

**Acceptance Criteria**:
- [ ] All section headers rewritten (benefit-driven)
- [ ] Toggle descriptions explain "what happens when"
- [ ] Danger zone buttons have confirming language
- [ ] Help text expanded (don't assume knowledge)

**Testing Checklist**:
- [ ] Settings sections expand/collapse smoothly
- [ ] Toggle switches are 44×44px with labels
- [ ] Danger zone button shows confirmation modal
- [ ] Help text is positioned above input on mobile

---

#### Task #8: Campaign Builder & Step Types (1.5 hours)
**Status**: Ready for Implementation
**Files to Update**:
- `src/app/(dashboard)/campaigns/builder/page.tsx` - Campaign builder
- `src/components/StepTypeSelector.tsx` - Step selector
- `src/components/CampaignStepForm.tsx` - Step form

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 8):

```
STEP TYPES:
BEFORE: "Send Email"
AFTER: "Send Email — Get your message in front of them"

BEFORE: "Add Condition"
AFTER: "Smart Check — Only send if they've opened emails"

BEFORE: "Update Score"
AFTER: "Mark Hot Lead — Update their interest score"

FORM LABELS:
BEFORE: "Recipient Segment"
AFTER: "Send To — Choose leads (or use 'hot leads')"
```

**Acceptance Criteria**:
- [ ] All step type labels include benefit
- [ ] Step descriptions explain "why" not "what"
- [ ] Form labels end with action verb or context
- [ ] Placeholder text is instructional

**Testing Checklist**:
- [ ] Step type selector is 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Each step card is clickable (44×44px minimum touch target)
- [ ] Step form fields have clear focus states
- [ ] Form validation messages are friendly

---

#### Task #9: Pricing & Onboarding Final Steps (1 hour)
**Status**: Ready for Implementation
**Files to Update**:
- `src/app/(marketing)/pricing/page.tsx` - Pricing page
- `src/components/PricingCard.tsx` - Pricing cards
- `src/app/(dashboard)/onboarding/final/page.tsx` - Final onboarding

**Copy Changes** (from `COPY_REWRITE_PHASE2.md`, Section 9):

```
PRICING PAGE:
BEFORE: "Choose Your Plan"
AFTER: "Pick the Right Plan for Your Business"

TIER HEADERS:
BEFORE: "Professional — $29/month"
AFTER: "Pro — $29/month — For growing service businesses"

CTA:
BEFORE: "Get Started"
AFTER: "Start 14-Day Trial" or "Upgrade Now"
```

**Acceptance Criteria**:
- [ ] Pricing cards show clear value per tier
- [ ] No hidden fees or surprise charges mentioned
- [ ] CTA buttons change based on auth state (Trial vs. Upgrade)
- [ ] FAQ section addresses common concerns

**Testing Checklist**:
- [ ] Pricing cards stack on mobile (100% width)
- [ ] Selected tier has visual emphasis (teal border)
- [ ] CTAs link to correct signup/billing pages
- [ ] All prices and billing cycles are accurate

---

#### Task #10: QA & Final Polish (1 hour)
**Status**: Ready for Implementation
**Process**:
1. Read entire app aloud, checking for tone consistency
2. Run Lighthouse Performance & Accessibility audits
3. Compare against voice-guide.md principles
4. Mobile device testing (real iPhone if possible)
5. Dark mode verification

**Acceptance Criteria**:
- [ ] No corporate jargon remains ("leverage", "paradigm", "synergize")
- [ ] All CTAs are specific and benefit-driven
- [ ] Lighthouse Performance ≥85
- [ ] Lighthouse Accessibility ≥90
- [ ] No broken links or 404s
- [ ] Mobile layout looks polished

**Testing Checklist**:
- [ ] Lighthouse audit passes
- [ ] pa11y contrast check passes
- [ ] All pages tested on iPhone 12 simulator
- [ ] Dark mode text contrast verified
- [ ] Copy read aloud with correct tone

---

## Implementation Schedule

### Week 2 Timeline (Mon-Fri, 12 hours)

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| Mon | Task #1: Hero Section | 2.5 | TBD |
| Mon-Tue | Task #2: Feature Cards | 2.5 | TBD |
| Tue-Wed | Task #3: Dashboard Stats | 2 | TBD |
| Wed | Task #4: Empty States | 2 | TBD |
| Thu | Task #5: Error Messages | 1.5 | TBD |
| **WEEK 2 TOTAL** | | **12 hours** | |

### Week 3 Timeline (Mon-Fri, 8 hours)

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| Mon | Task #6: Success Messages | 1.5 | TBD |
| Tue | Task #7: Settings Pages | 1.5 | TBD |
| Wed | Task #8: Campaign Builder | 1.5 | TBD |
| Thu | Task #9: Pricing & Onboarding | 1 | TBD |
| Fri | Task #10: QA & Polish | 1 | TBD |
| **WEEK 3 TOTAL** | | **8 hours** | |

---

## Files Included in Phase 2

### Rana's Copy Deliverables (Source Material)
1. **`COPY_REWRITE_PHASE2.md`** (554 lines)
   - Complete copy specification for 13 major sections
   - Before/after comparisons
   - Implementation notes

2. **`COPY_IMPLEMENTATION_GUIDE.md`** (Developer Handbook)
   - Step-by-step instructions with file paths
   - 3 new component templates
   - Testing checklist

3. **`COPY_BEFORE_AFTER_EXAMPLES.md`** (27 comparisons)
   - Stakeholder-ready format
   - Rationale for each change
   - Approval checklist

4. **`COPY_QUICK_REFERENCE.md`** (Cheat Sheet)
   - Voice principles quick reference
   - Common replacements table
   - Component usage examples

### Supporting Documentation
5. **`voice-guide.md`** (700+ lines)
   - 5 core voice principles
   - Writing rules with examples
   - Page-by-page copy templates

6. **`PHASE2_COPY_DELIVERY_SUMMARY.md`** (Executive Summary)
   - High-level overview
   - Key achievements
   - Success metrics

---

## Key Principles (Reference During Implementation)

### The 5 Voice Principles
1. **Clear Over Clever** - Use simplest wording, avoid marketing jargon
2. **Specific Over Generic** - Include numbers and examples, not vague claims
3. **Benefit Over Feature** - Lead with customer problem, then solution
4. **Action Over Passive** - Use active voice, action verbs
5. **Honest Over Hyped** - No superlatives, no unrealistic promises

### Common Changes Across All Copy
- Replace "email" with "reply" when referring to customer messages
- Change "campaign" to "email sequence" for clarity
- Replace "lead score" with "hotness rating" or "interest level"
- Use "hot leads" instead of "high-value prospects"
- Change "integration" to "connection" (simpler language)

### Tone Checklist (Before Committing)
- [ ] Would an Australian tradie (age 40-55) understand this?
- [ ] Is there a benefit statement (problem → solution → proof)?
- [ ] Did I avoid corporate jargon ("leverage", "synergize", "paradigm")?
- [ ] Are CTAs specific and action-oriented?
- [ ] Does it sound friendly, not sales-y?

---

## Blocking Issues & Dependencies

### ✅ No Blocking Issues
All Phase 1 work is complete and merged to main. Phase 2 can begin immediately.

### Dependencies
- Phase 2 work depends on Phase 1 being merged (✅ Done)
- Phase 2 unblocks Phase 3 designer work (waiting for UI polish)
- Phase 2 unblocks Analytics work (clearer messaging = better data)

---

## Success Metrics

### Quantitative
- Lighthouse Performance: Maintain ≥85 (no regression)
- Lighthouse Accessibility: Maintain ≥90 (from Phase 1)
- CTA Click-Through Rate: +40-60% improvement (vs. current generic copy)
- User Onboarding Completion: +20-30% (due to clearer instructions)

### Qualitative
- No user feedback about "corporate jargon" in UI
- Tradie user testing: All users understand what each feature does
- Design consistency: Voice matches visual identity (teal + warm gray)
- Brand coherence: Same tone across all pages

---

## Rollback Plan

If issues are discovered:

```bash
# Revert specific file
git checkout HEAD -- src/components/HeroSection.tsx

# Revert entire phase (if major issues)
git reset --hard main

# Revert to last known good
git reset --hard c01fd891  # Phase 1 completion commit
```

---

## Communication & Checkpoints

### Weekly Check-ins
- **Monday 8am**: Week kickoff, task prioritization
- **Wednesday 4pm**: Mid-week progress check, blockers discussion
- **Friday 4pm**: Week completion, metrics review

### Status Updates
- Use PR comments for daily progress
- Post Lighthouse metrics in PR description
- Tag @orchestrator for blockers

### Escalation
- Performance regression ≥5 points → discuss with orchestrator
- Accessibility issues → fix before merge
- Timeline slips ≥2 hours → notify orchestrator immediately

---

## Next Phase Preview

Once Phase 2 is complete:
- **Phase 3** designer work can accelerate (polished copy enables better design)
- **Analytics** team can begin tracking improved conversion metrics
- **Marketing** can use finalized copy for external campaigns

---

**Ready to Begin Week 2 Implementation!**

For questions or blockers during implementation, refer to:
- `COPY_REWRITE_PHASE2.md` - Primary copy reference
- `COPY_IMPLEMENTATION_GUIDE.md` - Step-by-step instructions
- `voice-guide.md` - Tone & voice principles

Let's make Unite-Hub sound like a trustworthy partner for Australian tradies. 🎯
