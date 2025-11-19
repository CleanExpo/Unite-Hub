# Phase 3A – Client Idea → Scope → Pricing Pipeline

**Date**: 2025-11-19
**Status**: 📋 Design Complete
**Track**: A (Client Portal - 60% priority)

---

## Overview

This document describes the planned architecture for turning a client's idea into a structured, billable project inside Unite-Hub.

---

## High-Level Flow

### 1. Idea Capture ✅ (Already Implemented)

**Current State**:
- Client submits an idea via `/client/ideas` (text input)
- Idea is stored in the `ideas` table with metadata (client, organization, timestamps)
- Ideas displayed in client portal with submission history

**Future Enhancements**:
- Voice/video idea submission
- Attachment support (images, documents)
- Idea tagging and categorization

---

### 2. Scope Planning (Scope Planner) 📋 (Phase 3 Step 1-2)

**Goal**: Transform raw idea into a structured `ProposalScope` with:
- Problem summary
- Objectives
- Deliverables
- Assumptions
- Risks/constraints

**Implementation**:
- `scope-planner` module (TypeScript stub created in Step 1)
- AI-assisted scope generation (using existing OpenRouter/Anthropic routing)
- Manual editing by staff before client sees it

**Data Structure**:
```typescript
interface ProposalScope {
  idea: ClientIdea;
  sections: ScopeSection[];
  packages: ScopePackage[];
}

interface ScopeSection {
  id: string;
  title: string;          // e.g., "Project Overview", "Objectives"
  description: string;    // Detailed content
}
```

---

### 3. Good / Better / Best Packages 📋 (Phase 3 Step 2-3)

**Goal**: Split the scope into three tiers with different price points:

**Good (Minimum Viable)**:
- Essential features only
- Fastest delivery
- Lower price point
- Example: "Basic website with 3 pages, contact form"

**Better (Recommended) ⭐**:
- Balanced cost vs impact
- Recommended for most clients
- Includes extras that significantly improve quality
- Example: "Website + SEO optimization + analytics integration"

**Best (Premium)**:
- Maximum impact
- All bells and whistles
- Highest price point
- Example: "Full marketing suite + custom animations + A/B testing"

**Data Structure**:
```typescript
interface ScopePackage {
  id: string;
  tier: 'good' | 'better' | 'best';
  label: string;               // "Good", "Better", "Best"
  summary: string;             // One-sentence description
  estimatedHours?: number;     // Staff effort estimate
  priceMin?: number;           // Price range minimum
  priceMax?: number;           // Price range maximum
}
```

**Pricing Strategy**:
- Good: 50-70% of Better price
- Better: Baseline price (recommended)
- Best: 130-150% of Better price

---

### 4. Approval & Project Creation 📋 (Phase 3 Step 4)

**Flow**:
1. Client views proposals at `/client/proposals`
2. Client selects a package (Good/Better/Best)
3. Payment processed via Stripe (Step 6)
4. System creates `project` record
5. System creates associated `tasks` from scope deliverables
6. Tasks assigned to staff (e.g., Rana for engineering, Claire for branding)

**Database Schema (Planned)**:
```sql
-- proposal_scopes table
CREATE TABLE proposal_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workspace_id UUID REFERENCES workspaces(id),
  client_id UUID NOT NULL REFERENCES client_users(id),
  idea_id UUID REFERENCES ideas(id),

  -- Scope content
  scope_json JSONB NOT NULL,  -- Full ProposalScope structure

  -- Status
  status TEXT DEFAULT 'draft',  -- draft, sent, approved, rejected
  selected_tier TEXT,           -- good, better, best

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);
```

---

### 5. Client Dashboard & Progress 📋 (Phase 3 Step 5)

**Client-Facing Dashboard**:
- Selected scope details
- Timeline and milestones
- Task progress (% complete)
- Visual mindmap of project structure
- Status updates from staff

**Staff-Facing Dashboard**:
- All active projects
- Task assignments
- Time tracking
- Client communications
- Scope change requests

---

## Implementation Phases

### Phase 3 Step 1 ✅ (Complete)

