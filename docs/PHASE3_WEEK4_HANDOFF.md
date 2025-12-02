# Phase 3 Week 4 - Dashboard Redesign Handoff

**Implementation Lead:** Claire (Frontend Agent)
**Design Lead:** Phill (AI-Phill)
**Timeline:** 15 hours implementation
**Status:** Ready for Week 4 Kickoff (Monday)

---

## Quick Reference

**What:** Transform dashboard from generic to context-aware progressive disclosure interface
**Why:** Current dashboard shows same view to all users (no personalization)
**How:** Build 3 stage views (New User → Active User → Power User) with adaptive layout

**Files to Create:**
- `src/components/dashboard/ContextualStatCard.tsx`
- `src/components/dashboard/ApprovalQueueLayout.tsx`
- `src/components/dashboard/EmptyStateVariants.tsx`
- `src/components/dashboard/DashboardStageRouter.tsx`
- `src/components/dashboard/DashboardNewUser.tsx`
- `src/components/dashboard/DashboardActiveUser.tsx`
- `src/components/dashboard/DashboardPowerUser.tsx`

**Files to Modify:**
- `src/app/dashboard/overview/page.tsx` (replace with DashboardStageRouter)
- `src/app/api/dashboard/user-stats/route.ts` (NEW endpoint)

---

## Implementation Steps (15 hours)

### Step 1: Create Base Components (4h)

#### 1.1 ContextualStatCard (1h)
**File:** `src/components/dashboard/ContextualStatCard.tsx`

**Features:**
- Priority styling (low/medium/high)
- Trend indicators (up/down/steady)
- Optional action button
- Icon badge with backdrop blur

**Props:**
```typescript
interface ContextualStatCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "steady";
    value: string; // e.g., "+15%"
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  priority?: "low" | "medium" | "high";
  icon?: React.ComponentType<{ className?: string }>;
}
```

**Priority Styles:**
- Low: `border-gray-200 bg-gray-50`
- Medium: `border-cyan-200 bg-cyan-50`
- High: `border-orange-300 bg-orange-50 shadow-md`

**Usage:**
```tsx
<ContextualStatCard
  label="Ready to Approve"
  value={pendingCount}
  priority="high"
  icon={AlertCircle}
  trend={{ direction: "up", value: "+3 today" }}
  action={{
    label: "Review Now",
    onClick: () => router.push("/dashboard/approvals")
  }}
/>
```

#### 1.2 EmptyStateVariants (1h)
**File:** `src/components/dashboard/EmptyStateVariants.tsx`

**Variants:**
- **Zero State:** No content ever generated → "Generate your first campaign"
- **Success State:** All approved → "Great job! View analytics"
- **Loading State:** Content generating → Progress indicator

**Props:**
```typescript
type EmptyStateType = "zero" | "success" | "loading";

interface EmptyStateVariantsProps {
  type: EmptyStateType;
  onAction?: () => void;
}
```

#### 1.3 DashboardStageRouter (1h)
**File:** `src/components/dashboard/DashboardStageRouter.tsx`

**Logic:**
```typescript
const stage = useMemo(() => {
  if (stats.totalContentGenerated === 0) return "new";
  if (stats.totalApprovals <= 10) return "active";
  return "power";
}, [stats]);
```

**Renders:**
- New → `<DashboardNewUser />`
- Active → `<DashboardActiveUser />`
- Power → `<DashboardPowerUser />`

#### 1.4 ApprovalQueueLayout (1h)
**File:** `src/components/dashboard/ApprovalQueueLayout.tsx`

**Layouts:**
- **Cards:** Grid layout (visual, spacious) for Active users
- **List:** Dense layout (scannable) for Power users

**Features:**
- Bulk select (Power users only)
- Quick actions (inline approve/decline)
- Inline preview

---

### Step 2: Build Stage Views (5h)

#### 2.1 DashboardNewUser (2h)
**File:** `src/components/dashboard/DashboardNewUser.tsx`

**Components:**
- WelcomeHero: "Welcome to Unite-Hub!"
- OnboardingChecklist: 3 steps (Connect brand → Set goals → Generate first campaign)
- QuickStartGuide: Step-by-step instructions

