# Unite-Hub Integration Blueprint

**Generated**: 2025-11-17
**Purpose**: Comprehensive plan for connecting orphaned features and completing the application
**Status**: Architectural Design Document

---

## Overview

This document provides the architectural blueprint for completing Unite-Hub's feature integration. Based on the Site Audit Report, we have identified 143 API endpoints and 29 dashboard pages, with several orphaned features and missing connections.

---

## Recommended Navigation Hierarchy

### Top-Level Structure

```
Unite-Hub Application
│
├── Public Pages
│   ├── / (Landing Page)
│   ├── /pricing
│   ├── /about
│   ├── /contact
│   ├── /privacy
│   ├── /terms
│   └── /security
│
├── Authentication
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /auth/implicit-callback (OAuth handler)
│
├── Onboarding
│   ├── /onboarding (hub)
│   ├── /onboarding/step-1-info
│   ├── /onboarding/step-2-payment
│   ├── /onboarding/step-3-assets
│   └── /onboarding/step-4-contacts
│
└── Dashboard
    └── [See Detailed Dashboard Hierarchy Below]
```

---

## Detailed Dashboard Hierarchy

### 1. Core Modules

```
/dashboard
│
├── /overview
│   ├── Stats cards (contacts, leads, campaigns, AI score)
│   ├── Hot Leads Panel (AI-powered)
│   ├── Calendar Widget
│   └── Quick Actions
│
├── /contacts
│   ├── Contact list (searchable, filterable)
│   ├── AI scoring badges
│   ├── Add contact modal
│   ├── Bulk actions
│   └── /[contactId]
│       ├── Contact profile
│       ├── Interaction history
│       ├── AI insights
│       ├── Email threads
│       └── Activity timeline
│
└── /projects
    ├── Project list
    ├── /new (project creation wizard)
    └── /[projectId]
        ├── Project overview
        ├── /mindmap (interactive AI mindmap)
        └── Team assignments
```

---

### 2. Campaigns & Marketing

```
/dashboard/campaigns
│
├── /email (rename from /campaigns)
│   ├── Campaign list
│   ├── Create campaign wizard
│   ├── Performance metrics
│   └── A/B testing dashboard
│
├── /drip
│   ├── Drip sequence builder
│   ├── Trigger configuration
│   ├── Step editor (email, wait, condition)
│   ├── Enrollment management
│   └── Execution logs
│
└── /social (NEW - connect social templates)
    ├── Template library
    ├── Platform filters (Twitter, LinkedIn, Instagram)
    ├── Generate new template (AI)
    ├── Variations & alternatives
    ├── Usage tracking
    └── Bulk actions
```

**API Connections**:
- `/campaigns`: `GET /api/campaigns`, `POST /api/campaigns`
- `/drip`: `POST /api/campaigns/drip`
- `/social`: `GET /api/social-templates/*`, `POST /api/social-templates/generate`

---

### 3. Content & AI Tools

```
/dashboard/content
│
├── /templates (NEW - content template hub)
│   ├── Email templates
│   ├── Social media templates
│   ├── Landing page templates
│   └── Template editor
│
├── /social-templates (ORPHANED FEATURE - CONNECT)
│   ├── Template gallery (card view)
│   ├── Search & filters
│   ├── AI generation modal
│   ├── Template editor
│   ├── Variations viewer
│   ├── Export options
│   └── Usage analytics
│
└── /landing-pages
    ├── Landing page list
    ├── /[id] (editor)
    │   ├── Section editor
    │   ├── Copy variations
    │   ├── SEO optimizer
    │   ├── Preview modes (desktop/mobile)
    │   └── Export (HTML/PDF)
    └── /generate (creation wizard)
```

**API Connections**:
- `/templates`: `GET /api/content/templates` (NEW ENDPOINT NEEDED)
- `/social-templates`:
  - `GET /api/social-templates/search`
  - `POST /api/social-templates/generate`
  - `GET /api/social-templates/[id]`
  - `POST /api/social-templates/[id]/duplicate`
  - `POST /api/social-templates/[id]/favorite`
  - `GET /api/social-templates/[id]/variations`
  - `POST /api/social-templates/export`
