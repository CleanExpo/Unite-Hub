# Pricing Page Narrative Redesign
**Phase**: 3 (Transformation), Weeks 11-12
**Implementation Lead**: Claire (Frontend)
**Design Lead**: Phill
**Timeline**: 8 hours implementation
**Status**: Ready for Implementation

---

## Overview

Transform the pricing page from a feature comparison table into a story-driven value journey that builds understanding and desire before revealing pricing. Critical for conversion optimization.

**Current Problem**: Showing price first triggers sticker shock before value is understood.

**Solution**: Progressive value reveal → Build trust → Show pricing as investment, not cost.

---

## Current State Analysis

### File: `src/app/(marketing)/pricing/page.tsx` (446 lines)

**Current Structure**:
1. Hero: "Simple, Transparent Pricing"
2. Billing toggle (Monthly/Annual)
3. Three pricing tiers (Starter/Pro/Elite)
4. Feature comparison table
5. Trust indicators
6. Trial experience section
7. FAQ section
8. Add-ons section

**Current Conversion Path**:
```
Visitor arrives → Sees price immediately → Compares features → Maybe converts
```

**Issues**:
- Price shock happens before value is established
- No context for "why this is worth it"
- Generic trust indicators (no social proof)
- No tier recommendation logic
- Mobile experience is same as desktop

---

## Design Goals

### 1. Story-Driven Layout
Replace "price first" with "value first":
- **Problem** → **Solution** → **Proof** → **Pricing**
- Build emotional connection before logical evaluation
- Show real outcomes, not just features

### 2. Progressive Value Reveal
Each section builds on the previous:
1. Identify pain points (relatable problems)
2. Show transformation (before/after stories)
3. Provide social proof (real testimonials)
4. Present pricing as investment (ROI calculator)

### 3. Tier Recommendation
Guide users to right plan instead of making them choose:
- Quick quiz (5 questions)
- Automatic tier suggestion
- Personalized value proposition

### 4. Mobile-First Redesign
- Vertical scroll journey (no horizontal comparison)
- One tier at a time (swipeable carousel)
- Sticky CTA button
- Quick comparison toggle

---

## New Page Structure

### Section 1: The Problem (Hero)
**Goal**: Resonate with tradie pain points
**Duration**: 5-second scroll

```tsx
<HeroSection>
  <h1>Running a trade business is hard enough.</h1>
  <p className="text-xl">
    Between job sites, quotes, and chasing leads—who has time for marketing?
  </p>

  <PainPointsGrid>
    <PainPoint
      icon={Clock}
      label="20+ hours/week on admin"
      description="Time you'd rather spend on tools, not ads"
    />
    <PainPoint
      icon={DollarSign}
      label="$5,000+/month on agencies"
      description="And still not sure what's working"
    />
    <PainPoint
      icon={Frown}
      label="Inconsistent leads"
      description="Feast or famine—never steady work"
    />
  </PainPointsGrid>

  <CTAButton scroll="#solution">
    There's a Better Way →
  </CTAButton>
</HeroSection>
```

---

### Section 2: The Solution (Transformation)
**Goal**: Show before/after state
**Duration**: 10-second scroll

```tsx
<TransformationSection id="solution">
  <h2>What if marketing ran itself?</h2>
  <p>
    While you're on the job site, Unite-Hub handles leads, content, and follow-ups.
    Like having a marketing team that never sleeps.
  </p>

  <BeforeAfterComparison>
    <Before>
      <h3>Without Unite-Hub</h3>
      <ul>
        <li>❌ Manual lead tracking in spreadsheets</li>
        <li>❌ Forgotten follow-ups = lost revenue</li>
        <li>❌ Posting on social media at 11pm</li>
        <li>❌ Guessing which campaigns work</li>
      </ul>
    </Before>

    <After>
      <h3>With Unite-Hub</h3>
      <ul>
        <li>✅ AI scores leads automatically (focus on hot ones)</li>
        <li>✅ Automated follow-ups (never miss a sale)</li>
        <li>✅ Content created while you sleep</li>
        <li>✅ Know exactly what's working (and why)</li>
      </ul>
    </After>
  </BeforeAfterComparison>

  <IllustrationSlot>
    {/* Custom illustration: Tradie relaxing while AI works */}
    <img src="/illustrations/success-time-saved.svg" alt="Time saved" />
  </IllustrationSlot>

  <CTAButton scroll="#proof">
    Show Me the Results →
  </CTAButton>
</TransformationSection>
```

