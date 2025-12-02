# Copy Implementation Guide for Claire (Frontend Developer)

**Date**: December 2, 2025
**From**: Rana (Copywriter)
**To**: Claire (Frontend Developer)
**Status**: Ready for Week 2-3 Implementation

---

## Quick Start

This guide shows you exactly what to change in each file to implement the new copy. Each section includes:
- File path
- Current code
- New code
- Estimated time

**Total Implementation Time**: ~12 hours across Week 2-3

---

## PRIORITY 1: Landing Page Hero (2 hours)

### File: `src/app/landing/page.tsx`

**CURRENT (Lines 37-46)**:
```tsx
<Badge className="mx-auto bg-blue-600/20 text-blue-300 border-blue-600/30 px-4 py-2">
  🚀 The AI Marketing CRM for Modern Agencies
</Badge>

<h1 className="text-6xl font-bold text-white max-w-4xl mx-auto">
  Get 90 Days of <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Real Marketing Momentum</span> — Not Hype
</h1>

<p className="text-xl text-slate-400 max-w-2xl mx-auto">
  Start with a 14-day guided trial. Stay for a 90-day activation program that guarantees real insights, real action, and real measurable progress. AI-powered email processing, content generation, and campaign management for agencies who value honest results.
</p>
```

**NEW**:
```tsx
<Badge className="mx-auto bg-blue-600/20 text-blue-300 border-blue-600/30 px-4 py-2">
  For Australian Service Businesses
</Badge>

<h1 className="text-6xl font-bold text-white max-w-4xl mx-auto">
  Stop Paying for <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Marketing That Doesn't Bring Jobs</span>
</h1>

<p className="text-xl text-slate-400 max-w-2xl mx-auto">
  Finally—marketing that actually gets you callbacks. See which leads are hot. Send follow-ups automatically. Know what's working (and what isn't).
</p>
```

### File: `src/app/landing/page.tsx` - CTA Buttons (Lines 49-58)

**CURRENT**:
```tsx
<div className="flex gap-4 justify-center">
  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2" asChild>
    <a href="/signup">Start 14-Day Guided Trial <ArrowRight className="w-4 h-4" /></a>
  </Button>
  <Button size="lg" variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10" asChild>
    <a href="/demo">🧪 Try Demo</a>
  </Button>
  <Button size="lg" variant="outline" className="border-slate-600 text-slate-300">
    Watch Demo
  </Button>
</div>
```

**NEW**:
```tsx
<div className="flex gap-4 justify-center">
  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2" asChild>
    <a href="/signup">Find Your Hot Leads <ArrowRight className="w-4 h-4" /></a>
  </Button>
  <Button size="lg" variant="outline" className="border-slate-600 text-slate-300">
    See How It Works
  </Button>
</div>
```

### File: `src/app/landing/page.tsx` - Trust Indicators (Lines 62-66)

**CURRENT**:
```tsx
<div className="flex justify-center gap-8 text-sm text-slate-400">
  <div>✅ No credit card required</div>
  <div>✅ 14-day guided trial</div>
  <div>✅ 90-day activation program</div>
</div>
```

**NEW**:
```tsx
<div className="flex justify-center gap-8 text-sm text-slate-400">
  <div>✅ No credit card to try it</div>
  <div>✅ Set up in 5 minutes</div>
  <div>✅ Cancel anytime you want</div>
</div>
```

---

## PRIORITY 2: Feature Cards (1 hour)

### File: `src/app/landing/page.tsx` - FeatureCard Components (Lines 85-100)

**CURRENT**:
```tsx
<FeatureCard
  icon={<Zap className="w-6 h-6" />}
  title="Email Automation"
  description="Automatically process incoming emails, extract data, and link to contacts with AI"
/>
<FeatureCard
  icon={<TrendingUp className="w-6 h-6" />}
  title="AI Content Generation"
  description="Generate personalized followups, proposals, and case studies in seconds"
/>
<FeatureCard
  icon={<Shield className="w-6 h-6" />}
  title="Multi-Tenant Enterprise"
  description="Manage unlimited client accounts with complete data isolation"
/>
```