- `/landing-pages`:
  - `POST /api/landing-pages/generate`
  - `GET /api/landing-pages/[id]`
  - `POST /api/landing-pages/[id]/regenerate`
  - `PUT /api/landing-pages/[id]/section`

---

### 4. AI Tools Suite

```
/dashboard/ai-tools
│
├── /intelligence
│   ├── Contact analysis (AI scoring)
│   ├── Batch analysis
│   ├── Scoring criteria editor
│   └── Insights dashboard
│
├── /marketing-copy
│   ├── Copy generator (AI)
│   ├── Platform selector
│   ├── Tone/voice settings
│   ├── Generated variations
│   └── Copy history
│
├── /code-generator
│   ├── Code generation (React, API, SQL)
│   ├── Template selection
│   ├── Code preview
│   ├── Export to IDE
│   └── Generation history
│
└── /persona (NEW - connect persona API)
    ├── Persona library
    ├── AI persona generator
    ├── Persona editor
    ├── Usage in campaigns
    └── Persona history
```

**API Connections**:
- `/intelligence`:
  - `POST /api/agents/contact-intelligence`
  - `POST /api/contacts/analyze`
- `/marketing-copy`: `POST /api/ai/generate-marketing`
- `/code-generator`: `POST /api/ai/generate-code`
- `/persona`: `POST /api/ai/persona` (EXISTS)

---

### 5. Communication Hub

```
/dashboard/messages (NEW - create parent hub)
│
├── /inbox (NEW - unified inbox)
│   ├── Combined view (Email + WhatsApp)
│   ├── Thread grouping
│   ├── AI auto-categorization
│   ├── Quick reply
│   └── Filters by channel
│
├── /email (NEW)
│   ├── Connected accounts list
│   ├── Inbox view
│   ├── Sent items
│   ├── Drafts
│   ├── Compose modal
│   └── Integration settings
│
├── /whatsapp (EXISTS)
│   ├── Conversation list
│   ├── Chat interface
│   ├── Template messages
│   ├── Media upload
│   └── Business account settings
│
└── /sequences (link to /emails/sequences)
    └── Email sequence builder
```

**API Connections**:
- `/inbox`:
  - `GET /api/messages/unified` (NEW ENDPOINT NEEDED)
  - Aggregate from email + WhatsApp APIs
- `/email`:
  - `GET /api/integrations/gmail/list`
  - `POST /api/integrations/gmail/send`
  - `POST /api/email/send`
- `/whatsapp`:
  - `GET /api/whatsapp/conversations`
  - `POST /api/whatsapp/send`
  - `GET /api/whatsapp/templates`

---

### 6. Insights & Analytics

```
/dashboard/insights (rename from /dashboard/insights/competitors)
│
├── /reports (NEW - create analytics dashboard)
│   ├── Overview dashboard
│   ├── Contact analytics
│   ├── Campaign performance
│   ├── AI tool usage
│   ├── Revenue metrics
│   └── Export reports
│
├── /competitors
│   ├── Competitor list
│   ├── Add competitor modal
│   ├── AI analysis
│   ├── Comparison matrix
│   ├── SWOT analysis
│   ├── Market gaps
│   └── Actionable insights
│
└── /analytics (NEW)
    ├── User behavior
    ├── Funnel analysis
    ├── Cohort reports
    └── Custom reports
```

**API Connections**:
- `/reports`:
  - `GET /api/analytics/overview` (NEW ENDPOINT NEEDED)
  - `GET /api/analytics/contacts` (NEW)
  - `GET /api/analytics/campaigns` (NEW)
  - `GET /api/analytics/export` (NEW)
- `/competitors`:
  - `GET /api/competitors`
  - `POST /api/competitors`
  - `POST /api/competitors/analyze`
  - `POST /api/competitors/compare`