---

### Section 3: Social Proof (Trust)
**Goal**: Establish credibility
**Duration**: 15-second scroll

```tsx
<SocialProofSection id="proof">
  <h2>Real tradies. Real results.</h2>

  <TestimonialCarousel>
    <Testimonial
      quote="Three months ago, I was chasing leads manually. Now they come to me. Unite-Hub pays for itself every week."
      author="Dan M."
      business="D&M Electrical, Brisbane"
      result="+147% leads in 90 days"
      avatar="/testimonials/dan-m.jpg"
    />
    <Testimonial
      quote="I was skeptical about AI marketing. But seeing my jobs booked 2 weeks ahead? That's real."
      author="Sarah T."
      business="Precision Plumbing, Sydney"
      result="$12,400 revenue first month"
      avatar="/testimonials/sarah-t.jpg"
    />
    <Testimonial
      quote="Best decision I made this year. My phone rings, my emails convert, and I'm not stuck behind a desk."
      author="Chris L."
      business="Elite Carpentry, Melbourne"
      result="5-star Google rating in 60 days"
      avatar="/testimonials/chris-l.jpg"
    />
  </TestimonialCarousel>

  <StatsGrid>
    <Stat value="2,400+" label="Tradies using Unite-Hub" />
    <Stat value="$3.2M" label="Revenue generated for clients" />
    <Stat value="4.8/5" label="Average customer rating" />
    <Stat value="90%" label="Still active after 6 months" />
  </StatsGrid>

  <CTAButton scroll="#pricing">
    I'm Ready to Get Started →
  </CTAButton>
</SocialProofSection>
```

---

### Section 4: ROI Calculator (Value Justification)
**Goal**: Show pricing as investment, not cost
**Duration**: 20-second interaction

```tsx
<ROICalculatorSection>
  <h2>See your potential return</h2>
  <p>Not a cost. An investment that pays for itself.</p>

  <InteractiveCalculator>
    <InputGroup>
      <Label>Average job value (AUD)</Label>
      <Input
        type="number"
        value={jobValue}
        onChange={(e) => setJobValue(Number(e.target.value))}
        placeholder="e.g., $800"
      />
    </InputGroup>

    <InputGroup>
      <Label>Jobs per month (currently)</Label>
      <Input
        type="number"
        value={currentJobs}
        onChange={(e) => setCurrentJobs(Number(e.target.value))}
        placeholder="e.g., 15"
      />
    </InputGroup>

    <OutputGrid>
      <Output>
        <Label>Your monthly revenue</Label>
        <Value>${(jobValue * currentJobs).toLocaleString()}</Value>
      </Output>

      <Output highlight>
        <Label>With 3 extra jobs/month</Label>
        <Value>${(jobValue * (currentJobs + 3)).toLocaleString()}</Value>
        <Change>+${(jobValue * 3).toLocaleString()}/month</Change>
      </Output>

      <Output>
        <Label>Unite-Hub Pro cost</Label>
        <Value>$895/month</Value>
      </Output>

      <Output success>
        <Label>Your net gain</Label>
        <Value>+${(jobValue * 3 - 895).toLocaleString()}/month</Value>
        <Subtext>That's a {Math.round((jobValue * 3) / 895 * 100)}% ROI</Subtext>
      </Output>
    </OutputGrid>

    <Disclaimer>
      Results vary. Based on average 3-5 extra jobs/month from improved lead capture and follow-up.
    </Disclaimer>
  </InteractiveCalculator>

  <CTAButton scroll="#plans">
    Show Me the Plans →
  </CTAButton>
</ROICalculatorSection>
```

---

### Section 5: Tier Recommendation Quiz
**Goal**: Personalized plan suggestion
**Duration**: 30-second interaction

