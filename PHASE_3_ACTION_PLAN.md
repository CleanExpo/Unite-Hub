# 🚀 Phase 3: Action Plan - Navigation & Integration

**Date:** 2025-11-14
**Status:** 📋 Ready to Execute
**Priority:** HIGH - Critical navigation fixes needed

---

## 🎯 Phase 3 Goals

1. ✅ Fix all 404 broken navigation links
2. ✅ Add demo mode for testing dashboard pages
3. ✅ Align navigation with actual page structure
4. ✅ Prepare for Supabase integration

---

## 📋 Todo List (Prioritized)

### **CRITICAL - Fix Broken Navigation (Must Do First)**

#### ✅ Task 1: Create Team Page
- **File:** `src/app/dashboard/team/page.tsx`
- **Components to Use:** TeamCapacity, StatsCard
- **Content:**
  - Team member grid with capacity bars
  - Quick stats (total members, available, over capacity)
  - "Add Team Member" button
  - Individual team member cards
- **Estimated Time:** 30 minutes
- **Priority:** 🔴 CRITICAL

#### ✅ Task 2: Create Projects Page
- **File:** `src/app/dashboard/projects/page.tsx`
- **Components to Use:** ProjectCard, StatsCard
- **Content:**
  - Project grid (active, completed, archived)
  - Filter tabs (All, Active, At Risk, Completed)
  - Quick stats (total projects, on track, at risk)
  - "New Project" button
  - Search and filter controls
- **Estimated Time:** 45 minutes
- **Priority:** 🔴 CRITICAL

#### ✅ Task 3: Create Approvals Page
- **File:** `src/app/dashboard/approvals/page.tsx`
- **Components to Use:** ApprovalCard
- **Content:**
  - Approval queue with priority filtering
  - Quick stats (pending, approved today, declined)
  - Filter by priority (High, Medium, Low)
  - "Approve All" bulk action
  - Approval history section
- **Estimated Time:** 30 minutes
- **Priority:** 🔴 CRITICAL

---

### **HIGH - Enable Testing & Development**

#### ✅ Task 4: Add Demo Mode to Dashboard Layout
- **File:** `src/app/dashboard/layout.tsx`
- **Changes:**
  - Add default orgId fallback for development
  - Add demo data toggle
  - Set `DEMO_ORG_ID = "demo-unite-hub-org"`
- **Content:**
  ```typescript
  const orgId = localStorage.getItem('orgId') ||
                process.env.NODE_ENV === 'development'
                  ? 'demo-unite-hub-org'
                  : null;
  ```
- **Estimated Time:** 15 minutes
- **Priority:** 🟠 HIGH

#### ✅ Task 5: Add Mock Data Provider
- **File:** `src/lib/demo-data.ts`
- **Content:**
  - Mock contacts data
  - Mock campaigns data
  - Mock workspace data
  - Mock settings data
  - Export functions: `getDemoContacts()`, `getDemoCampaigns()`, etc.
- **Estimated Time:** 20 minutes
- **Priority:** 🟠 HIGH

#### ✅ Task 6: Update Loading Pages to Use Demo Data
- **Files:**
  - `src/app/dashboard/overview/page.tsx`
  - `src/app/dashboard/contacts/page.tsx`
  - `src/app/dashboard/campaigns/page.tsx`
  - `src/app/dashboard/workspaces/page.tsx`
  - `src/app/dashboard/settings/page.tsx`
- **Changes:**
  - Check for demo mode
  - Load demo data if in development
  - Display content instead of "Loading..."
- **Estimated Time:** 30 minutes
- **Priority:** 🟠 HIGH

---

### **MEDIUM - Navigation Alignment**

#### ✅ Task 7: Review and Update ModernSidebar Navigation
- **File:** `src/components/layout/ModernSidebar.tsx`
- **Changes:**
  - Review owner navigation items
  - Add/remove items to match actual pages
  - Consider adding: Contacts, Campaigns, Workspaces
  - Consider removing or fixing: Team, Projects, Approvals (after creation)
- **Options:**
  1. **Option A:** Update navigation to match existing pages
  2. **Option B:** Keep navigation and create missing pages (already doing this)
  3. **Option C:** Hybrid - some of both