- `/analytics`: NEW ENDPOINTS NEEDED

---

### 7. Team & Collaboration

```
/dashboard/team
│
├── /members
│   ├── Member list
│   ├── Role management
│   ├── Invite modal
│   ├── Permission editor
│   └── Activity log
│
├── /approvals (EXISTS)
│   ├── Pending approvals queue
│   ├── Approval history
│   ├── Approve/decline actions
│   └── Comments/feedback
│
├── /tasks (NEW - create task management)
│   ├── Task board (Kanban)
│   ├── Task list view
│   ├── Create task modal
│   ├── Assignments
│   ├── Due dates
│   ├── Task comments
│   └── Time tracking integration
│
└── /feedback (NEW - client feedback system)
    ├── Feedback inbox
    ├── Categorization
    ├── Status tracking (new, in-progress, resolved)
    ├── Client responses
    └── Internal notes
```

**API Connections**:
- `/members`:
  - `GET /api/team`
  - `POST /api/team` (invite)
  - `DELETE /api/team/[id]`
- `/approvals`:
  - `GET /api/approvals`
  - `POST /api/approvals`
  - `POST /api/approvals/[id]/approve`
  - `POST /api/approvals/[id]/decline`
- `/tasks`:
  - NEW ENDPOINTS NEEDED:
    - `GET /api/tasks`
    - `POST /api/tasks`
    - `PUT /api/tasks/[id]`
    - `DELETE /api/tasks/[id]`
    - `POST /api/tasks/[id]/assign`
- `/feedback`:
  - NEW ENDPOINTS NEEDED:
    - `GET /api/feedback`
    - `POST /api/feedback`
    - `PUT /api/feedback/[id]`
    - `DELETE /api/feedback/[id]`

---

### 8. Settings & Configuration

```
/dashboard/settings
│
├── /profile
│   ├── Personal information
│   ├── Avatar upload
│   ├── Email preferences
│   └── Notification settings
│
├── /billing
│   ├── Subscription overview
│   ├── Payment methods
│   ├── Invoices
│   ├── Usage metrics
│   └── Upgrade/downgrade
│
├── /integrations
│   ├── Connected services
│   ├── Gmail accounts
│   ├── Outlook accounts
│   ├── WhatsApp business
│   ├── Stripe
│   └── API keys
│
└── /workspaces
    ├── Workspace selector
    ├── Create workspace
    ├── Workspace settings
    └── Member assignments
```

**API Connections**:
- `/profile`:
  - `GET /api/profile`
  - `PUT /api/profile/update`
  - `POST /api/profile/avatar`
- `/billing`:
  - `GET /api/subscription/[orgId]`
  - Stripe webhook handling
- `/integrations`:
  - `GET /api/integrations/list`
  - Gmail/Outlook connect/disconnect APIs
- `/workspaces`:
  - `GET /api/organizations` (lists workspaces)
  - `POST /api/organizations` (create workspace)

---

### 9. Calendar & Scheduling

```
/dashboard/calendar
│
├── Calendar view (month/week/day)
├── Social media post scheduler
├── Meeting scheduler
├── Event creation
├── Availability settings
└── Sync with Google/Outlook calendars
```

**API Connections**:
- `GET /api/calendar/events`
- `POST /api/calendar/generate`
- `POST /api/calendar/create-meeting`
- `GET /api/calendar/availability`
- `POST /api/calendar/suggest-times`

---

### 10. Meetings

```
/dashboard/meetings
│
├── Meeting scheduler
├── Availability checker
├── Meeting templates
├── Calendar sync
└── Meeting history
```

**API Connections**:
- `POST /api/calendar/create-meeting`
- `POST /api/calendar/detect-meeting`
- `GET /api/calendar/availability`

---

## New Endpoints Required

### Analytics Module