```tsx
<TierQuizSection id="quiz">
  <h2>Which plan fits your business?</h2>
  <p>Quick quiz (30 seconds)</p>

  <QuizFlow>
    <Question
      number={1}
      text="How many team members do you have?"
      options={[
        { label: "Just me", value: "solo", points: { starter: 3, pro: 1, elite: 0 } },
        { label: "2-5 people", value: "small", points: { starter: 1, pro: 3, elite: 1 } },
        { label: "6-10 people", value: "medium", points: { starter: 0, pro: 2, elite: 3 } },
        { label: "10+ people", value: "large", points: { starter: 0, pro: 1, elite: 3 } }
      ]}
    />

    <Question
      number={2}
      text="How many leads do you get per month?"
      options={[
        { label: "<50", value: "low", points: { starter: 3, pro: 1, elite: 0 } },
        { label: "50-200", value: "medium", points: { starter: 1, pro: 3, elite: 1 } },
        { label: "200-500", value: "high", points: { starter: 0, pro: 2, elite: 3 } },
        { label: "500+", value: "enterprise", points: { starter: 0, pro: 0, elite: 3 } }
      ]}
    />

    <Question
      number={3}
      text="How much do you currently spend on marketing/month?"
      options={[
        { label: "$0-500", value: "minimal", points: { starter: 3, pro: 1, elite: 0 } },
        { label: "$500-2,000", value: "moderate", points: { starter: 1, pro: 3, elite: 1 } },
        { label: "$2,000-5,000", value: "substantial", points: { starter: 0, pro: 2, elite: 3 } },
        { label: "$5,000+", value: "high", points: { starter: 0, pro: 1, elite: 3 } }
      ]}
    />

    <Question
      number={4}
      text="What's your main goal?"
      options={[
        { label: "Get more leads", value: "leads", points: { starter: 2, pro: 3, elite: 1 } },
        { label: "Save time on admin", value: "time", points: { starter: 3, pro: 2, elite: 1 } },
        { label: "Scale my business", value: "scale", points: { starter: 0, pro: 2, elite: 3 } },
        { label: "Beat competitors", value: "compete", points: { starter: 1, pro: 2, elite: 3 } }
      ]}
    />

    <Question
      number={5}
      text="How tech-savvy are you?"
      options={[
        { label: "I struggle with tech", value: "low", points: { starter: 3, pro: 2, elite: 1 } },
        { label: "I can figure things out", value: "medium", points: { starter: 2, pro: 3, elite: 2 } },
        { label: "I'm very comfortable", value: "high", points: { starter: 1, pro: 2, elite: 3 } }
      ]}
    />
  </QuizFlow>

  <ResultsCard tier={recommendedTier}>
    <h3>We recommend: {recommendedTier.name}</h3>
    <p>{recommendedTier.reasoning}</p>
    <CTAButton href="#plans">
      View {recommendedTier.name} Details
    </CTAButton>
  </ResultsCard>
</TierQuizSection>
```

**Quiz Scoring Logic**:
```typescript
function calculateRecommendedTier(answers: QuizAnswer[]): Tier {
  const scores = { starter: 0, pro: 0, elite: 0 };

  answers.forEach((answer) => {
    scores.starter += answer.points.starter;
    scores.pro += answer.points.pro;
    scores.elite += answer.points.elite;
  });

  const maxScore = Math.max(scores.starter, scores.pro, scores.elite);

  if (scores.starter === maxScore) return "starter";
  if (scores.pro === maxScore) return "pro";
  return "elite";
}
```

---

### Section 6: Pricing Plans (Finally!)
**Goal**: Present pricing after value is established
**Duration**: 60-second comparison