- **Estimated Time:** 20 minutes
- **Priority:** 🟡 MEDIUM

#### ✅ Task 8: Add Navigation Groups/Sections
- **File:** `src/components/layout/ModernSidebar.tsx`
- **Changes:**
  - Group navigation items logically:
    - **Management:** Dashboard, Projects, Team
    - **Marketing:** Campaigns, Content, Emails
    - **Clients:** Contacts, Approvals, Messages
    - **System:** Reports, Settings
  - Add section headers
  - Add dividers between groups
- **Estimated Time:** 30 minutes
- **Priority:** 🟡 MEDIUM

---

### **LOW - Polish & Enhancement**

#### ✅ Task 9: Add Page Titles and Metadata
- **Files:** All dashboard pages
- **Changes:**
  - Add proper `<h1>` headings
  - Add page descriptions
  - Add breadcrumbs
  - Add action buttons in header
- **Estimated Time:** 20 minutes
- **Priority:** 🟢 LOW

#### ✅ Task 10: Add Loading Skeletons
- **File:** `src/components/ui/skeleton.tsx` (may already exist)
- **Changes:**
  - Create skeleton components for:
    - ProjectCard skeleton
    - ApprovalCard skeleton
    - TeamMember skeleton
    - Stats card skeleton
  - Replace "Loading..." text with skeletons
- **Estimated Time:** 30 minutes
- **Priority:** 🟢 LOW

---

## 📁 Files to Create

```
src/
├── app/
│   └── dashboard/
│       ├── team/
│       │   └── page.tsx              ✅ NEW (Task 1)
│       ├── projects/
│       │   └── page.tsx              ✅ NEW (Task 2)
│       └── approvals/
│           └── page.tsx              ✅ NEW (Task 3)
│
└── lib/
    └── demo-data.ts                  ✅ NEW (Task 5)
```

---

## 🔧 Files to Modify

```
src/
├── app/
│   └── dashboard/
│       ├── layout.tsx                ⚠️ MODIFY (Task 4)
│       ├── overview/page.tsx         ⚠️ MODIFY (Task 6)
│       ├── contacts/page.tsx         ⚠️ MODIFY (Task 6)
│       ├── campaigns/page.tsx        ⚠️ MODIFY (Task 6)
│       ├── workspaces/page.tsx       ⚠️ MODIFY (Task 6)
│       └── settings/page.tsx         ⚠️ MODIFY (Task 6)
│
└── components/
    └── layout/
        └── ModernSidebar.tsx         ⚠️ MODIFY (Task 7, 8)
```

---

## 🎨 Design References

### **Team Page Layout**
```
┌─────────────────────────────────────────────────┐
│  Team Management                   [+ Add Member]│
├─────────────────────────────────────────────────┤
│  📊 Stats: Total (4) | Available (2) | Over (1) │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Claire Davis │  │ Mike Johnson │             │
│  │ Designer     │  │ Content      │             │
│  │ ████████░░ 85%│  │ ██████░░░░ 60%│          │
│  │ 3 projects   │  │ 2 projects   │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Sarah Lee    │  │ Tom Wilson   │             │
│  │ Video        │  │ Developer    │             │
│  │ ███████████ 105%│ │ ███████░░░ 70%│          │
│  │ 4 projects   │  │ 2 projects   │             │
│  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────┘
```

### **Projects Page Layout**
```
┌─────────────────────────────────────────────────┐
│  Projects                        [+ New Project] │
├─────────────────────────────────────────────────┤
│  📊 Stats: Total (12) | Active (8) | At Risk (2)│
├─────────────────────────────────────────────────┤
│  [All] [Active] [At Risk] [Completed] [Archived]│
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Website      │  │ Mobile App   │             │
│  │ Redesign     │  │ Development  │             │
│  │ ████████░ 75%│  │ █████░░░░ 45%│            │
│  │ 🟢 On Track  │  │ 🔴 At Risk   │             │
│  │ Due Dec 20   │  │ Due Jan 15   │             │
│  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────┘
```

