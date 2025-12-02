# Dashboard Redesign Specification
**Phase**: 3 (Transformation), Week 4
**Implementation Lead**: Claire (Frontend)
**Design Lead**: Phill
**Timeline**: 15 hours implementation
**Status**: Ready for Implementation

---

## Overview

Transform the generic dashboard into a context-aware, progressive disclosure interface that adapts to user journey stage and activity level.

---

## Current State Analysis

### File: `src/app/dashboard/overview/page.tsx` (294 lines)

**Current Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Header: "Generative Workspace"                          │
│ Subtitle: "X items ready for approval"                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Ready for Approval Section                              │
│ ┌──────┐ ┌──────┐ ┌──────┐                            │
│ │Card 1│ │Card 2│ │Card 3│ (horizontal scroll)        │
│ └──────┘ └──────┘ └──────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Current Stats Display**:
- `{pendingCount} Pending` badge
- `{deployedCount} Deployed Today` badge
- Static labels, no context

**Issues Identified**:
1. No progressive disclosure (all users see same view)
2. Generic stats don't reflect user needs
3. Horizontal scrolling on mobile is awkward
4. No intelligent empty states
5. No activity-based layout adaptation
6. Stats aren't actionable

---

## Design Goals

### 1. Progressive Disclosure
Show different dashboard views based on user journey stage:
- **New User** (0 content generated) → Onboarding focus
- **Active User** (1-10 approvals) → Approval workflow focus
- **Power User** (10+ approvals) → Batch operations + analytics

### 2. Context-Aware Stats
Replace generic counters with actionable insights:
- Instead of "12 Deployed Today" → "3 TikTok videos live, 47 views"
- Instead of "3 Pending" → "Your best-performing campaign needs approval"
- Add trend indicators (↑ +15% vs yesterday)

### 3. Adaptive Layout
Change layout density based on activity:
- **Low activity** → Card view (visual, spacious)
- **High activity** → List view (dense, scannable)
- **No activity** → Empty state with clear next action

### 4. Intelligent Empty States
Three types of empty states:
- **Zero state** (no content ever) → "Generate your first campaign"
- **Success state** (all approved) → "Great job! View analytics"
- **Loading state** (content generating) → Progress indicator

---

## User Journey Stages

### Stage 1: New User (First Login)
**Condition**: `totalContentGenerated === 0`

**Dashboard View**:
```tsx
<DashboardStage1>
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
  <QuickStartGuide
    steps={["1. Define audience", "2. Choose platform", "3. Generate content"]}
  />
</DashboardStage1>
```

**Stats Display**: Hidden (no data yet)

### Stage 2: Active User (1-10 Approvals)
**Condition**: `1 <= totalApprovals <= 10`

**Dashboard View**:
```tsx
<DashboardStage2>
  <ContextualStats
    stats={[
      {
        label: "Ready to Approve",
        value: pendingCount,
        action: "Review Now",
        priority: "high"
      },
      {
        label: "Live Campaigns",
        value: liveCount,
        trend: "+15%",
        action: "View Performance"
      },
      {
        label: "Next Generation",
        value: "2 hours",
        type: "countdown"
      }
    ]}
  />
  <ApprovalQueue
    items={pendingContent}
    layout="cards" // Visual, spacious
  />
  <RecentActivity
    limit={5}
    showTrends={true}
  />
</DashboardStage2>
```

**Stats Display**: 3 contextual stats (above)

### Stage 3: Power User (10+ Approvals)
**Condition**: `totalApprovals > 10`

**Dashboard View**:
```tsx
<DashboardStage3>
  <PerformanceOverview
    stats={[
      { metric: "Engagement Rate", value: "4.2%", trend: "+12%" },
      { metric: "Conversions", value: "23", trend: "+8%" },
      { metric: "Content Velocity", value: "8/day", trend: "steady" }
    ]}
  />
  <BatchOperations
    pendingCount={pendingCount}
    actions={["Approve All", "Schedule Review", "Export Report"]}
  />
  <ApprovalQueue
    items={pendingContent}
    layout="list" // Dense, scannable
    features={["bulk-select", "quick-actions", "inline-preview"]}
  />
  <AnalyticsSnapshot
    charts={["engagement", "conversions", "top-performing"]}
  />
</DashboardStage3>
```

**Stats Display**: 4-5 metrics with trends

---

## Component Specifications

### 1. ContextualStatCard Component

**File**: `src/components/dashboard/ContextualStatCard.tsx`

```tsx
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

export function ContextualStatCard({
  label,
  value,
  trend,
  action,
  priority = "medium",
  icon: Icon
}: ContextualStatCardProps) {
  // Priority styling
  const priorityStyles = {
    low: "border-gray-200 bg-gray-50",
    medium: "border-cyan-200 bg-cyan-50",
    high: "border-orange-300 bg-orange-50 shadow-md"
  };

  // Trend indicator
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    steady: "text-gray-600"
  };

  return (
    <Card className={priorityStyles[priority]}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${trendColors[trend.direction]}`}>
                {trend.direction === "up" && "↑"}
                {trend.direction === "down" && "↓"}
                {trend.direction === "steady" && "→"}
                {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
              <Icon className="w-6 h-6 text-cyan-600" />
            </div>
          )}
        </div>
        {action && (
          <ButtonPrimary
            onClick={action.onClick}
            className="w-full mt-4"
            size="sm"
          >
            {action.label}
          </ButtonPrimary>
        )}
      </CardContent>
    </Card>
  );
}
```

**Usage**:
```tsx
<ContextualStatCard
  label="Ready to Approve"
  value={pendingCount}
  priority="high"
  icon={AlertCircle}
  action={{
    label: "Review Now",
    onClick: () => router.push("/dashboard/approvals")
  }}