```typescript
// GET /api/analytics/overview
{
  "totalContacts": 1250,
  "totalCampaigns": 45,
  "totalRevenue": 125000,
  "avgAiScore": 72,
  "topPerformingCampaigns": [...],
  "recentActivity": [...]
}

// GET /api/analytics/contacts
{
  "contactGrowth": [...],
  "scoreDistribution": {...},
  "statusBreakdown": {...},
  "topSources": [...]
}

// GET /api/analytics/campaigns
{
  "campaignPerformance": [...],
  "openRates": {...},
  "clickRates": {...},
  "conversionRates": {...}
}

// POST /api/analytics/export
{
  "format": "csv|pdf|xlsx",
  "dateRange": {...},
  "metrics": [...]
}
```

---

### Task Management

```typescript
// GET /api/tasks
// POST /api/tasks
{
  "title": "Review landing page",
  "description": "...",
  "assignedTo": "user_id",
  "dueDate": "2025-11-20",
  "projectId": "project_id",
  "status": "todo|in_progress|done",
  "priority": "low|medium|high"
}

// PUT /api/tasks/[id]
// DELETE /api/tasks/[id]
// POST /api/tasks/[id]/assign
```

---

### Feedback System

```typescript
// GET /api/feedback
// POST /api/feedback
{
  "clientId": "client_id",
  "projectId": "project_id",
  "subject": "...",
  "message": "...",
  "category": "bug|feature|question",
  "status": "new|in_progress|resolved",
  "priority": "low|medium|high"
}

// PUT /api/feedback/[id]
// DELETE /api/feedback/[id]
```

---

### Unified Inbox

```typescript
// GET /api/messages/unified
{
  "messages": [
    {
      "id": "...",
      "channel": "email|whatsapp",
      "from": {...},
      "subject": "...",
      "preview": "...",
      "timestamp": "...",
      "read": false,
      "starred": false
    }
  ],
  "pagination": {...}
}

// PUT /api/messages/[id]/mark-read
// PUT /api/messages/[id]/star
```

---

### Content Templates

```typescript
// GET /api/content/templates
{
  "templates": [
    {
      "id": "...",
      "name": "Welcome Email",
      "type": "email|social|landing",
      "category": "...",
      "content": "...",
      "variables": ["{{name}}", "{{company}}"]
    }
  ]
}

// POST /api/content/templates
// PUT /api/content/templates/[id]
// DELETE /api/content/templates/[id]
```

---

## Database Schema Updates Required

### New Tables

#### 1. tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
```

---

#### 2. feedback

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'question', 'general')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_workspace ON feedback(workspace_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_client ON feedback(client_id);
```

---

#### 3. content_templates

```sql
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'social', 'landing', 'other')),
  category TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_templates_workspace ON content_templates(workspace_id);
CREATE INDEX idx_content_templates_type ON content_templates(type);
```

---

