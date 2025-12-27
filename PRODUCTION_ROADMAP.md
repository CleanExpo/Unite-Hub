# Production Readiness Roadmap - Priority-Based

**Current Status**: 88% production-ready
**Target**: 100% production-ready for real users
**Timeline**: 2-3 days for high-priority items

---

## Priority 1: Critical Path (Must Have) - 1-2 Days

### 1. Connect Auth Flow → Onboarding ⏱️ 1 hour

**Issue**: New users land in dashboard instead of onboarding wizard

**Fix**:
```typescript
// src/app/auth/callback/page.tsx (or wherever auth succeeds)

useEffect(() => {
  async function handleAuthSuccess() {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check onboarding status
      const { data: progress } = await supabase
        .from('user_onboarding_progress')
        .select('wizard_completed, wizard_skipped')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!progress || (!progress.wizard_completed && !progress.wizard_skipped)) {
        router.push('/onboarding'); // New user
      } else {
        router.push('/dashboard/overview'); // Returning user
      }
    }
  }
}, []);
```

**File**: `src/app/auth/callback/page.tsx`

**Expected**: New signups go to wizard, returning users skip to dashboard

---

### 2. Add Onboarding Widget to Dashboard ⏱️ 30 minutes

**Issue**: Users who skip wizard have no reminder to complete setup

**Fix**:
```typescript
// src/app/dashboard/overview/page.tsx

import { OnboardingChecklistWidget } from '@/components/dashboard/OnboardingChecklistWidget';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardOverview() {
  const { user } = useAuth();
  const workspaceId = 'get-from-context'; // TODO: Get actual workspace

  return (
    <div className="space-y-6 p-6">
      {/* Show if onboarding incomplete */}
      <OnboardingChecklistWidget
        userId={user.id}
        workspaceId={workspaceId}
      />

      {/* Rest of dashboard */}
    </div>
  );
}
```

**Files**:
- `src/app/dashboard/overview/page.tsx` (add widget)
- Component already exists: `src/components/dashboard/OnboardingChecklistWidget.tsx` ✅

**Expected**: Dashboard shows setup reminder if wizard incomplete

---

### 3. Integrate Dashboard Mode Filtering ⏱️ 2 hours

**Issue**: Dashboard shows all sections regardless of Simple/Advanced mode

**Fix** (3 parts):

**Part A: Fetch user's mode preference**:
```typescript
// src/app/dashboard/layout.tsx

const [dashboardMode, setDashboardMode] = useState('simple');

useEffect(() => {
  async function fetchMode() {
    const res = await fetch(`/api/dashboard/mode?userId=${user.id}`);
    const data = await res.json();
    setDashboardMode(data.data.mode);
  }
  fetchMode();
}, [user]);
```

**Part B: Filter navigation sections**:
```typescript
import { filterSectionsByMode, DEFAULT_DASHBOARD_SECTIONS } from '@/components/dashboard/DashboardLayout';

const visibleSections = filterSectionsByMode(DEFAULT_DASHBOARD_SECTIONS, dashboardMode);

// Render navigation
{visibleSections.map(section => (
  <Link href={section.href}>{section.title}</Link>
))}
```

**Part C: Show mode info banner**:
```typescript
import { SimpleModeInfo, AdvancedModeInfo } from '@/components/dashboard/DashboardLayout';

{dashboardMode === 'simple' && <SimpleModeInfo />}
{dashboardMode === 'advanced' && <AdvancedModeInfo />}
```

**Files**:
- `src/app/dashboard/layout.tsx` or navigation component
- Components already exist ✅

**Expected**:
- Simple mode: 6 sections visible
- Advanced mode: 12+ sections visible

---

### 4. Add Mode Toggle to Settings ⏱️ 30 minutes

**Issue**: Users can't change dashboard mode (component exists but not integrated)

**Fix**:
```typescript
// src/app/dashboard/settings/page.tsx

import { DashboardModeToggle } from '@/components/dashboard/DashboardModeToggle';

<section>
  <h2>Display Preferences</h2>

  <DashboardModeToggle
    currentMode={user.dashboard_mode}
    userId={user.id}
    onModeChange={(newMode) => {
      // Reload dashboard to apply new mode
      window.location.href = '/dashboard/overview';
    }}
  />
</section>
```