/>
```

### 2. ApprovalQueueLayout Component

**File**: `src/components/dashboard/ApprovalQueueLayout.tsx`

```tsx
interface ApprovalQueueLayoutProps {
  items: GeneratedContent[];
  layout: "cards" | "list";
  onApprove: (id: string) => void;
  onIterate: (id: string) => void;
  features?: ("bulk-select" | "quick-actions" | "inline-preview")[];
}

export function ApprovalQueueLayout({
  items,
  layout,
  onApprove,
  onIterate,
  features = []
}: ApprovalQueueLayoutProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (layout === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ApprovalCard
            key={item.id}
            {...item}
            onApprove={onApprove}
            onIterate={onIterate}
          />
        ))}
      </div>
    );
  }

  // List view (dense)
  return (
    <div className="space-y-2">
      {features.includes("bulk-select") && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onApproveAll={() => selectedIds.forEach(onApprove)}
          onClearSelection={() => setSelectedIds([])}
        />
      )}
      {items.map((item) => (
        <ApprovalListItem
          key={item.id}
          {...item}
          onApprove={onApprove}
          onIterate={onIterate}
          selected={selectedIds.includes(item.id)}
          onSelect={(id) => {
            setSelectedIds((prev) =>
              prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
            );
          }}
          showQuickActions={features.includes("quick-actions")}
          showInlinePreview={features.includes("inline-preview")}
        />
      ))}
    </div>
  );
}
```

### 3. EmptyStateVariants Component

**File**: `src/components/dashboard/EmptyStateVariants.tsx`

```tsx
type EmptyStateType = "zero" | "success" | "loading";

interface EmptyStateVariantsProps {
  type: EmptyStateType;
  onAction?: () => void;
}

export function EmptyStateVariants({ type, onAction }: EmptyStateVariantsProps) {
  if (type === "zero") {
    return (
      <EmptyState
        icon={Sparkles}
        title="Generate Your First Campaign"
        description="Let's create something amazing. Choose a platform and audience to get started."
        action={onAction}
        actionText="Start Creating"
      />
    );
  }

  if (type === "success") {
    return (
      <EmptyState
        icon={CheckCircle}
        title="All Caught Up!"
        description="Great job! All content has been reviewed. Check your analytics to see how campaigns are performing."
        action={onAction}
        actionText="View Analytics"
      />
    );
  }

  if (type === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="text-gray-600 mt-4">Generating content...</p>
        <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
      </div>
    );
  }

  return null;
}
```

### 4. DashboardStageRouter Component

**File**: `src/components/dashboard/DashboardStageRouter.tsx`

```tsx
interface UserStats {
  totalContentGenerated: number;
  totalApprovals: number;
  pendingCount: number;
  liveCount: number;
}

interface DashboardStageRouterProps {
  stats: UserStats;
  workspaceId: string;
}

export function DashboardStageRouter({ stats, workspaceId }: DashboardStageRouterProps) {
  // Determine stage
  const stage = useMemo(() => {
    if (stats.totalContentGenerated === 0) return "new";
    if (stats.totalApprovals <= 10) return "active";
    return "power";
  }, [stats]);

  // Stage-specific views
  if (stage === "new") {
    return (
      <DashboardNewUser
        workspaceId={workspaceId}
        onComplete={() => {
          // Trigger content generation
          router.push("/dashboard/campaigns");
        }}
      />
    );
  }

  if (stage === "active") {
    return (
      <DashboardActiveUser
        stats={stats}
        workspaceId={workspaceId}
      />
    );
  }

  return (
    <DashboardPowerUser
      stats={stats}
      workspaceId={workspaceId}
    />
  );
}
```

---

## Implementation Plan

### Step 1: Create Base Components (4h)
1. `ContextualStatCard.tsx` (1h)
2. `EmptyStateVariants.tsx` (1h)
3. `DashboardStageRouter.tsx` (1h)
4. `ApprovalQueueLayout.tsx` (1h)

### Step 2: Build Stage Views (5h)
1. `DashboardNewUser.tsx` (2h)
   - Welcome hero
   - Onboarding checklist
   - Quick start guide
2. `DashboardActiveUser.tsx` (2h)
   - Contextual stats (3 cards)
   - Approval queue (card layout)
   - Recent activity
3. `DashboardPowerUser.tsx` (1h)
   - Performance overview
   - Batch operations
   - Analytics snapshot

### Step 3: Update Main Dashboard Page (3h)
1. Replace current static layout with `DashboardStageRouter` (1h)
2. Add user stats fetching logic (1h)
3. Wire up stage detection (1h)

### Step 4: Testing & Polish (3h)
1. Test all three stages with mock data (1h)
2. Responsive design validation (mobile/tablet/desktop) (1h)
3. Accessibility audit (keyboard nav, screen reader) (1h)

---

## Data Requirements

### User Stats API Endpoint

**New Endpoint**: `GET /api/dashboard/user-stats?workspaceId={id}`

**Response**:
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
  "stage": "power" // or "new" | "active"
}
```