**NEW**:
```tsx
<FeatureCard
  icon={<Zap className="w-6 h-6" />}
  title="Never Miss a Reply"
  description="Someone replies to your quote at 7pm? We catch it. Instantly. You'll see it on your phone before you finish dinner."
/>
<FeatureCard
  icon={<TrendingUp className="w-6 h-6" />}
  title="Write Follow-Ups in 30 Seconds"
  description="Stuck on what to say? Type 2 sentences about the job. Get a perfect follow-up email ready to send."
/>
<FeatureCard
  icon={<Shield className="w-6 h-6" />}
  title="Run Multiple Brands"
  description="Got a plumbing business AND a renovation company? Keep them separate. Different clients, different quotes, different everything."
/>
```

---

## PRIORITY 3: Empty States (3 hours)

### File: `src/components/EmptyState.tsx`

**Add emoji support** by updating the component to accept both LucideIcon and string (for emoji):

**CURRENT**:
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: string;
}
```

**NEW**:
```tsx
interface EmptyStateProps {
  icon: LucideIcon | string; // Now accepts emoji strings like "📭"
  title: string;
  description: string;
  actionLabel?: string;
  secondaryActionLabel?: string; // NEW: Optional secondary action
  onAction?: () => void;
  onSecondaryAction?: () => void; // NEW: Optional secondary action handler
  gradient?: string;
}
```

**Update the render logic**:

**CURRENT (Lines 31-37)**:
```tsx
<div className="flex justify-center">
  <div
    className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
  >
    <Icon className="h-8 w-8 text-blue-400" />
  </div>
</div>
```

**NEW**:
```tsx
<div className="flex justify-center">
  {typeof icon === 'string' ? (
    // Render emoji
    <div className="text-5xl mb-2">
      {icon}
    </div>
  ) : (
    // Render Lucide icon
    <div
      className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      {React.createElement(icon, { className: "h-8 w-8 text-blue-400" })}
    </div>
  )}
</div>
```

**Add secondary action button** (after primary button):

```tsx
{/* Action Buttons */}
<div className="flex flex-col gap-3">
  {actionLabel && onAction && (
    <Button
      onClick={onAction}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all"
    >
      {actionLabel}
    </Button>
  )}
  {secondaryActionLabel && onSecondaryAction && (
    <Button
      onClick={onSecondaryAction}
      variant="ghost"
      className="text-slate-400 hover:text-slate-300"
    >
      {secondaryActionLabel}
    </Button>
  )}
</div>
```

### Update All Empty State Usage

#### Dashboard - No Contacts (`src/app/dashboard/contacts/page.tsx`)

**Search for**: `No contacts` or `<EmptyState` with contacts

**Replace with**:
```tsx
<EmptyState
  icon="📭"
  title="Your inbox is lonely"
  description="Connect your Gmail and we'll find people who replied to your quotes. Takes 2 minutes."
  actionLabel="Connect Gmail"
  secondaryActionLabel="Or add a contact manually"
  onAction={() => router.push('/dashboard/integrations/gmail')}
  onSecondaryAction={() => setShowAddContactModal(true)}
/>
```

#### Dashboard - No Campaigns

**Replace with**:
```tsx
<EmptyState
  icon="📣"
  title="Ready to follow up with 10 leads at once?"
  description="Create a campaign to send the same message to everyone who needs a nudge. We'll even tell you the best time to send."
  actionLabel="Start First Campaign"
  secondaryActionLabel="Show me an example first"
  onAction={() => router.push('/dashboard/campaigns/new')}
  onSecondaryAction={() => setShowExampleModal(true)}