**Data Required:**
- User's name (from profile)
- Organization name
- Integration status (Gmail connected?)

**Layout:**
```tsx
<PageContainer>
  <WelcomeHero
    title="Welcome to Unite-Hub!"
    subtitle="Let's create your first campaign"
  />
  <OnboardingChecklist
    items={[
      { label: "Connect your brand", status: "pending" },
      { label: "Set your goals", status: "pending" },
      { label: "Generate first campaign", status: "pending" }
    ]}
  />
  <QuickStartGuide />
</PageContainer>
```

#### 2.2 DashboardActiveUser (2h)
**File:** `src/components/dashboard/DashboardActiveUser.tsx`

**Components:**
- 3 ContextualStatCards (Ready to Approve, Live Campaigns, Next Generation)
- ApprovalQueue (card layout)
- RecentActivity (last 5 activities)

**Stats Display:**
```tsx
<Grid cols={3} gap="md">
  <ContextualStatCard
    label="Ready to Approve"
    value={stats.pendingCount}
    priority="high"
    action={{ label: "Review Now", onClick: () => router.push("/dashboard/approvals") }}
  />
  <ContextualStatCard
    label="Live Campaigns"
    value={stats.liveCount}
    trend={{ direction: "up", value: "+15%" }}
  />
  <ContextualStatCard
    label="Next Generation"
    value="2 hours"
    type="countdown"
  />
</Grid>
```

#### 2.3 DashboardPowerUser (1h)
**File:** `src/components/dashboard/DashboardPowerUser.tsx`

**Components:**
- PerformanceOverview (4-5 metrics with trends)
- BatchOperations (Approve All, Schedule Review, Export Report)
- ApprovalQueue (list layout with bulk select)
- AnalyticsSnapshot (engagement, conversions, top-performing)

**Layout:**
```tsx
<PageContainer>
  <PerformanceOverview
    stats={[
      { metric: "Engagement Rate", value: "4.2%", trend: "+12%" },
      { metric: "Conversions", value: "23", trend: "+8%" },
      { metric: "Content Velocity", value: "8/day", trend: "steady" }
    ]}
  />
  <BatchOperations
    pendingCount={stats.pendingCount}
    actions={["Approve All", "Schedule Review", "Export Report"]}
  />
  <ApprovalQueue
    layout="list"
    features={["bulk-select", "quick-actions"]}
  />
</PageContainer>
```

---

### Step 3: Update Main Dashboard Page (3h)

#### 3.1 Replace Static Layout (1h)
**File:** `src/app/dashboard/overview/page.tsx`

**Before (Current):**
```tsx
export default async function DashboardOverview() {
  return (
    <div>
      <h1>Generative Workspace</h1>
      {/* Static content */}
    </div>
  );
}
```

**After (New):**
```tsx
import { DashboardStageRouter } from "@/components/dashboard/DashboardStageRouter";

export default async function DashboardOverview() {
  const workspaceId = getWorkspaceId(); // From auth context
  const stats = await getUserStats(workspaceId);

  return (
    <DashboardStageRouter
      stats={stats}
      workspaceId={workspaceId}
    />
  );
}
```

#### 3.2 Add User Stats API Endpoint (1h)
**File:** `src/app/api/dashboard/user-stats/route.ts`

**Endpoint:** `GET /api/dashboard/user-stats?workspaceId={id}`

**Response:**
```json
{
  "totalContentGenerated": 47,
  "totalApprovals": 32,
  "pendingCount": 3,
  "liveCount": 29,
  "lastApproval": "2025-12-01T14:30:00Z",
  "engagementRate": 4.2,
  "conversions": 23,
  "topPerformingPlatform": "tiktok",
  "stage": "power"
}
```

**Implementation:**
```typescript
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  const supabase = await getSupabaseServer();

  // Query generatedContent table
  const { data: content } = await supabase
    .from("generatedContent")
    .select("*")
    .eq("workspace_id", workspaceId);

  const stats = {
    totalContentGenerated: content.length,
    totalApprovals: content.filter(c => c.status === "approved").length,
    pendingCount: content.filter(c => c.status === "pending").length,
    liveCount: content.filter(c => c.status === "deployed").length,
  };

  return NextResponse.json(stats);
}
```