```tsx
<PricingPlansSection id="plans">
  <h2>Choose Your Investment</h2>
  <p>All plans include 14-day trial + 90-day activation program</p>

  <BillingToggle
    value={billingCycle}
    onChange={setBillingCycle}
    options={[
      { label: "Monthly", value: "monthly" },
      { label: "Annual (Save 17%)", value: "annual", badge: "Popular" }
    ]}
  />

  {/* Desktop: Side-by-side comparison */}
  <DesktopPricingGrid className="hidden lg:grid">
    <PricingCard
      tier="Starter"
      price={billingCycle === "monthly" ? 495 : 412}
      billingCycle={billingCycle}
      features={starterFeatures}
      cta="Start 14-Day Trial"
      recommended={recommendedTier === "starter"}
    />
    <PricingCard
      tier="Pro"
      price={billingCycle === "monthly" ? 895 : 746}
      billingCycle={billingCycle}
      features={proFeatures}
      cta="Start 14-Day Trial"
      recommended={recommendedTier === "pro"}
      popular
    />
    <PricingCard
      tier="Elite"
      price={billingCycle === "monthly" ? 1295 : 1079}
      billingCycle={billingCycle}
      features={eliteFeatures}
      cta="Start 14-Day Trial"
      recommended={recommendedTier === "elite"}
    />
  </DesktopPricingGrid>

  {/* Mobile: Carousel (one tier at a time) */}
  <MobilePricingCarousel className="lg:hidden">
    <Swiper
      initialSlide={getInitialSlide(recommendedTier)}
      navigation
      pagination={{ clickable: true }}
    >
      <SwiperSlide>
        <PricingCard tier="Starter" {...} />
      </SwiperSlide>
      <SwiperSlide>
        <PricingCard tier="Pro" {...} />
      </SwiperSlide>
      <SwiperSlide>
        <PricingCard tier="Elite" {...} />
      </SwiperSlide>
    </Swiper>
  </MobilePricingCarousel>

  <ComparisonTableToggle>
    <Button variant="ghost" onClick={() => setShowComparison(!showComparison)}>
      {showComparison ? "Hide" : "Show"} Full Comparison
    </Button>
  </ComparisonTableToggle>

  <AnimatePresence>
    {showComparison && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FeatureComparisonTable
          tiers={["Starter", "Pro", "Elite"]}
          features={allFeatures}
        />
      </motion.div>
    )}
  </AnimatePresence>
</PricingPlansSection>
```

---

### Section 7: FAQ (Objection Handling)
**Goal**: Address common concerns
**Duration**: 30-second scan

```tsx
<FAQSection>
  <h2>Questions? We've got answers.</h2>

  <AccordionGroup>
    {/* Reuse existing FAQ from current page */}
    {faqs.map((faq, index) => (
      <AccordionItem key={index} question={faq.question}>
        {faq.answer}
      </AccordionItem>
    ))}

    {/* Add new FAQ */}
    <AccordionItem question="What if I'm not tech-savvy?">
      We built Unite-Hub for tradies, not tech nerds. If you can send a text, you can use our platform.
      Plus, our 14-day guided trial walks you through everything step-by-step.
    </AccordionItem>

    <AccordionItem question="Can I cancel anytime?">
      After your 90-day minimum (required for real marketing results), you can cancel with 30-day notice.
      No lock-in contracts. No hidden fees.
    </AccordionItem>
  </AccordionGroup>
</FAQSection>
```

---

### Section 8: Final CTA (Urgency + Scarcity)
**Goal**: Drive signup decision
**Duration**: 5-second scan

```tsx
<FinalCTASection>
  <h2>Join 2,400+ tradies growing their business</h2>
  <p>Start your 14-day trial today. No credit card required.</p>

  <UrgencyIndicator>
    <Clock className="w-5 h-5" />
    <span>
      23 tradies started their trial this week.
      {remainingSpots > 0 && ` Only ${remainingSpots} trial spots left this month.`}
    </span>
  </UrgencyIndicator>

  <CTAButtonGroup>
    <Button size="lg" href="/dashboard/overview">
      Start Your Free Trial →
    </Button>
    <Button size="lg" variant="ghost" href="/contact">
      Talk to Sales
    </Button>
  </CTAButtonGroup>

  <TrustBadges>
    <Badge>✓ 14-day free trial</Badge>
    <Badge>✓ No credit card required</Badge>
    <Badge>✓ Cancel anytime after 90 days</Badge>
  </TrustBadges>
</FinalCTASection>
```

---

## Mobile-Specific Optimizations

### Sticky CTA Bar (Mobile Only)
```tsx
<StickyBottomBar className="lg:hidden">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold">Ready to start?</p>
      <p className="text-xs text-gray-600">14-day free trial</p>
    </div>
    <Button size="sm" href="/dashboard/overview">
      Try Free
    </Button>
  </div>
</StickyBottomBar>
```