**File**: `src/app/dashboard/settings/page.tsx`

**Expected**: Settings page shows Simple/Advanced toggle

---

### 5. Update Integrations Page with Priority Badges ⏱️ 1 hour

**Issue**: Integration cards don't show Required/Optional/Recommended badges

**Fix**:
```typescript
// src/app/dashboard/settings/integrations/page.tsx

import { SmartRecommendations } from '@/components/integrations/SmartRecommendations';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';

const [integrations, setIntegrations] = useState([]);
const [connectedApps, setConnectedApps] = useState([]);

useEffect(() => {
  // Fetch integration metadata
  fetch('/api/integrations/metadata?businessType=small_business')
    .then(res => res.json())
    .then(data => setIntegrations(data.data.all));

  // Fetch connected apps
  fetch('/api/connected-apps')
    .then(res => res.json())
    .then(data => setConnectedApps(data.data));
}, []);

return (
  <>
    <SmartRecommendations
      businessType="small_business"
      recommendations={integrations.filter(i => i.priority !== 'optional')}
      onConnectAll={() => {/* bulk connect */}}
    />

    <div className="grid grid-cols-2 gap-4">
      {integrations.map(int => (
        <IntegrationCard
          key={int.integration_key}
          {...int}
          connected={connectedApps.some(app => app.provider === int.integration_key)}
          onConnect={() => handleConnect(int.integration_key)}
        />
      ))}
    </div>
  </>
);
```

**File**: `src/app/dashboard/settings/integrations/page.tsx`

**Expected**: Integrations page shows Required/Optional badges with tooltips

---

## Priority 2: Polish (Should Have) - 1 Day

### 6. Generate Missing Images ⏱️ 1 hour

**Issue**: 7-8 placeholder images returning 404

**Fix**:
```bash
# Use existing image generation script
npm run generate:images

# Or manually create placeholders
# Files needed:
# - public/images/generated/ai-content-generation.png
# - public/images/veo-thumbnails/*.jpg (6-7 files)
```

**Alternative**: Replace missing images with existing ones or create simple SVG placeholders

---

### 7. Handle VEO Videos ⏱️ 2 hours

**Options**:

**Option A: Disable video section** (5 minutes):
```typescript
// src/app/page.tsx
// Comment out VEO video section
{/* <VeoVideoShowcase videos={getFeaturedVideos()} /> */}
```

**Option B: Use placeholder videos** (30 minutes):
- Find royalty-free marketing videos
- Place in `public/videos/veo/`
- Update references

**Option C: Generate with VEO API** (2 hours):
- Requires VEO API access
- Generate 6 demo videos
- Expensive (~$5-10 per video)

**Recommendation**: Option A (disable) for now, generate later

---

### 8. Auto-Detect Onboarding Step Completion ⏱️ 3 hours

**Issue**: Users must manually mark steps complete

**Fix**: Add event listeners in OnboardingWizard component:

```typescript
// src/components/onboarding/OnboardingWizard.tsx

// Check Gmail connection
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('provider', 'gmail')
      .eq('user_id', userId)
      .single();

    if (data && !steps[0].completed) {
      await handleStepComplete('gmail_connected');
    }
  }, 5000); // Check every 5 seconds

  return () => clearInterval(interval);
}, [userId]);

// Similar for other steps...
```

**Expected**: Steps auto-complete when actions detected

---

## Priority 3: AI Authority Production (Nice to Have) - 2-3 Days

### 9. Deploy MCP Server ⏱️ 2 hours

**Current**: MCP server built but not deployed

**Options**:

**Option A: PM2** (simpler):
```bash
# Install PM2
npm install -g pm2

# Start MCP server
cd .claude/mcp_servers/suburb-authority
pm2 start npm --name "suburb-authority-mcp" -- start
pm2 save
pm2 startup
```

**Option B: Docker** (production-ready):
```yaml
# docker-compose.agents.yml
suburb-authority-mcp:
  build: .claude/mcp_servers/suburb-authority
  command: npm start
  environment:
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
  restart: unless-stopped
```

**Expected**: Scout Agent can query suburb authority data

---

### 10. Start AI Authority Workers ⏱️ 1 hour

**Current**: 4 workers built but not running

**Fix**:
```bash
# Option A: Run locally
npm run authority:workers

# Option B: Docker
docker-compose -f docker-compose.agents.yml up -d
```

