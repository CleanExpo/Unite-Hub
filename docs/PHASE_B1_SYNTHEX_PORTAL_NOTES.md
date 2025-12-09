# Phase B1 - Synthex Portal MVP Skeleton

**Phase**: B1 - Synthex Portal MVP Scaffold
**Generated**: 2025-12-06
**Status**: In Progress

---

## 1. Current Synthex Entrypoints

### Route Structure Discovery

There are TWO separate Synthex directories:

| Directory | Purpose | Status |
|-----------|---------|--------|
| `src/app/(synthex)/` | Route group with layout | Layout exists, 1 placeholder page |
| `src/app/synthex/` | Actual Synthex pages | Dashboard + Onboarding exist |

### Key Files Found

| File | Purpose | Status |
|------|---------|--------|
| `src/app/(synthex)/layout.tsx` | Main Synthex portal layout with header, nav, footer | **EXISTS - GOOD** |
| `src/app/(synthex)/client-dashboard/page.tsx` | Placeholder dashboard | EXISTS (basic placeholder) |
| `src/app/synthex/dashboard/page.tsx` | Feature-rich dashboard with tabs | **EXISTS - COMPREHENSIVE** |
| `src/app/synthex/onboarding/page.tsx` | 4-step onboarding flow | **EXISTS - WORKING** |

### Navigation Items in Layout

The `(synthex)/layout.tsx` defines these navigation items:

| Label | Route | Status |
|-------|-------|--------|
| Home | `/synthex/dashboard` | Page exists at `synthex/dashboard/` |
| Workspace | `/synthex/workspace` | **MISSING** |
| My Ideas | `/synthex/ideas` | **MISSING** |
| Projects | `/synthex/projects` | **MISSING** |
| Campaigns | `/synthex/campaigns` | **MISSING** |
| Analytics | `/synthex/analytics` | **MISSING** |
| SEO Reports | `/synthex/seo` | **MISSING** |
| Content Library | `/synthex/content` | **MISSING** |
| Digital Vault | `/synthex/vault` | **MISSING** |
| AI Assistant | `/synthex/assistant` | **MISSING** |

### Routing Architecture Decision

**Issue**: The `(synthex)` layout navigation points to `/synthex/...` routes, but those routes are NOT inside the `(synthex)` route group, so they don't use the layout.

**Solution**: Create all Synthex portal pages under `src/app/(synthex)/` route group so they inherit the layout. The navigation hrefs will be updated to use relative paths that work with the route group.

---

## 2. Synthex Portal Page Matrix

### Core Pages (Priority P0 - Must Have)

| Route | File Path | Title | Purpose | Backlog ID | Status |
|-------|-----------|-------|---------|------------|--------|
| `/synthex/dashboard` | `(synthex)/dashboard/page.tsx` | Dashboard | Main KPIs, activity feed, quick actions | SYNTHEX-001 | TO CREATE |
| `/synthex/workspace` | `(synthex)/workspace/page.tsx` | AI Workspace | Content generation, AI interaction | SYNTHEX-002 | TO CREATE |
| `/synthex/campaigns` | `(synthex)/campaigns/page.tsx` | Campaigns | Email/drip campaign management | SYNTHEX-003 | TO CREATE |
| `/synthex/seo` | `(synthex)/seo/page.tsx` | SEO Reports | SEO audits, rankings, recommendations | SYNTHEX-004 | TO CREATE |
| `/synthex/content` | `(synthex)/content/page.tsx` | Content Library | Generated content, drafts, approvals | SYNTHEX-005 | TO CREATE |

### Secondary Pages (Priority P1 - Important)

| Route | File Path | Title | Purpose | Backlog ID | Status |
|-------|-----------|-------|---------|------------|--------|
| `/synthex/analytics` | `(synthex)/analytics/page.tsx` | Analytics | Performance metrics, channel stats | SYNTHEX-006 | TO CREATE |
| `/synthex/assistant` | `(synthex)/assistant/page.tsx` | AI Assistant | Chat interface with Claude | SYNTHEX-010 | TO CREATE |

### Nice-to-Have Pages (Priority P2)

| Route | File Path | Title | Purpose | Backlog ID | Status |
|-------|-----------|-------|---------|------------|--------|
| `/synthex/projects` | `(synthex)/projects/page.tsx` | Projects | Project/client organization | SYNTHEX-007 | TO CREATE |
| `/synthex/ideas` | `(synthex)/ideas/page.tsx` | My Ideas | Idea capture and planning | SYNTHEX-008 | TO CREATE |
| `/synthex/vault` | `(synthex)/vault/page.tsx` | Digital Vault | Brand assets, credentials | SYNTHEX-009 | TO CREATE |