### **Approvals Page Layout**
```
┌─────────────────────────────────────────────────┐
│  Approvals                  [Approve All (5)]    │
├─────────────────────────────────────────────────┤
│  📊 Stats: Pending (5) | Approved (12) | Dec (2)│
├─────────────────────────────────────────────────┤
│  [All] [High Priority] [Medium] [Low]           │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐   │
│  │ 📸 Website Redesign Mockups         HIGH │   │
│  │ Acme Corporation                          │   │
│  │ Final mockups for homepage...             │   │
│  │ Claire Davis • 2 hours ago                │   │
│  │                    [✓ Approve] [✗ Decline]│   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔌 Integration Preparation (For Phase 4)

### **Supabase Tables Needed**

```sql
-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255),
  role VARCHAR(100),
  avatar_url TEXT,
  capacity_hours INTEGER DEFAULT 40,
  current_hours INTEGER DEFAULT 0,
  project_count INTEGER DEFAULT 0,
  status VARCHAR(50), -- available, near-capacity, over-capacity
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  title VARCHAR(255),
  client_name VARCHAR(255),
  status VARCHAR(50), -- active, at-risk, completed, archived
  priority VARCHAR(50), -- high, medium, low
  progress INTEGER DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50), -- high, medium, low
  asset_type VARCHAR(50), -- design, copy, video, other
  asset_url TEXT,
  submitted_by UUID REFERENCES users(id),
  status VARCHAR(50), -- pending, approved, declined
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **API Routes Needed**

```typescript
// GET /api/team
// GET /api/team/[id]
// POST /api/team
// PATCH /api/team/[id]
// DELETE /api/team/[id]

// GET /api/projects
// GET /api/projects/[id]
// POST /api/projects
// PATCH /api/projects/[id]
// DELETE /api/projects/[id]

// GET /api/approvals
// GET /api/approvals/[id]
// POST /api/approvals/[id]/approve
// POST /api/approvals/[id]/decline
```

---

## ⏱️ Time Estimates

### **Critical Tasks (Must Complete)**
- Task 1: Team Page - 30 min
- Task 2: Projects Page - 45 min
- Task 3: Approvals Page - 30 min
- **Subtotal:** 1 hour 45 minutes

### **High Priority Tasks (Should Complete)**
- Task 4: Demo Mode - 15 min
- Task 5: Mock Data - 20 min
- Task 6: Update Loading Pages - 30 min
- **Subtotal:** 1 hour 5 minutes

### **Medium Priority Tasks (Nice to Have)**
- Task 7: Review Navigation - 20 min
- Task 8: Navigation Groups - 30 min
- **Subtotal:** 50 minutes

### **Total Estimated Time:** 3 hours 40 minutes

---

## ✅ Success Criteria

Phase 3 will be considered complete when:

1. ✅ All navigation links work (no 404 errors)
2. ✅ All dashboard pages display content (no "Loading...")
3. ✅ Demo mode enabled for development
4. ✅ Navigation aligned with page structure
5. ✅ Pages tested with Playwright MCP
6. ✅ Zero console errors
7. ✅ Components use Unite-Hub brand colors
8. ✅ Mobile responsive
9. ✅ Ready for Supabase integration

---

## 🚀 Execution Order

**Step 1: Critical Fixes (Today)**
1. Create Team page
2. Create Projects page
3. Create Approvals page
4. Test all navigation links

**Step 2: Enable Testing (Today)**
5. Add demo mode
6. Create mock data
7. Update loading pages
8. Test all dashboard pages

**Step 3: Polish (Tomorrow)**
9. Review navigation structure
10. Add navigation groups
11. Add page titles
12. Add loading skeletons

**Step 4: Validation (Tomorrow)**
13. Full Playwright MCP audit
14. Fix any remaining issues
15. Update documentation
16. Mark Phase 3 complete

---

## 📊 Progress Tracking

**Status:** 📋 Ready to Start
**Progress:** 0 / 10 tasks complete (0%)
**Estimated Completion:** Today + Tomorrow (2 days)

---

**Created:** 2025-11-14
**Phase:** 3 of 5
**Next Phase:** Phase 4 - Supabase Integration