#### 3.3 Wire Up Stage Detection (1h)
- Test stage detection logic with mock data
- Handle edge cases (0 content but 10 approvals)
- Add loading states during stats fetch
- Implement skeleton loaders for stats cards

---

### Step 4: Testing & Polish (3h)

#### 4.1 Test All Three Stages (1h)
**Test Data:**
```typescript
// New User
const newUserStats = {
  totalContentGenerated: 0,
  totalApprovals: 0,
  pendingCount: 0,
  liveCount: 0
};

// Active User
const activeUserStats = {
  totalContentGenerated: 5,
  totalApprovals: 3,
  pendingCount: 2,
  liveCount: 3
};

// Power User
const powerUserStats = {
  totalContentGenerated: 50,
  totalApprovals: 42,
  pendingCount: 8,
  liveCount: 42
};
```

**Checklist:**
- [ ] New user sees onboarding checklist
- [ ] Active user sees 3 stats + approval queue (cards)
- [ ] Power user sees batch operations + approval queue (list)
- [ ] Stage detection works correctly
- [ ] Empty states show appropriate messages

#### 4.2 Responsive Design Validation (1h)
**Breakpoints:**
- Desktop (1920px): Full 3-column layout
- Laptop (1280px): 2-column responsive grid
- Tablet (768px): 2-column, stats stack
- Mobile (375px): Single column, card layout only

**Test:**
- [ ] Stats cards stack vertically on mobile
- [ ] Approval queue switches to card layout on <768px
- [ ] Buttons meet 44px touch target
- [ ] No horizontal scrolling
- [ ] Text remains readable at all sizes

#### 4.3 Accessibility Audit (1h)
**WCAG 2.1 AA Compliance:**
- [ ] All stat cards have `aria-label` with current value
- [ ] Trend indicators have text alternatives (not just arrows)
- [ ] Action buttons meet 44px minimum touch target
- [ ] Color is not the only indicator (use icons + text)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces stats changes
- [ ] Focus indicators visible on all interactive elements

**Tools:**
```bash
# Run axe-core accessibility audit
npm run test:a11y

# Manual screen reader test
# - NVDA (Windows)
# - VoiceOver (macOS)
```

---

## Data Requirements

### User Stats Schema
```typescript
interface UserStats {
  totalContentGenerated: number;
  totalApprovals: number;
  pendingCount: number;
  liveCount: number;
  lastApproval?: string; // ISO timestamp
  engagementRate?: number;
  conversions?: number;
  topPerformingPlatform?: string;
  stage?: "new" | "active" | "power"; // Optional (calculated)
}
```

### Database Queries

**Query 1: Count Content by Status**
```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'deployed') AS deployed
FROM generatedContent
WHERE workspace_id = $1;
```

**Query 2: Last Approval Timestamp**
```sql
SELECT MAX(updated_at) AS last_approval
FROM generatedContent
WHERE workspace_id = $1 AND status = 'approved';
```

---

## Design System Integration

### Using Phase 37 Components
```tsx
import {
  PageContainer,
  Section,
  Grid,
  ChatbotSafeZone,
  Card,
  CardContent,
  EmptyState,
  Spinner
} from "@/ui";

<PageContainer maxWidth="xl">
  <ChatbotSafeZone>
    <Section>
      <Grid cols={3} gap="md">
        <ContextualStatCard {...stat1} />
        <ContextualStatCard {...stat2} />
        <ContextualStatCard {...stat3} />
      </Grid>
    </Section>
  </ChatbotSafeZone>
</PageContainer>
```

### Color Palette
**Stats Card Priority Colors:**
- Low: `bg-gray-50 border-gray-200`
- Medium: `bg-cyan-50 border-cyan-200`
- High: `bg-orange-50 border-orange-300`

**Trend Indicators:**
- Up (positive): `text-green-600`
- Down (negative): `text-red-600`
- Steady: `text-gray-600`

---

## Performance Budget

### Bundle Size Impact
- New components: ~8KB gzipped
- No new dependencies
- Tree-shakeable imports

### Lighthouse Targets
- Performance: 90+ (maintain current)
- Accessibility: 95+ (improve from 88)
- No CLS (layout shift) during stage detection