### Settings/Account Pages (Required)

| Route | File Path | Title | Purpose | Status |
|-------|-----------|-------|---------|--------|
| `/synthex/settings` | `(synthex)/settings/page.tsx` | Settings | Account, integrations, preferences | TO CREATE |

---

## 3. Marketing/Support Pages Status

### Previously "Missing" - Now Verified

| Page | Route | Status | File Path |
|------|-------|--------|-----------|
| Contact | `/contact` | **EXISTS** | `(marketing)/contact/page.tsx` |
| Terms | `/terms` | **EXISTS** | `(marketing)/terms/page.tsx` |
| Privacy | `/privacy` | **EXISTS** | `(marketing)/privacy/page.tsx` |
| Support | `/support` | **EXISTS** | `(marketing)/support/page.tsx` |
| Forgot Password | `/forgot-password` | **EXISTS** | `(auth)/forgot-password/page.tsx` |

### Still Missing

| Page | Route | Status | Action |
|------|-------|--------|--------|
| Blog Detail | `/blog/[slug]` | MISSING | Create dynamic route (Phase B2) |

---

## 4. Architecture Decisions

### 4.1 Layout Consolidation

**Decision**: Use the `(synthex)` route group as the canonical Synthex portal container.

**Rationale**:
- The layout already has header, navigation, and footer
- Role-based access control is implemented
- Subscription tier validation exists
- All navigation items point to `/synthex/...` paths

**Implementation**:
- Create all new pages under `src/app/(synthex)/`
- Navigation will use `/synthex/...` paths which resolve correctly
- The existing `synthex/dashboard/page.tsx` code can be referenced for component patterns

### 4.2 Component Reuse

The existing `synthex/dashboard/page.tsx` contains useful components:
- `JobProgressCard` - Job status display
- `VisualGenerationPanel` - Image generation
- `VideoCreationPanel` - Video creation
- `SeoAnalysisPanel` - SEO analysis
- `WebsitePreviewPanel` - Website preview

These can be reused or referenced when implementing full functionality in later phases.

### 4.3 Skeleton Pattern

Each skeleton page will include:
1. Page title and description
2. Placeholder sections with TODO markers
3. Agent UI anchor points (disabled buttons for future phases)
4. Consistent styling using existing design system

---

## 5. Agent UI Anchor Points

### Dashboard
- `// TODO[PHASE_B4]: Agent status widget`
- `// TODO[PHASE_B4]: Agent activity feed`

### Workspace
- `// TODO[PHASE_B3]: Content generation trigger (Content Agent)`
- `// TODO[PHASE_B4]: AI assistant integration`

### Campaigns
- `// TODO[PHASE_B3]: Campaign execution (Email Campaign Runner Skill)`
- `// TODO[PHASE_B4]: Campaign automation settings`

### SEO
- `// TODO[PHASE_B2]: SEO audit trigger (Website Auditor Skill)`
- `// TODO[PHASE_B4]: Scheduled audit configuration`

### Content
- `// TODO[PHASE_B3]: Content approval workflow`
- `// TODO[PHASE_B4]: Content scheduling`

---

## 6. Link Fixes Applied

| Original Link | Issue | Fix |
|---------------|-------|-----|
| `/contact` | Was marked missing | Verified EXISTS |
| `/terms` | Was marked missing | Verified EXISTS |
| `/privacy` | Was marked missing | Verified EXISTS |
| `/support` | Layout links to this | Verified EXISTS |
| `/forgot-password` | Login links to this | Verified EXISTS |

---

## 7. Files Created in Phase B1

| File | Purpose |
|------|---------|
| `docs/PHASE_B1_SYNTHEX_PORTAL_NOTES.md` | This document |
| `src/app/(synthex)/dashboard/page.tsx` | Main dashboard skeleton |
| `src/app/(synthex)/workspace/page.tsx` | AI workspace skeleton |
| `src/app/(synthex)/campaigns/page.tsx` | Campaigns skeleton |
| `src/app/(synthex)/seo/page.tsx` | SEO reports skeleton |
| `src/app/(synthex)/content/page.tsx` | Content library skeleton |
| `src/app/(synthex)/analytics/page.tsx` | Analytics skeleton |
| `src/app/(synthex)/assistant/page.tsx` | AI assistant skeleton |
| `src/app/(synthex)/projects/page.tsx` | Projects skeleton |
| `src/app/(synthex)/ideas/page.tsx` | Ideas skeleton |
| `src/app/(synthex)/vault/page.tsx` | Digital vault skeleton |
| `src/app/(synthex)/settings/page.tsx` | Settings skeleton |

---

*Generated by Claude Code Phase B1*