**Created**:
- TypeScript stubs for scope planner
- Type definitions for `ClientIdea`, `ScopeSection`, `ScopePackage`, `ProposalScope`
- Stub function `planScopeFromIdea()` (deterministic, no AI yet)
- Unit tests

**Files**:
- `src/lib/projects/scope-planner.ts`
- `src/lib/__tests__/scope-planner.test.ts`

---

### Phase 3 Step 2 📋 (Planned: Scope Planner UI - Staff Tools)

**Goals**:
- Create `/staff/scope-review` page
- Wire `planScopeFromIdea()` to staff UI
- Allow manual editing of generated scopes
- Preview scope before client sees it

**Features**:
- Load idea from `ideas` table
- Trigger scope generation (AI-assisted)
- Display generated scope in editable form
- Save to `proposal_scopes` table as draft
- Send to client for review

**AI Integration**:
- Use existing OpenRouter routing for content generation
- Prompt engineering for scope generation:
  - Input: Client idea title + description
  - Output: Structured ProposalScope JSON
- Model selection: Claude 3.5 Sonnet (quality priority for client-facing content)

---

### Phase 3 Step 3 📋 (Planned: Package Pricing Logic)

**Goals**:
- Define pricing rules for Good/Better/Best packages
- Implement effort estimation (hours per deliverable)
- Calculate price ranges based on effort + margin

**Pricing Formula**:
```typescript
// Example logic
const hourlyRate = 150; // USD per hour
const baseMargin = 0.3; // 30% profit margin

function calculatePackagePrice(estimatedHours: number): {
  priceMin: number;
  priceMax: number;
} {
  const baseCost = estimatedHours * hourlyRate;
  const priceMin = baseCost * (1 + baseMargin);
  const priceMax = priceMin * 1.2; // 20% range for negotiation

  return { priceMin, priceMax };
}
```

**Tiered Effort Example**:
- Good: 40 hours → $7,800 - $9,360
- Better: 60 hours → $11,700 - $14,040
- Best: 80 hours → $15,600 - $18,720

---

### Phase 3 Step 4 📋 (Planned: Client Proposal Selection)

**Goals**:
- Create `/client/proposals` page
- Display Good/Better/Best packages side-by-side
- Allow client to select a package
- Trigger payment flow (Stripe integration in Step 6)

**UI Components**:
- Proposal header (idea title, summary)
- Package comparison table
- "Select This Package" buttons
- FAQ section
- Contact staff button (questions about scope)

**Database Updates**:
- Update `proposal_scopes.status` to 'sent' when shown to client
- Update `proposal_scopes.selected_tier` when client selects package
- Update `proposal_scopes.approved_at` when payment confirmed

---

### Phase 3 Step 5 📋 (Planned: Automatic Project Creation)

**Goals**:
- Create project from approved scope
- Generate tasks from deliverables
- Assign tasks to staff
- Set up project timeline

**Project Creation Logic**:
```typescript
async function createProjectFromScope(
  scope: ProposalScope,
  selectedTier: 'good' | 'better' | 'best'
) {
  const selectedPackage = scope.packages.find(p => p.tier === selectedTier);

  // Create project
  const project = await supabaseAdmin.from('projects').insert({
    organization_id: scope.idea.organizationId,
    client_id: scope.idea.clientId,
    title: scope.idea.title,
    description: selectedPackage.summary,
    status: 'active',
    estimated_hours: selectedPackage.estimatedHours,
  }).select().single();

  // Create tasks from deliverables
  const tasks = extractDeliverablesFromScope(scope, selectedTier);
  await supabaseAdmin.from('tasks').insert(
    tasks.map(task => ({
      project_id: project.id,
      title: task.title,
      description: task.description,
      estimated_hours: task.hours,
      assigned_to: assignStaffMember(task.type), // e.g., Rana for dev, Claire for design
    }))
  );

  return project;
}
```

---

## Data Structures (Detailed)

### ClientIdea (Already Implemented)