### Optimization Tips
1. Lazy load stage views (React.lazy)
2. Memoize stats calculations (useMemo)
3. Debounce real-time updates
4. Use skeleton loaders during data fetch

---

## Rollback Plan

### If Issues Arise
1. **Immediate:** Revert to `src/app/dashboard/overview/page.tsx.backup`
2. **Partial:** Disable stage routing, show Stage 2 (active) for all users
3. **Feature Flag:** Add `ENABLE_DASHBOARD_REDESIGN` env var

### Monitoring
- Track Lighthouse scores before/after
- Monitor error rates in Sentry
- Check user engagement metrics (time on page, interactions)

---

## Success Criteria

### Functional Requirements
- [ ] All three stages render correctly
- [ ] Stats fetch from API and display accurately
- [ ] Empty states show appropriate messages
- [ ] Progressive disclosure logic works based on user stats
- [ ] Responsive design works on mobile/tablet/desktop

### Quality Requirements
- [ ] Lighthouse Performance: 90+
- [ ] Lighthouse Accessibility: 95+
- [ ] No console errors or warnings
- [ ] All tests pass (unit + integration + e2e)
- [ ] Code review approved by Phill

### User Experience Requirements
- [ ] Dashboard loads in <1 second
- [ ] Layout doesn't shift during stage detection
- [ ] Action buttons have clear labels and feedback
- [ ] Empty states provide clear next steps
- [ ] Stats are actionable (have click handlers)

---

## Handoff Checklist for Claire

### Before Starting
- [ ] Read this handoff doc + `DASHBOARD_REDESIGN_SPEC.md`
- [ ] Review Phase 37 design system docs
- [ ] Clone latest from main branch
- [ ] Verify dev environment runs (http://localhost:3008)

### During Implementation
- [ ] Create feature branch: `feature/phase3-week4-dashboard`
- [ ] Commit frequently with descriptive messages
- [ ] Test each component in isolation
- [ ] Run accessibility audit after each major component

### Before Pull Request
- [ ] All tests pass locally
- [ ] Lighthouse scores meet targets
- [ ] Responsive design validated on 3 devices
- [ ] Accessibility audit clean
- [ ] Code formatted with Prettier
- [ ] No console errors or warnings

### Pull Request
- [ ] Link to this spec in PR description
- [ ] Include screenshots of all three stages
- [ ] List any deviations from spec
- [ ] Tag Phill for review

---

## Questions & Answers

### Q: What if API is slow to return stats?
A: Show skeleton loaders for stats cards. Default to Stage 2 (active) view until data loads.

### Q: How do we handle edge cases (e.g., 0 content but 10 approvals)?
A: Shouldn't happen, but default to Stage 2. Add logging to track anomalies.

### Q: Should we persist stage preference?
A: No, always calculate dynamically based on current stats. User's stage can change day-to-day.

### Q: Mobile-specific considerations?
A: On mobile (<768px), stack stats vertically, use card layout (not list) for approvals.

---

## Monday Kickoff Agenda (1 hour)

**Attendees:** Claire, Phill, Rana (optional)

**Agenda:**
1. **Review Spec** (15 min)
   - Walk through this handoff doc
   - Clarify any questions
   - Confirm timeline (15 hours over Week 4)

2. **Design Demo** (15 min)
   - Show existing modern dashboard demo (http://localhost:3008/modern-demo)
   - Point out reusable components (StatsCard, ProjectCard, etc.)
   - Explain how to adapt for progressive disclosure

3. **Technical Walkthrough** (20 min)
   - File structure review
   - API endpoint creation
   - State management approach
   - Testing strategy

4. **Confirm Deliverables** (10 min)
   - Stage 1: New User view
   - Stage 2: Active User view
   - Stage 3: Power User view
   - User stats API endpoint
   - Full responsive validation

**Next Steps After Meeting:**
- Claire starts with Step 1 (base components)
- Daily standups (15 min) to track progress
- Mid-week check-in (Wednesday) for course correction
- Final review Friday (ready for Phase 3 completion)

---

**Document Version:** 1.0
**Created:** 2025-12-02
**Status:** Ready for Week 4 Kickoff
**Implementation Lead:** Claire (Frontend Agent)
**Design Lead:** Phill (AI-Phill)