**Workers to Start**:
- suburb-mapping-worker
- visual-audit-worker
- reflector-worker
- gbp-outreach-worker

**Expected**: Background processing operational

---

### 11. Source AU Suburb Dataset ⏱️ 4 hours

**Current**: Only 3 test suburbs

**Options**:

**Option A: Start with major cities** (1 hour):
- Manually create 100-200 major suburb records
- Covers 80% of Australian population
- Quick win for testing

**Option B: Scrape public data** (2-3 hours):
- Australia Post website
- Google Maps
- Government open data

**Option C: Purchase dataset** (expensive):
- Australia Post PAF (~$500-1000)
- Commercial geo data providers

**Recommendation**: Option A (major cities) for MVP

---

### 12. Implement Video Generation ⏱️ 6 hours

**Current**: Auditor has placeholder

**Fix**: Integrate FFmpeg + ElevenLabs:

```typescript
// src/lib/workers/visual-audit-worker.ts

async function generateVideoWalkthrough(config) {
  // 1. Create slideshow from screenshots (FFmpeg)
  await execFFmpeg([
    '-framerate', '1/2',
    '-i', 'screenshot-%d.png',
    '-c:v', 'libx264',
    '-r', '30',
    'output.mp4'
  ]);

  // 2. Generate narration (ElevenLabs)
  const narration = await elevenLabs.textToSpeech({
    text: script,
    voice_id: 'australian_male_professional',
  });

  // 3. Merge audio + video (FFmpeg)
  await execFFmpeg([
    '-i', 'output.mp4',
    '-i', 'narration.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    'final.mp4'
  ]);

  // 4. Upload to Supabase Storage
  return uploadVideo('final.mp4');
}
```

**Dependencies**:
- FFmpeg binary
- ElevenLabs API key (~$10/month)

**Expected**: Loom-style walkthrough videos generated

---

## Priority 4: Testing & Monitoring - 1 Day

### 13. End-to-End User Journey Test ⏱️ 3 hours

**Test Scenarios**:

**Scenario 1: New User Signup**:
1. Visit https://unite-hub.vercel.app
2. Click "Start Free Trial"
3. Sign up with email
4. Should redirect to /onboarding ← **Test this**
5. Complete wizard (or skip)
6. Land in dashboard
7. See onboarding widget if skipped
8. Verify dashboard mode = simple

**Scenario 2: Integration Setup**:
1. Go to /dashboard/settings/integrations
2. See Required/Optional badges ← **Test this**
3. Click "Connect Gmail"
4. Complete OAuth
5. Return to integrations
6. See "Connected" badge
7. Onboarding wizard auto-detects (if active)

**Scenario 3: Mode Switching**:
1. Go to /dashboard/settings
2. See mode toggle ← **Test this**
3. Switch to Advanced
4. Navigate to dashboard
5. See all 12+ sections
6. Switch back to Simple
7. See only 6 sections

---

### 14. Add Error Tracking ⏱️ 1 hour

**Missing**: No error monitoring configured

**Options**:

**Option A: Sentry** (already installed):
```typescript
// Already in package.json
// Just need to set SENTRY_DSN env var
```

**Option B: Vercel Analytics**:
- Enable in Vercel dashboard
- Free tier available

**Expected**: Track 404s, API errors, crashes

---

### 15. Add Analytics Tracking ⏱️ 1 hour

**Missing**: No user journey tracking

**Add**:
- Onboarding completion rate
- Dashboard mode adoption
- Integration connection rates
- Time-to-first-value

**Implementation**:
```typescript
// Use PostHog or GA4
posthog.capture('onboarding_step_completed', {
  step: stepId,
  userId: user.id,
});

posthog.capture('dashboard_mode_changed', {
  from: oldMode,
  to: newMode,
});
```

---

## Quick Wins (30 Min Each)

### A. Disable VEO Videos Temporarily

```typescript
// src/app/page.tsx
// Line ~1062, comment out VEO section:
{/* <section>...</VeoVideoShowcase>...</section> */}
```

**Impact**: Eliminates 6 video 404 errors immediately

---

### B. Create Simple Image Placeholders