**Implementation**:
```typescript
// src/app/api/dashboard/user-stats/route.ts
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

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
    // ... calculate other metrics
  };

  return NextResponse.json(stats);
}
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
    <Section>
      <ApprovalQueueLayout items={content} layout="cards" />
    </Section>
  </ChatbotSafeZone>
</PageContainer>
```

### Color Palette (from design-system.css)

**Stats Card Priority Colors**:
- Low: `bg-gray-50 border-gray-200`
- Medium: `bg-cyan-50 border-cyan-200`
- High: `bg-orange-50 border-orange-300`

**Trend Indicators**:
- Up (positive): `text-green-600`
- Down (negative): `text-red-600`
- Steady: `text-gray-600`

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance
- [ ] All stat cards have `aria-label` with current value
- [ ] Trend indicators have text alternatives (not just arrows)
- [ ] Action buttons meet 44px minimum touch target
- [ ] Color is not the only indicator (use icons + text)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces stats changes
- [ ] Focus indicators visible on all interactive elements

### Testing
```bash
# Run axe-core accessibility audit
npm run test:a11y

# Manual screen reader test
# - NVDA (Windows)
# - VoiceOver (macOS)
```

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

## Testing Strategy

### Unit Tests
```typescript
// ContextualStatCard.test.tsx
describe("ContextualStatCard", () => {
  it("renders with priority styling", () => {
    render(<ContextualStatCard priority="high" label="Test" value={5} />);
    expect(screen.getByText("Test")).toHaveClass("bg-orange-50");
  });

  it("shows trend indicator when provided", () => {
    render(
      <ContextualStatCard
        label="Test"
        value={5}
        trend={{ direction: "up", value: "+15%" }}
      />
    );
    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText("+15%")).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// DashboardStageRouter.test.tsx
describe("DashboardStageRouter", () => {
  it("shows new user view when no content generated", () => {
    const stats = {
      totalContentGenerated: 0,
      totalApprovals: 0,
      pendingCount: 0,
      liveCount: 0
    };
    render(<DashboardStageRouter stats={stats} workspaceId="test" />);
    expect(screen.getByText("Generate Your First Campaign")).toBeInTheDocument();
  });

  it("shows power user view when 10+ approvals", () => {
    const stats = {
      totalContentGenerated: 50,
      totalApprovals: 15,
      pendingCount: 3,
      liveCount: 12
    };
    render(<DashboardStageRouter stats={stats} workspaceId="test" />);
    expect(screen.getByText("Batch Operations")).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
```typescript
// dashboard-redesign.spec.ts
test("dashboard adapts to user stage", async ({ page }) => {
  // Mock new user
  await page.route("**/api/dashboard/user-stats*", (route) =>
    route.fulfill({
      json: { totalContentGenerated: 0, totalApprovals: 0, pendingCount: 0, liveCount: 0 }
    })
  );

  await page.goto("/dashboard/overview");
  await expect(page.getByText("Generate Your First Campaign")).toBeVisible();

  // Mock power user
  await page.route("**/api/dashboard/user-stats*", (route) =>
    route.fulfill({
      json: { totalContentGenerated: 50, totalApprovals: 15, pendingCount: 3, liveCount: 12 }
    })
  );

  await page.reload();
  await expect(page.getByText("Batch Operations")).toBeVisible();
});
```

---

## Rollback Plan

### If Issues Arise
1. **Immediate**: Revert to `src/app/dashboard/overview/page.tsx.backup`
2. **Partial**: Disable stage routing, show Stage 2 (active) for all users
3. **Feature Flag**: Add `ENABLE_DASHBOARD_REDESIGN` env var

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
- [ ] Read this entire spec document
- [ ] Review Phase 37 design system docs
- [ ] Set up BrowserStack account for mobile testing
- [ ] Clone latest from main branch

### During Implementation
- [ ] Create feature branch: `feature/dashboard-redesign-phase3`
- [ ] Commit frequently with descriptive messages
- [ ] Test each component in isolation (Storybook optional)
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

### Q: What about users who want to see "all stats"?
A: Add a "Show All Metrics" toggle in settings (post-MVP). For now, progressive disclosure is mandatory.

### Q: Mobile-specific considerations?
A: On mobile (<768px), stack stats vertically, use card layout (not list) for approvals.

---

## Next Steps After Dashboard

Once dashboard redesign is complete:
1. Mobile bottom navigation design (Weeks 5-6)
2. Custom illustrations integration (Weeks 7-9)
3. Page transitions (Week 10)
4. Pricing page redesign (Weeks 11-12)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Status**: Ready for Implementation
**Estimated Hours**: 15 hours (Claire)