```typescript
export interface ClientIdea {
  id: string;
  organizationId: string;
  clientId: string;
  title: string;
  description: string;
  createdAt: string;
  status?: 'new' | 'in_review' | 'scoped' | 'rejected';
}
```

### ScopeSection

```typescript
export interface ScopeSection {
  id: string;
  title: string;          // "Problem Statement", "Objectives", "Deliverables"
  description: string;    // Detailed content for this section
  order?: number;         // Display order
}
```

### ScopePackage

```typescript
export interface ScopePackage {
  id: string;
  tier: 'good' | 'better' | 'best';
  label: string;               // "Good", "Better", "Best"
  summary: string;             // One-sentence description
  deliverables: string[];      // List of included deliverables
  estimatedHours?: number;     // Staff effort estimate
  priceMin?: number;           // Price range minimum (USD)
  priceMax?: number;           // Price range maximum (USD)
  timeline?: string;           // e.g., "4-6 weeks"
}
```

### ProposalScope

```typescript
export interface ProposalScope {
  idea: ClientIdea;
  sections: ScopeSection[];     // Problem, Objectives, Deliverables, Assumptions, Risks
  packages: ScopePackage[];     // Good, Better, Best
  metadata?: {
    generatedAt: string;
    generatedBy: string;        // Staff member who generated scope
    aiModel?: string;            // Model used for generation
  };
}
```

---

## Integration with Existing Systems

### With Phase 2 Interactive Features ✅

**Toast Notifications**:
- "Scope generated successfully"
- "Scope sent to client"
- "Client selected Better package"
- "Project created successfully"

**Form Validation** (Zod):
- Validate scope sections before saving
- Validate package pricing (min < max)
- Validate deliverable lists (not empty)

---

### With Phase 2 Testing Foundation ✅

**E2E Tests** (Planned):
- Staff can generate scope from idea
- Staff can edit and save scope
- Client can view and select package
- Project created automatically after payment

**API Tests** (Planned):
- POST /api/scope/generate
- PUT /api/scope/:id
- POST /api/scope/:id/send
- POST /api/scope/:id/approve

---

### With Existing AI Routing ✅

**OpenRouter Intelligence**:
- Use Claude 3.5 Sonnet for scope generation (quality priority)
- Cost tracked via CostTracker
- Cached prompts for scope templates

**Prompt Template Example**:
```
You are a professional project scoper for a software development agency.

INPUT:
Client Idea Title: ${idea.title}
Client Idea Description: ${idea.description}

OUTPUT (JSON):
Generate a structured project scope with:
1. Problem Statement (1-2 paragraphs)
2. Objectives (3-5 bullet points)
3. Deliverables (detailed list)
4. Assumptions (what we assume is true)
5. Risks & Constraints (potential blockers)

Also generate THREE packages (Good/Better/Best) with different deliverable sets.
```

---

## Success Criteria

**You'll know this is working when**:

✅ Staff can generate a scope from an idea in < 1 minute
✅ Generated scopes are 80%+ usable without edits
✅ Clients understand all three packages clearly
✅ 80%+ of clients select Better package (recommended)
✅ Projects are created automatically after payment
✅ Tasks are properly assigned to staff
✅ Client dashboard shows real-time project progress

---

## Next Steps

**Immediate (Step 2)**:
- Build staff scope review UI at `/staff/scope-review`
- Wire `planScopeFromIdea()` to AI models
- Test scope generation with real client ideas

**Short-term (Step 3-4)**:
- Implement pricing logic
- Build client proposal selection UI
- Test with internal team as "clients"

**Medium-term (Step 5-6)**:
- Automatic project creation
- Stripe payment integration
- Go live with selected clients (beta)

---

**Last Updated**: 2025-11-19
**Status**: Design Complete, Ready for Step 2 Implementation
**References**:
- [PHASE3_OVERVIEW_DUAL_TRACK.md](./PHASE3_OVERVIEW_DUAL_TRACK.md)
- [PHASE3B_XERO_AUTOMATED_INVOICING_ARCHITECTURE.md](./PHASE3B_XERO_AUTOMATED_INVOICING_ARCHITECTURE.md)