### Progressive Section Loading
```tsx
// Lazy load sections below fold
const SocialProofSection = lazy(() => import("./SocialProofSection"));
const ROICalculatorSection = lazy(() => import("./ROICalculatorSection"));
const PricingPlansSection = lazy(() => import("./PricingPlansSection"));

<Suspense fallback={<SectionSkeleton />}>
  <SocialProofSection />
</Suspense>
```

---

## A/B Testing Hooks

### Variant Configuration
```typescript
// src/lib/ab-testing/pricing-variants.ts
export const PRICING_VARIANTS = {
  control: {
    layout: "original", // Current feature table
    showPriceFirst: true
  },
  narrative: {
    layout: "story-driven", // New narrative layout
    showPriceFirst: false
  },
  quiz: {
    layout: "story-driven",
    showPriceFirst: false,
    showQuiz: true
  }
} as const;

export function getPricingVariant(): keyof typeof PRICING_VARIANTS {
  // Simple A/B test (33% each variant)
  const random = Math.random();
  if (random < 0.33) return "control";
  if (random < 0.66) return "narrative";
  return "quiz";
}
```

### Tracking Events
```typescript
// Track conversion funnel
export function trackPricingEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, {
      event_category: "Pricing",
      ...properties
    });
  }
}

// Usage
trackPricingEvent("viewed_section", { section: "problem" });
trackPricingEvent("completed_quiz", { recommended_tier: "pro" });
trackPricingEvent("clicked_cta", { tier: "pro", location: "hero" });
trackPricingEvent("started_trial", { tier: "pro", variant: "narrative" });
```

---

## Component Specifications

### PainPoint Component
```tsx
interface PainPointProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

export function PainPoint({ icon: Icon, label, description }: PainPointProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
```

### Testimonial Component
```tsx
interface TestimonialProps {
  quote: string;
  author: string;
  business: string;
  result: string;
  avatar: string;
}

export function Testimonial({ quote, author, business, result, avatar }: TestimonialProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={avatar}
          alt={author}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{author}</p>
          <p className="text-xs text-gray-600">{business}</p>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>

      <p className="text-gray-700 mb-4 italic">"{quote}"</p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-semibold text-green-800">{result}</p>
      </div>
    </Card>
  );
}
```

---

## Implementation Plan

### Phase 1: Hero + Problem Section (2h)
1. Create `PainPoint` component (0.5h)
2. Build hero section with pain points grid (1h)
3. Add scroll-to-section CTA buttons (0.5h)

### Phase 2: Solution + Social Proof (2h)
1. Create `BeforeAfterComparison` component (0.5h)
2. Build `Testimonial` component (0.5h)
3. Implement testimonial carousel (0.5h)
4. Add stats grid (0.5h)

### Phase 3: ROI Calculator (2h)
1. Build interactive calculator UI (1h)
2. Wire up calculation logic (0.5h)
3. Add mobile-optimized layout (0.5h)

### Phase 4: Tier Quiz + Final Integration (2h)
1. Create quiz flow component (1h)
2. Implement scoring logic (0.5h)
3. Add mobile carousel for pricing cards (0.5h)

---

## Success Metrics

### Primary KPIs
- **Trial signup rate**: Target +10% vs current
- **Time on page**: Target +25% (3min → 3min 45sec)
- **Scroll depth**: Target 80%+ reach pricing section
- **Quiz completion**: Target 60%+ completion rate

### Secondary KPIs
- **Mobile conversion**: Target match desktop (currently 50% lower)
- **ROI calculator usage**: Target 40% interaction rate
- **Testimonial engagement**: Target 30% carousel interaction

---

## A/B Test Plan

### Test Variants
1. **Control**: Current feature table layout
2. **Narrative**: Story-driven layout (no quiz)
3. **Quiz**: Story-driven + tier quiz

### Test Duration
- Run for 2 weeks (minimum 1,000 visitors per variant)
- Monitor daily for statistical significance
- Declare winner at 95% confidence level

### Winning Criteria
Primary metric: Trial signup rate
Secondary: Time on page, scroll depth

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Status**: Ready for Implementation
**Estimated Hours**: 8 hours (Claire)