/>
```

#### Social Inbox - No Messages (`src/app/(staff)/staff/social-inbox/page.tsx`)

**Replace with**:
```tsx
<EmptyState
  icon="🔌"
  title="Nothing here yet"
  description="Connect your Facebook, Instagram, or Google Business Profile to see all your messages in one spot. No more app-switching."
  actionLabel="Connect First Account"
  secondaryActionLabel="Why should I do this?"
  onAction={() => router.push('/dashboard/integrations')}
  onSecondaryAction={() => setShowInfoModal(true)}
/>
```

#### Search - No Results (Any page with search)

**Replace with**:
```tsx
<EmptyState
  icon="🔍"
  title="Can't find that"
  description="Try a different name, company, or email. Or check if you typed it right (we've all been there)."
  actionLabel="Clear search and start over"
  onAction={() => setSearchQuery('')}
/>
```

#### Content Drafts - Empty (`src/app/dashboard/content/page.tsx`)

**Replace with**:
```tsx
<EmptyState
  icon="✍️"
  title="Let's write something"
  description="Stuck writing a follow-up email? Dreading that proposal? We'll write the first draft. You just edit and send."
  actionLabel="Write My First Email"
  secondaryActionLabel="Show me examples"
  onAction={() => router.push('/dashboard/content/new')}
  onSecondaryAction={() => setShowExamplesModal(true)}
/>
```

#### Queue - No Jobs (`src/app/dashboard/queue/page.tsx`)

**Replace with**:
```tsx
<EmptyState
  icon="✅"
  title="All done!"
  description="Nothing waiting for you. Go grab a coffee—you earned it."
  actionLabel="See completed jobs"
  onAction={() => router.push('/dashboard/queue?filter=completed')}
/>
```

---

## PRIORITY 4: Error Messages (2 hours)

### Create New Error Component: `src/components/ui/error-with-actions.tsx`

```tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorWithActionsProps {
  title: string;
  causes?: string[]; // Optional list of likely causes
  action: {
    label: string;
    onClick: () => void;
  };
  fallback?: {
    text: string;
    email?: string;
  };
}