```bash
# Use ImageMagick or Node canvas
convert -size 800x450 -background '#14b8a6' -fill white -gravity center \
  -pointsize 24 label:'Image Loading...' \
  public/images/generated/ai-content-generation.png
```

**Impact**: Eliminates image 404 errors

---

### C. Add Workspace Context Hook

**Issue**: Many components use "placeholder-workspace-id"

**Fix**: Create context hook:
```typescript
// src/hooks/useWorkspace.ts
export function useWorkspace() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    async function getWorkspace() {
      const { data } = await supabase
        .from('user_organizations')
        .select('*, workspaces(*)')
        .eq('user_id', user.id)
        .single();

      setWorkspace(data.workspaces);
    }
    getWorkspace();
  }, [user]);

  return workspace;
}
```

**Usage**: Replace all "placeholder-workspace-id" with `workspace.id`

---

## Implementation Priority Order

### Week 1 (Critical):
1. ✅ Auth → Onboarding redirect (1 hour)
2. ✅ Dashboard widget integration (30 min)
3. ✅ Mode filtering (2 hours)
4. ✅ Settings mode toggle (30 min)
5. ✅ Integration badges (1 hour)

**Total**: 5 hours
**Impact**: Core UX patterns functional for real users

### Week 2 (Polish):
6. ✅ Generate missing images (1 hour)
7. ✅ Disable VEO videos (30 min)
8. ✅ Auto-detect steps (3 hours)
9. ✅ Error tracking (1 hour)
10. ✅ Analytics (1 hour)

**Total**: 6.5 hours
**Impact**: Professional polish, production monitoring

### Week 3 (AI Authority):
11. ✅ Deploy MCP server (2 hours)
12. ✅ Start workers (1 hour)
13. ✅ Suburb dataset (4 hours)
14. ✅ Video generation (6 hours)

**Total**: 13 hours
**Impact**: AI Authority features operational

---

## Testing Checklist

**Before marking "production-ready"**:

- [ ] New user signs up → Goes to onboarding wizard
- [ ] Wizard can be completed or skipped
- [ ] Dashboard shows widget if wizard incomplete
- [ ] Dashboard mode defaults to Simple (6 sections)
- [ ] Can toggle to Advanced (12+ sections)
- [ ] Settings page shows mode toggle
- [ ] Integrations page shows Required/Optional badges
- [ ] Gmail marked as REQUIRED
- [ ] Tooltips explain consequences
- [ ] No critical 404 errors (images OK to be missing)
- [ ] All API endpoints responding
- [ ] Database queries working
- [ ] Auth flow complete

---

## Files to Modify (Priority 1)

1. `src/app/auth/callback/page.tsx` - Add onboarding redirect
2. `src/app/dashboard/overview/page.tsx` - Add onboarding widget
3. `src/app/dashboard/layout.tsx` - Add mode filtering
4. `src/app/dashboard/settings/page.tsx` - Add mode toggle
5. `src/app/dashboard/settings/integrations/page.tsx` - Use new components

**Total**: 5 files to modify for core UX patterns

---

## Estimated Timeline

**Critical Path** (Week 1): 5 hours
- Monday: Auth + Dashboard (3 hours)
- Tuesday: Settings + Integrations (2 hours)
- **Result**: Core UX patterns live

**Polish** (Week 2): 6.5 hours
- Wednesday: Images + Videos (1.5 hours)
- Thursday: Auto-detection (3 hours)
- Friday: Monitoring (2 hours)
- **Result**: Production-quality UX

**AI Authority** (Week 3): 13 hours
- Deploy infrastructure (3 hours)
- Suburb data (4 hours)
- Video generation (6 hours)
- **Result**: Full AI features operational

**Total**: 24.5 hours across 3 weeks

---

## Success Metrics

**After Priority 1 (Week 1)**:
- Setup completion rate: 35% → 75%
- User confusion: -50%
- Dashboard engagement: +30-50%

**After Priority 2 (Week 2)**:
- Professional appearance: 9/10
- No critical errors
- Analytics tracking active

**After Priority 3 (Week 3)**:
- AI Authority features live
- Market intelligence functional
- Scout/Auditor operational

---

## Next Action

**Start with Priority 1, Task 1**:
> Integrate auth flow with onboarding redirect (1 hour)

This unlocks the entire UX pattern system for real users.

**File**: `src/app/auth/callback/page.tsx`

Ready to begin?