#### 4. messages (unified inbox)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  external_id TEXT, -- ID from external service
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  preview TEXT,
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_workspace ON messages(workspace_id);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_read ON messages(read);
```

---

## Component Architecture

### Shared Component Library

#### 1. Navigation Components

```
src/components/navigation/
├── MainNav.tsx (top navigation bar)
├── SideNav.tsx (side navigation)
├── MobileNav.tsx (mobile hamburger menu)
├── Breadcrumbs.tsx (EXISTS)
└── QuickActions.tsx (NEW - quick action menu)
```

---

#### 2. Form Components

```
src/components/forms/
├── ContactForm.tsx
├── CampaignForm.tsx
├── TaskForm.tsx (NEW)
├── FeedbackForm.tsx (NEW)
├── TemplateForm.tsx (NEW)
└── FormField.tsx (reusable field wrapper)
```

---

#### 3. Modal Components

```
src/components/modals/
├── AddContactModal.tsx (EXISTS)
├── AddTaskModal.tsx (NEW)
├── AddFeedbackModal.tsx (NEW)
├── ComposeEmailModal.tsx (NEW)
├── ConfirmationModal.tsx (reusable)
└── BaseModal.tsx (base modal component)
```

---

#### 4. Data Display Components

```
src/components/display/
├── ContactCard.tsx
├── CampaignCard.tsx
├── TaskCard.tsx (NEW)
├── FeedbackCard.tsx (NEW)
├── TemplateCard.tsx (EXISTS - social-templates/)
├── StatCard.tsx (reusable stat display)
└── EmptyState.tsx (reusable empty state)
```

---

#### 5. AI-Powered Components

```
src/components/ai/
├── AIScoreBadge.tsx (contact scoring)
├── AIInsightsPanel.tsx (contact insights)
├── AIContentGenerator.tsx (content generation modal)
├── AIAnalysisViewer.tsx (analysis results)
└── AIThinkingIndicator.tsx (Extended Thinking visual)
```

---

## Integration Points

### 1. Social Templates → Dashboard

**Current State**: Components exist, APIs exist, no page route

**Integration Steps**:
1. Create `/dashboard/content/social-templates/page.tsx`
2. Import existing components from `src/components/social-templates/`
3. Connect to existing APIs
4. Add to navigation

**Components to Use**:
- `TemplateCard.tsx`
- `TemplateSearch.tsx`
- `TemplateFilters.tsx`
- `TemplateEditor.tsx`
- `VariationsModal.tsx`

**API Endpoints**:
- `GET /api/social-templates/search`
- `POST /api/social-templates/generate`
- All CRUD operations already exist

---

### 2. Reports → Dashboard

**Current State**: Missing entirely

**Integration Steps**:
1. Create `/dashboard/insights/reports/page.tsx`
2. Create analytics API endpoints
3. Build chart components (recharts or similar)
4. Aggregate data from multiple sources

**New Components Needed**:
- `ReportsDashboard.tsx`
- `MetricChart.tsx` (reusable chart wrapper)
- `DateRangePicker.tsx`
- `ExportButton.tsx`

**Data Sources**:
- Contacts table
- Campaigns table
- Email opens/clicks
- AI scores
- User activities

---

### 3. Unified Inbox → Messages Hub

**Current State**: Email and WhatsApp separate

**Integration Steps**:
1. Create `/dashboard/messages/page.tsx` (hub)
2. Create `/dashboard/messages/inbox/page.tsx` (unified view)
3. Create `/dashboard/messages/email/page.tsx`
4. Create unified messages API endpoint
5. Implement real-time updates (polling or WebSocket)

**New Components Needed**:
- `UnifiedInbox.tsx`
- `MessageList.tsx`
- `MessagePreview.tsx`
- `ChannelFilter.tsx`

---

### 4. Tasks → Team Module

**Current State**: Missing entirely

**Integration Steps**:
1. Create database table (`tasks`)
2. Create API endpoints
3. Create `/dashboard/team/tasks/page.tsx`
4. Build Kanban board component
5. Integrate with projects

**New Components Needed**:
- `TaskBoard.tsx` (Kanban view)
- `TaskList.tsx` (list view)
- `TaskCard.tsx`
- `AddTaskModal.tsx`
- `TaskAssignmentSelector.tsx`

---

### 5. Feedback → Team Module

**Current State**: Missing entirely

**Integration Steps**:
1. Create database table (`feedback`)
2. Create API endpoints
3. Create `/dashboard/team/feedback/page.tsx`
4. Build feedback inbox
5. Add client feedback widget

**New Components Needed**:
- `FeedbackInbox.tsx`
- `FeedbackCard.tsx`
- `AddFeedbackModal.tsx`
- `FeedbackStatusBadge.tsx`
- `ClientFeedbackWidget.tsx` (for client portal)

---

## Implementation Phases

### Phase 1: Fix Broken Links & Critical Issues (Week 1)

**Goals**:
- Fix all landing page footer links
- Fix all auth page footer links
- Create privacy, terms, security pages
- Re-enable authentication on all routes

**Deliverables**:
- 3 new legal pages
- Updated landing page
- Updated auth pages
- Verified authentication on all API routes

---

### Phase 2: Create Missing Core Pages (Week 2)

**Goals**:
- Create `/dashboard/reports`
- Create `/dashboard/messages` hub
- Create `/dashboard/tasks`
- Create `/dashboard/feedback`

**Deliverables**:
- 4 new dashboard pages
- Database tables for tasks and feedback
- Basic CRUD API endpoints
- Updated navigation

---

### Phase 3: Connect Orphaned Features (Week 3)

**Goals**:
- Connect social templates to dashboard
- Create unified inbox
- Implement email page
- Add persona page

**Deliverables**:
- Social templates page working
- Unified inbox MVP
- Email management page
- Persona management page

---

### Phase 4: Enhance & Polish (Week 4)

**Goals**:
- Add analytics dashboards
- Implement export functionality
- Add real-time updates
- Complete all button handlers

**Deliverables**:
- Reports dashboards
- Export to CSV/PDF
- WebSocket or polling for inbox
- All UI interactions functional

---

## Testing Strategy

### Unit Tests

```
tests/unit/
├── components/
│   ├── tasks/
│   │   ├── TaskBoard.test.tsx
│   │   └── TaskCard.test.tsx
│   ├── feedback/
│   │   └── FeedbackInbox.test.tsx
│   └── reports/
│       └── ReportsDashboard.test.tsx
└── api/
    ├── tasks.test.ts
    ├── feedback.test.ts
    └── analytics.test.ts