export function ErrorWithActions({
  title,
  causes,
  action,
  fallback,
}: ErrorWithActionsProps) {
  return (
    <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              {title}
            </h3>

            {/* Likely Causes */}
            {causes && causes.length > 0 && (
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium mb-2">This usually means:</p>
                <ul className="space-y-1">
                  {causes.map((cause, index) => (
                    <li key={index}>• {cause}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={action.onClick}
                variant="destructive"
                size="sm"
              >
                → {action.label}
              </Button>

              {/* Fallback Contact */}
              {fallback && (
                <span className="text-sm text-red-700 dark:text-red-300">
                  {fallback.text}{' '}
                  {fallback.email && (
                    <a
                      href={`mailto:${fallback.email}`}
                      className="underline font-medium"
                    >
                      {fallback.email}
                    </a>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Usage Examples

#### Gmail Connection Failed

**File**: `src/app/dashboard/integrations/gmail/page.tsx`

**Replace generic error with**:
```tsx
{error && (
  <ErrorWithActions
    title="Gmail didn't connect"
    causes={[
      "You clicked 'Deny' by accident → Try again",
      "Your password changed recently → Re-connect your account",
      "Something else weird happened → Email us",
    ]}
    action={{
      label: "Try connecting again",
      onClick: () => handleConnectGmail(),
    }}
    fallback={{
      text: "Still stuck?",
      email: "help@unite-hub.com",
    }}
  />
)}
```

#### Campaign Send Failed

**File**: `src/app/dashboard/campaigns/[id]/page.tsx`

```tsx
{sendError && (
  <ErrorWithActions
    title="Your campaign didn't send"
    causes={[
      "No internet connection when you hit send",
      "One email address was wrong (check the list)",
      "Our server hiccupped (rare, but it happens)",
    ]}
    action={{
      label: "Check addresses and try again",
      onClick: () => retrySend(),
    }}
    fallback={{
      text: "Still broken? Email",
      email: "help@unite-hub.com",
    }}
  />
)}
```

#### Form Validation Error (Generic)

**File**: Any form with error handling

```tsx
{formError && (
  <ErrorWithActions
    title="That didn't save"
    causes={[
      "Check your internet connection",
      "One of the fields might be wrong",
    ]}
    action={{
      label: "Try saving again",
      onClick: () => handleSubmit(),
    }}
    fallback={{
      text: "Still stuck? Text us at 0400 XXX XXX",
    }}
  />
)}
```

---

## PRIORITY 5: Success Messages (1 hour)

### Create New Success Component: `src/components/ui/success-with-action.tsx`

```tsx
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessWithActionProps {
  icon?: string; // Emoji like "🎉"
  title: string;
  context?: string; // Optional context message
  action?: {
    label: string;
    href: string;
  };
}

export function SuccessWithAction({
  icon = "✓",
  title,
  context,
  action,
}: SuccessWithActionProps) {
  return (
    <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="text-2xl">
              {icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {title}
            </h3>

            {/* Context */}
            {context && (
              <p className="text-sm text-green-800 dark:text-green-200">
                {context}
              </p>
            )}

            {/* Action */}
            {action && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-green-600 text-green-700 hover:bg-green-100 dark:border-green-400 dark:text-green-300"
              >
                <a href={action.href}>→ {action.label}</a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Usage Examples

#### Campaign Sent Success

```tsx
<SuccessWithAction
  icon="🎉"
  title="Sent to 47 people!"
  context="You'll start seeing opens in about 10 minutes. Check back in an hour to see who's interested."
  action={{
    label: "View campaign stats",
    href: `/campaigns/${campaignId}`,
  }}
/>
```

#### Contact Added Success

```tsx
<SuccessWithAction
  icon="✓"
  title="Added Sarah from Superior Plumbing"
  context="Want to send them a follow-up now?"
  action={{
    label: "Write follow-up email",
    href: `/contacts/${contactId}/compose`,
  }}
/>
```

#### Gmail Connected Success

```tsx
<SuccessWithAction
  icon="✓"
  title="Connected!"
  context="We're reading your last 200 emails now. This takes about 60 seconds. Go grab a drink."
  action={{
    label: "See what we found",
    href: "/contacts",
  }}
/>
```

---

## PRIORITY 6: Dashboard Stats Widgets (2 hours)

### File: Create/Update `src/components/dashboard/StatWidget.tsx`

**Add new "context" and "insight" fields**:

```tsx
interface StatWidgetProps {
  title: string;
  value: string | number;
  change?: string; // e.g., "+12 this week"
  context?: string; // NEW: e.g., "12 new this week—up from 8 last week"
  insight?: string; // NEW: e.g., "7 are hot leads right now"
  actionLink?: {
    label: string;
    href: string;
  };
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatWidget({
  title,
  value,
  change,
  context,
  insight,
  actionLink,
  icon: Icon,
  variant = 'default',
}: StatWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold">{value}</div>

          {/* Change indicator */}
          {change && (
            <p className="text-xs text-muted-foreground">{change}</p>
          )}

          {/* Context (NEW) */}
          {context && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {context}
            </p>
          )}

          {/* Insight (NEW) */}
          {insight && (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {insight}
            </p>
          )}

          {/* Action Link */}
          {actionLink && (
            <a
              href={actionLink.href}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
            >
              {actionLink.label}
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Usage Examples

#### Contacts Widget

**File**: `src/app/dashboard/overview/page.tsx`

**Replace existing stat with**:
```tsx
<StatWidget
  title="People in your CRM"
  value="847 contacts"
  change="+12 this week"
  context="12 new this week—up from 8 last week"
  insight="7 are hot leads right now"
  actionLink={{
    label: "See hot leads",
    href: "/contacts?filter=hot",
  }}
  icon={Users}
/>
```

#### Campaigns Widget

```tsx
<StatWidget
  title="Email campaigns"
  value="23 total"
  change="3 active"
  context="3 running now, 547 emails sent this week"
  insight="Best open rate: Tuesday 9am (48%)"
  actionLink={{
    label: "See all campaigns",
    href: "/campaigns",
  }}
  icon={Mail}
/>
```

#### Open Rate Widget

```tsx
<StatWidget
  title="Email opens"
  value="34%"
  change="+2% vs last month"
  context="Up from 32% last month—nice!"
  insight="Industry average is 28%, so you're doing great"
  actionLink={{
    label: "See which emails work best",
    href: "/analytics/emails",
  }}
  icon={TrendingUp}
  variant="success"
/>
```

---

## PRIORITY 7: Onboarding Flow (2 hours)

### File: `src/app/(auth)/onboarding/step-1-info/page.tsx`

**Update all 4 onboarding steps with new copy**:

#### Step 1: Welcome

```tsx
<div className="text-center space-y-4">
  <h1 className="text-3xl font-bold">Let's get you set up</h1>
  <p className="text-lg text-slate-600 dark:text-slate-400">
    5 minutes. 4 steps. Then you'll see which leads are hot.
  </p>
  <div className="text-sm text-slate-500">
    Step 1 of 4
  </div>
  <div className="flex gap-4 justify-center">
    <Button size="lg" onClick={() => router.push('/onboarding/step-2')}>
      Let's go
    </Button>
    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
      I'll do this later
    </Button>
  </div>
</div>
```

#### Step 2: Connect Gmail

```tsx
<div className="space-y-6">
  <div className="space-y-2">
    <h2 className="text-2xl font-bold">Connect your Gmail</h2>
    <p className="text-slate-600 dark:text-slate-400">
      We'll read your emails and find people who replied to your quotes.
      Don't worry—we don't send anything without asking.
    </p>
  </div>

  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
    <p className="text-sm text-blue-800 dark:text-blue-200">
      🔒 We only read business emails. Personal stuff stays private.
    </p>
  </div>

  <div className="text-sm text-slate-500">
    Step 2 of 4
  </div>

  <div className="flex gap-4">
    <Button size="lg" onClick={handleConnectGmail}>
      Connect Gmail
    </Button>
    <Button variant="ghost" onClick={() => router.push('/onboarding/step-3')}>
      Skip this (you can do it later)
    </Button>
  </div>
</div>
```

#### Step 3: Import Contacts

```tsx
<div className="space-y-6">
  <div className="space-y-2">
    <h2 className="text-2xl font-bold">Got contacts in a spreadsheet?</h2>
    <p className="text-slate-600 dark:text-slate-400">
      Upload your Excel file and we'll import everyone. Or start fresh—either way works.
    </p>
  </div>

  <div className="text-sm text-slate-500">
    Step 3 of 4
  </div>

  <div className="flex flex-col gap-3">
    <Button size="lg" onClick={handleUploadFile}>
      Upload spreadsheet
    </Button>
    <Button variant="outline" onClick={handleManualAdd}>
      I'll add them manually
    </Button>
    <Button variant="ghost" onClick={() => router.push('/onboarding/step-4')}>
      Skip—I'll do this later
    </Button>
  </div>
</div>
```

#### Step 4: First Campaign (Optional)

```tsx
<div className="space-y-6">
  <div className="space-y-2">
    <h2 className="text-2xl font-bold">Want to send a follow-up to 10 people at once?</h2>
    <p className="text-slate-600 dark:text-slate-400">
      Pick who to send to. We'll write the email. You just hit send.
      (Or skip this and explore first.)
    </p>
  </div>

  <div className="text-sm text-slate-500">
    Step 4 of 4 (optional)
  </div>

  <div className="flex flex-col gap-3">
    <Button size="lg" onClick={() => router.push('/campaigns/new')}>
      Set up first campaign
    </Button>
    <Button variant="outline" onClick={() => router.push('/dashboard')}>
      I'll explore first
    </Button>
  </div>
</div>
```

---

## TESTING CHECKLIST

After implementing each section, verify:

### Visual Testing
- [ ] Copy is readable on mobile (test at 375px width)
- [ ] Emoji render correctly (test on Windows, Mac, mobile)
- [ ] Buttons are appropriately sized
- [ ] Spacing looks balanced

### Content Testing
- [ ] No jargon words (leverage, utilize, synergize, etc.)
- [ ] Sentences are short (avg 12-15 words)
- [ ] Numbers are specific (not "better" but "3x faster")
- [ ] Active voice (not passive constructions)
- [ ] Australian English spelling (colour, organisation, etc.)

### Functional Testing
- [ ] All buttons work (don't break onClick handlers)
- [ ] Error states trigger correctly
- [ ] Success messages appear after actions
- [ ] Empty states show when expected
- [ ] Links go to correct pages

### User Testing (Optional but Recommended)
- [ ] Show to 1-2 people NOT on the team
- [ ] Ask: "What does this product do?" (should answer in 5 seconds)
- [ ] Ask: "What would you do next?" (should be obvious)

---

## ROLL-OUT PLAN

### Week 2 (Days 1-5)
**Day 1** (Monday):
- Implement hero section (30 min)
- Implement feature cards (30 min)
- Deploy to staging, get feedback

**Day 2** (Tuesday):
- Create ErrorWithActions component (1 hour)
- Implement 3-4 error states (1 hour)
- Test error flows

**Day 3** (Wednesday):
- Update EmptyState component (1 hour)
- Implement all 6 empty states (2 hours)

**Day 4** (Thursday):
- Create SuccessWithAction component (30 min)
- Implement 3-4 success messages (1 hour)
- Test happy paths

**Day 5** (Friday):
- Update StatWidget component (1 hour)
- Implement dashboard stats (1 hour)
- Review and deploy to staging

### Week 3 (Days 1-3)
**Day 1** (Monday):
- Implement onboarding flow (2 hours)
- Test complete onboarding flow

**Day 2** (Tuesday):
- Polish and refinement (2 hours)
- Fix any bugs or issues

**Day 3** (Wednesday):
- Final review with Rana
- Deploy to production
- Monitor user feedback

---

## GOTCHAS & COMMON ISSUES

### Issue 1: Emoji Not Rendering
**Problem**: Emoji look like boxes or question marks
**Solution**: Make sure you're using the actual emoji character, not a font icon. Test on Windows, which has the worst emoji support.

### Issue 2: Long Copy Breaking Layout
**Problem**: Some descriptions are longer and break the card layout
**Solution**: Add `line-clamp-3` utility class to limit to 3 lines with ellipsis

### Issue 3: Australian English Autocorrect
**Problem**: VS Code keeps changing "colour" to "color"
**Solution**: Update VS Code settings to use Australian English dictionary

### Issue 4: Copy Sounds Too Casual
**Problem**: Stakeholder feedback that it's "too informal"
**Solution**: Show them the voice guide. This is intentional for the tradie audience.

---

## QUESTIONS?

**Slack**: @claire or @rana
**Email**: claire@unite-group.in or rana@unite-group.in

**Have a quick question?** DM Rana on Slack

**Need design feedback?** Tag @design-team in #copy-review channel

---

## APPENDIX: Quick Reference

### Voice Principles
1. Clear Over Clever
2. Specific Over Generic
3. Benefit Over Feature
4. Action Over Passive
5. Honest Over Hyped

### Common Replacements
| DON'T Say | DO Say |
|-----------|--------|
| "Leverage AI" | "Use AI" |
| "Sophisticated algorithm" | "Smart system" |
| "Orchestrated workflows" | "Set it up once" |
| "Seamless integration" | "Connects directly" |
| "Actionable insights" | "What to do next" |
| "Transform your business" | "Get more callbacks" |

### Australian English
- colour (not color)
- organisation (not organization)
- centre (not center)
- A$ (not $ or AUD)
- 0400 XXX XXX (phone format)
- AEST/AEDT (not EST)

---

**Good luck with the implementation! You've got this. 💪**