```

---

### Integration Tests

```
tests/integration/
├── social-templates-flow.test.ts
├── unified-inbox-flow.test.ts
├── task-management-flow.test.ts
└── analytics-export-flow.test.ts
```

---

### E2E Tests

```
tests/e2e/
├── navigation.spec.ts (test all nav links)
├── contact-to-campaign.spec.ts
├── social-template-generation.spec.ts
└── task-assignment.spec.ts
```

---

## Success Criteria

### Functional Completeness

- [ ] All navigation links lead to working pages
- [ ] All API endpoints connected to UI
- [ ] All buttons have working click handlers
- [ ] No `href="#"` links in production
- [ ] No TODO comments for authentication
- [ ] All legal pages exist (privacy, terms, security)

### Feature Completeness

- [ ] Social templates accessible from dashboard
- [ ] Reports page showing analytics
- [ ] Unified inbox aggregating messages
- [ ] Task management working
- [ ] Feedback system working
- [ ] All AI tools accessible

### User Experience

- [ ] Consistent navigation across all pages
- [ ] Logical information architecture
- [ ] Quick access to frequently used features
- [ ] Mobile-responsive design
- [ ] Loading states on all async operations
- [ ] Error handling on all forms

---

## Appendix: Quick Reference

### Pages to Create

1. `/privacy`
2. `/terms`
3. `/security`
4. `/dashboard/insights/reports`
5. `/dashboard/messages`
6. `/dashboard/messages/inbox`
7. `/dashboard/messages/email`
8. `/dashboard/team/tasks`
9. `/dashboard/team/feedback`
10. `/dashboard/content/social-templates`
11. `/dashboard/ai-tools/persona`

### API Endpoints to Create

1. `GET /api/analytics/overview`
2. `GET /api/analytics/contacts`
3. `GET /api/analytics/campaigns`
4. `POST /api/analytics/export`
5. `GET /api/tasks`
6. `POST /api/tasks`
7. `PUT /api/tasks/[id]`
8. `DELETE /api/tasks/[id]`
9. `GET /api/feedback`
10. `POST /api/feedback`
11. `PUT /api/feedback/[id]`
12. `DELETE /api/feedback/[id]`
13. `GET /api/messages/unified`
14. `GET /api/content/templates`
15. `POST /api/content/templates`

### Database Tables to Create

1. `tasks`
2. `feedback`
3. `content_templates`
4. `messages` (unified inbox)

---

**Blueprint End**

*This blueprint should be used in conjunction with ACTION-PLAN.md for implementation.*
