# Unite-Hub Action Plan

**Generated**: 2025-11-17
**Purpose**: Prioritized task list for completing Unite-Hub based on Site Audit Report
**Status**: Implementation Roadmap

---

## Executive Summary

This action plan breaks down the completion of Unite-Hub into prioritized tasks across 4 priority levels (P0-P3). Tasks are organized by estimated effort and impact.

**Total Estimated Effort**: ~120 hours (3 weeks for 1 developer)

---

## Priority Levels

- **P0 (Critical)**: System-breaking issues, security vulnerabilities, broken core features
- **P1 (High)**: Missing core features, broken user journeys, compliance requirements
- **P2 (Medium)**: Enhancement features, nice-to-haves that improve UX
- **P3 (Low)**: Future improvements, optimization tasks, non-critical cleanup

---

## P0: Critical Fixes (Complete This Week)

**Estimated Total**: 12 hours
**Impact**: Fixes broken authentication, security issues, and landing page

---

### P0-1: Re-enable Authentication on API Routes

**Priority**: P0
**Effort**: 4 hours
**Impact**: CRITICAL SECURITY ISSUE

**Problem**: Multiple API routes have authentication disabled with TODO comments

**Files to Fix**:
```bash
# Find all TODO authentication comments
grep -r "TODO.*authentication" src/app/api/

# Known affected files:
# - src/app/api/agents/contact-intelligence/route.ts
```

**Steps**:
1. Search for all `TODO: Re-enable authentication` comments
2. For each file:
   ```typescript
   // REMOVE THIS:
   // TODO: Re-enable authentication in production

   // ENSURE THIS EXISTS:
   const authHeader = req.headers.get("authorization");
   const token = authHeader?.replace("Bearer ", "");

   if (!token) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const { supabaseBrowser } = await import("@/lib/supabase");
   const { data, error } = await supabaseBrowser.auth.getUser(token);

   if (error || !data.user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

3. Test each endpoint with valid and invalid tokens
4. Verify workspace isolation

**Acceptance Criteria**:
- [ ] No TODO authentication comments remain
- [ ] All protected routes return 401 without valid token
- [ ] All protected routes work with valid token
- [ ] Workspace filtering enforced

---

### P0-2: Fix Landing Page Footer Links

**Priority**: P0
**Effort**: 2 hours
**Impact**: Poor SEO, broken user experience

**File**: `src/app/page.tsx`
**Lines**: 374-422

**Changes Required**:

```typescript
// BEFORE (Lines 374-376):
<li><a href="#" className="hover:text-white transition-colors">Features</a></li>
<li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
<li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>

// AFTER:
<li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
<li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
<li><Link href="/dashboard/settings/integrations" className="hover:text-white transition-colors">Integrations</Link></li>

// BEFORE (Lines 382-384):
<li><a href="#" className="hover:text-white transition-colors">About</a></li>
<li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
<li><a href="#" className="hover:text-white transition-colors">Careers</a></li>

// AFTER:
<li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
<li><a href="https://blog.unite-hub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a></li>
<li><a href="https://careers.unite-hub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Careers</a></li>

// BEFORE (Lines 390-392):
<li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
<li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
<li><a href="#" className="hover:text-white transition-colors">Status</a></li>

// AFTER:
<li><a href="https://help.unite-hub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Help Center</a></li>
<li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
<li><a href="https://status.unite-hub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Status</a></li>

// BEFORE (Lines 398-400):
<li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
<li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
<li><a href="#" className="hover:text-white transition-colors">Security</a></li>

// AFTER:
<li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
<li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
<li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>

// BEFORE (Lines 416-422):
<a href="#" className="text-slate-400 hover:text-white transition-colors">
  <Github className="w-5 h-5" />
</a>
<a href="#" className="text-slate-400 hover:text-white transition-colors">
  <Twitter className="w-5 h-5" />
</a>

// AFTER:
<a href="https://github.com/unite-hub" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
  <Github className="w-5 h-5" />
</a>
<a href="https://twitter.com/unite_hub" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
  <Twitter className="w-5 h-5" />
</a>
```

**Acceptance Criteria**:
- [ ] All footer links point to real destinations
- [ ] Privacy, Terms, Security links work (after P0-4)
- [ ] Social media links work
- [ ] No `href="#"` remains

---

### P0-3: Fix Auth Pages Footer Links

**Priority**: P0
**Effort**: 1 hour
**Impact**: Legal compliance, user experience

**Files to Update**:
1. `src/app/(auth)/signup/page.tsx` (Lines 94-96)
2. `src/app/(auth)/login/page.tsx` (Lines 136-138)
3. `src/app/(auth)/register/page.tsx` (Lines 127-129)
4. `src/app/(auth)/forgot-password/page.tsx` (Lines 110-112)

**Change Pattern** (same for all 4 files):

```typescript
// BEFORE:
<a href="#" className="hover:text-white transition-colors">Privacy</a>
<a href="#" className="hover:text-white transition-colors">Terms</a>
<a href="#" className="hover:text-white transition-colors">Help</a>

// AFTER:
<Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
<Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
<a href="https://help.unite-hub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Help</a>
```

**Acceptance Criteria**:
- [ ] All 4 auth pages updated
- [ ] Privacy and Terms links work
- [ ] Help link points to external help center

---

### P0-4: Create Legal Pages

**Priority**: P0
**Effort**: 4 hours
**Impact**: Legal compliance, GDPR/CCPA requirements

**Pages to Create**:

#### 1. Privacy Policy (`src/app/privacy/page.tsx`)

```typescript
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          {/* Add privacy policy content */}
          <p className="text-slate-300 leading-relaxed mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-300 leading-relaxed mb-4">...</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-300 leading-relaxed mb-4">...</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Data Security</h2>
          <p className="text-slate-300 leading-relaxed mb-4">...</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Your Rights</h2>
          <p className="text-slate-300 leading-relaxed mb-4">...</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Contact Us</h2>
          <p className="text-slate-300 leading-relaxed mb-4">...</p>
        </div>
      </div>
    </div>
  );
}
```

#### 2. Terms of Service (`src/app/terms/page.tsx`)

Similar structure with terms content

#### 3. Security Practices (`src/app/security/page.tsx`)

Similar structure with security practices

**Resources**:
- Use termly.io or similar for template generation
- Customize for Unite-Hub's specific practices
- Include GDPR, CCPA compliance statements

**Acceptance Criteria**:
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Security practices page created
- [ ] All pages accessible and mobile-responsive
- [ ] Links from footer work

---

### P0-5: Verify Workspace Isolation

**Priority**: P0
**Effort**: 1 hour
**Impact**: Data security, multi-tenancy

**Problem**: Ensure ALL database queries are scoped to workspace

**Steps**:
1. Audit all API routes for workspace filtering
2. Check pattern:
   ```typescript
   // CORRECT:
   const { data } = await supabase
     .from("contacts")
     .select("*")
     .eq("workspace_id", workspaceId);

   // WRONG:
   const { data } = await supabase
     .from("contacts")
     .select("*");
   ```

3. Test with multiple workspaces
4. Verify data isolation

**Files to Check**:
- All API routes in `src/app/api/`
- All dashboard pages that fetch data

**Acceptance Criteria**:
- [ ] All queries scoped to workspace
- [ ] Test user cannot see other workspace data
- [ ] Default workspace properly assigned

---

## P1: High Priority (Complete Week 2)

**Estimated Total**: 32 hours
**Impact**: Core feature completion, user activation

---

### P1-1: Create Reports/Analytics Dashboard

**Priority**: P1
**Effort**: 8 hours
**Impact**: High - essential for business intelligence

**New Page**: `src/app/dashboard/insights/reports/page.tsx`

**Features**:
- Overview dashboard with key metrics
- Contact analytics (growth, score distribution)
- Campaign performance (open rates, click rates)
- AI tool usage statistics
- Revenue metrics (if Stripe integrated)
- Export to CSV/PDF

**New API Endpoints**:

```typescript
// src/app/api/analytics/overview/route.ts
export async function GET(req: NextRequest) {
  // Return aggregated metrics
  return NextResponse.json({
    totalContacts: 1250,
    totalCampaigns: 45,
    totalRevenue: 125000,
    avgAiScore: 72,
    topPerformingCampaigns: [...],
    recentActivity: [...]
  });
}

// src/app/api/analytics/contacts/route.ts
// src/app/api/analytics/campaigns/route.ts
// src/app/api/analytics/export/route.ts
```

**Dependencies**:
- Install `recharts` or similar charting library
- Create reusable chart components

**Acceptance Criteria**:
- [ ] Reports page accessible at `/dashboard/insights/reports`
- [ ] All metrics display correctly
- [ ] Charts render properly
- [ ] Export functionality works
- [ ] Data updates in real-time or on refresh

---

### P1-2: Create Task Management System

**Priority**: P1
**Effort**: 8 hours
**Impact**: High - core collaboration feature

**Database Migration**:

```sql
-- supabase/migrations/030_create_tasks_table.sql
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

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace tasks"
  ON tasks FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their workspace"
  ON tasks FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their workspace"
  ON tasks FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their workspace"
  ON tasks FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));
```

**New API Routes**:

```typescript
// src/app/api/tasks/route.ts
export async function GET(req: NextRequest) { /* List tasks */ }
export async function POST(req: NextRequest) { /* Create task */ }

// src/app/api/tasks/[id]/route.ts
export async function GET(...) { /* Get task */ }
export async function PUT(...) { /* Update task */ }
export async function DELETE(...) { /* Delete task */ }

// src/app/api/tasks/[id]/assign/route.ts
export async function POST(...) { /* Assign task */ }
```

**New Page**: `src/app/dashboard/team/tasks/page.tsx`

**Components to Create**:
- `TaskBoard.tsx` - Kanban board view
- `TaskList.tsx` - List view
- `TaskCard.tsx` - Individual task card
- `AddTaskModal.tsx` - Create/edit task modal
- `TaskAssignmentSelector.tsx` - User picker

**Acceptance Criteria**:
- [ ] Database table created
- [ ] All CRUD APIs working
- [ ] Tasks page accessible
- [ ] Kanban board functional
- [ ] Task assignment works
- [ ] Filtering by status/assignee works

---

### P1-3: Create Feedback System

**Priority**: P1
**Effort**: 8 hours
**Impact**: High - client satisfaction tracking

**Database Migration**:

```sql
-- supabase/migrations/031_create_feedback_table.sql
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

-- RLS Policies (similar to tasks)
```

**New API Routes**:

```typescript
// src/app/api/feedback/route.ts
export async function GET(req: NextRequest) { /* List feedback */ }
export async function POST(req: NextRequest) { /* Create feedback */ }

// src/app/api/feedback/[id]/route.ts
export async function GET(...) { /* Get feedback */ }
export async function PUT(...) { /* Update feedback */ }
export async function DELETE(...) { /* Delete feedback */ }

// src/app/api/feedback/[id]/resolve/route.ts
export async function POST(...) { /* Mark as resolved */ }
```

**New Page**: `src/app/dashboard/team/feedback/page.tsx`

**Components to Create**:
- `FeedbackInbox.tsx` - Main inbox view
- `FeedbackCard.tsx` - Individual feedback item
- `AddFeedbackModal.tsx` - Submit feedback modal
- `FeedbackStatusBadge.tsx` - Status indicator
- `FeedbackFilters.tsx` - Filter by status/category

**Acceptance Criteria**:
- [ ] Database table created
- [ ] All CRUD APIs working
- [ ] Feedback page accessible
- [ ] Inbox displays feedback
- [ ] Status updates work
- [ ] Internal notes saveable

---

### P1-4: Connect Social Templates to Dashboard

**Priority**: P1
**Effort**: 4 hours
**Impact**: Medium-High - feature already built, just needs page

**New Page**: `src/app/dashboard/content/social-templates/page.tsx`

**Existing Components to Use**:
- `src/components/social-templates/TemplateCard.tsx`
- `src/components/social-templates/TemplateSearch.tsx`
- `src/components/social-templates/TemplateFilters.tsx`
- `src/components/social-templates/TemplateEditor.tsx`
- `src/components/social-templates/VariationsModal.tsx`

**Existing API Endpoints** (already working):
- `GET /api/social-templates/search`
- `POST /api/social-templates/generate`
- `GET /api/social-templates/[id]`
- `PUT /api/social-templates/[id]`
- `DELETE /api/social-templates/[id]`
- `POST /api/social-templates/[id]/duplicate`
- `POST /api/social-templates/[id]/favorite`
- `GET /api/social-templates/[id]/variations`
- `POST /api/social-templates/export`

**Page Structure**:

```typescript
"use client";

import { useState } from "react";
import { TemplateSearch } from "@/components/social-templates/TemplateSearch";
import { TemplateFilters } from "@/components/social-templates/TemplateFilters";
import { TemplateCard } from "@/components/social-templates/TemplateCard";
import { TemplateEditor } from "@/components/social-templates/TemplateEditor";

export default function SocialTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch templates from API
  // Render gallery
  // Handle create/edit/delete

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      {/* Search & Filters */}
      {/* Template Gallery */}
      {/* Editor Modal */}
    </div>
  );
}
```

**Navigation Update**:

Update `src/components/layout/ModernSidebar.tsx` and main dashboard navigation to include:
```typescript
{ name: "Social Templates", href: "/dashboard/content/social-templates", icon: MessageSquare }
```

**Acceptance Criteria**:
- [ ] Page accessible at `/dashboard/content/social-templates`
- [ ] Template gallery displays
- [ ] Search works
- [ ] Filters work
- [ ] Create template works
- [ ] Edit template works
- [ ] Duplicate template works
- [ ] Export works
- [ ] Added to navigation

---

### P1-5: Fix Incomplete Button Handlers

**Priority**: P1
**Effort**: 4 hours
**Impact**: Medium - UX improvement

**Contacts Page "Send Email" Button**:

**File**: `src/app/dashboard/contacts/page.tsx` (Line 276-279)

```typescript
// BEFORE:
<DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
  <Mail className="w-4 h-4 mr-2" />
  Send Email
</DropdownMenuItem>

// AFTER:
<DropdownMenuItem
  onClick={() => handleSendEmail(contact)}
  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
>
  <Mail className="w-4 h-4 mr-2" />
  Send Email
</DropdownMenuItem>

// Add handler:
const handleSendEmail = (contact: any) => {
  // Option 1: Open compose modal
  setComposeModalOpen(true);
  setSelectedContact(contact);

  // Option 2: Redirect to Gmail integration
  // router.push(`/api/integrations/gmail/send?to=${contact.email}`);
};
```

**Contacts Page "Delete" Button**:

**File**: `src/app/dashboard/contacts/page.tsx` (Line 289-291)

```typescript
// BEFORE:
<DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
  Delete
</DropdownMenuItem>

// AFTER:
<DropdownMenuItem
  onClick={() => handleDeleteContact(contact.id)}
  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer"
>
  Delete
</DropdownMenuItem>

// Add handler:
const handleDeleteContact = async (contactId: string) => {
  if (!confirm("Are you sure you want to delete this contact?")) return;

  try {
    const response = await fetch(`/api/contacts/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ contactIds: [contactId] }),
    });

    if (response.ok) {
      // Refresh contact list
      setAllContacts(prev => prev.filter(c => c.id !== contactId));
    }
  } catch (error) {
    console.error("Error deleting contact:", error);
  }
};
```

**Email Preview Links**:

**File**: `src/components/sequences/EmailPreview.tsx` (Lines 67, 88, 90)

```typescript
// Line 67 - CTA Link:
// BEFORE:
<a href="#" className="text-primary hover:underline">
  {email.cta || "Learn More"}
</a>

// AFTER:
<a
  href={email.ctaUrl || "#"}
  target="_blank"
  rel="noopener noreferrer"
  className="text-primary hover:underline"
>
  {email.cta || "Learn More"}
</a>

// Lines 88-90 - Footer Links:
// BEFORE:
<a href="#" className="hover:underline">Unsubscribe</a>
<a href="#" className="hover:underline">Update preferences</a>

// AFTER:
<a href="/unsubscribe" className="hover:underline">Unsubscribe</a>
<a href="/preferences" className="hover:underline">Update preferences</a>
```

**Acceptance Criteria**:
- [ ] Send Email button opens compose modal or redirects
- [ ] Delete button shows confirmation and deletes contact
- [ ] Email CTA links work
- [ ] Unsubscribe/preferences links work
- [ ] All buttons have proper handlers

---

## P2: Medium Priority (Complete Week 3)

**Estimated Total**: 24 hours
**Impact**: Enhanced features, improved UX

---

### P2-1: Create Messages Hub (Unified Inbox)

**Priority**: P2
**Effort**: 12 hours
**Impact**: Medium - improves communication workflow

**Database Migration**:

```sql
-- supabase/migrations/032_create_messages_table.sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  external_id TEXT,
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

-- RLS Policies
```

**New API Routes**:

```typescript
// src/app/api/messages/unified/route.ts
export async function GET(req: NextRequest) {
  // Aggregate messages from email + whatsapp
  const emailMessages = await fetchEmailMessages();
  const whatsappMessages = await fetchWhatsAppMessages();

  const unified = [...emailMessages, ...whatsappMessages]
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

  return NextResponse.json({ messages: unified });
}

// src/app/api/messages/[id]/mark-read/route.ts
// src/app/api/messages/[id]/star/route.ts
```

**New Pages**:
1. `src/app/dashboard/messages/page.tsx` - Messages hub
2. `src/app/dashboard/messages/inbox/page.tsx` - Unified inbox
3. `src/app/dashboard/messages/email/page.tsx` - Email inbox

**Components to Create**:
- `UnifiedInbox.tsx` - Main inbox component
- `MessageList.tsx` - Message list
- `MessagePreview.tsx` - Message preview pane
- `ChannelFilter.tsx` - Filter by email/WhatsApp
- `ComposeEmailModal.tsx` - Email composer

**Acceptance Criteria**:
- [ ] Messages table created
- [ ] Unified API endpoint works
- [ ] Messages hub page accessible
- [ ] Inbox aggregates email + WhatsApp
- [ ] Mark as read/unread works
- [ ] Star/unstar works
- [ ] Channel filtering works

---

### P2-2: Implement Asset Upload to Cloud Storage

**Priority**: P2
**Effort**: 8 hours
**Impact**: Medium - enables file persistence

**Current Issue**:

**File**: `src/components/assets/AssetUpload.tsx` (Line 60)
```typescript
// TODO: Implement actual upload to Convex storage
```

**File**: `lib/gmail/storage.ts` (Lines 28, 87, 103)
```typescript
// TODO: Implement actual cloud storage upload
// TODO: Implement actual deletion from cloud storage
// TODO: Generate signed URL for secure download
```

**Solution**: Use Supabase Storage

**Implementation**:

```typescript
// lib/storage/upload.ts
import { supabase } from "@/lib/supabase";

export async function uploadFile(
  file: File,
  bucket: string = "assets",
  folder: string = "uploads"
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  return data.path;
}

export async function getSignedUrl(path: string, bucket: string = "assets"): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) throw error;

  return data.signedUrl;
}

export async function deleteFile(path: string, bucket: string = "assets"): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}
```

**Update AssetUpload Component**:

```typescript
// src/components/assets/AssetUpload.tsx
import { uploadFile } from "@/lib/storage/upload";

const handleUpload = async (file: File) => {
  try {
    const path = await uploadFile(file, "assets", "user-uploads");

    // Save to database
    const { data, error } = await supabase
      .from("assets")
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });

    if (error) throw error;

    onUploadComplete(data);
  } catch (error) {
    console.error("Upload error:", error);
  }
};
```

**Supabase Storage Setup**:
1. Create "assets" bucket in Supabase Storage
2. Configure RLS policies for workspace isolation
3. Set file size limits (e.g., 10MB)

**Acceptance Criteria**:
- [ ] Files upload to Supabase Storage
- [ ] Signed URLs generated for downloads
- [ ] File deletion works
- [ ] Gmail attachments persist
- [ ] Asset gallery shows uploaded files
- [ ] Workspace isolation enforced

---

### P2-3: Add Email Notifications (Stripe)

**Priority**: P2
**Effort**: 4 hours
**Impact**: Medium - improves customer communication

**Current TODOs**:

**File**: `src/app/api/stripe/webhook/route.ts`
- Line 464: `// TODO: Send email notification to customer`
- Line 473: `// TODO: Send email notification to customer to complete payment`
- Line 564: `// TODO: Send email notification to customer`

**Implementation**:

```typescript
// lib/email/notifications.ts
import { supabase } from "@/lib/supabase";

export async function sendPaymentNotification(
  customerId: string,
  type: "success" | "failed" | "action_required",
  details: any
) {
  // Get customer email
  const { data: customer } = await supabase
    .from("user_profiles")
    .select("email, full_name")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!customer) return;

  const templates = {
    success: {
      subject: "Payment Successful - Unite-Hub",
      body: `Hi ${customer.full_name},\n\nYour payment was successful...`
    },
    failed: {
      subject: "Payment Failed - Unite-Hub",
      body: `Hi ${customer.full_name},\n\nYour payment failed...`
    },
    action_required: {
      subject: "Action Required - Unite-Hub Payment",
      body: `Hi ${customer.full_name},\n\nAction required for your payment...`
    }
  };

  const template = templates[type];

  // Send via Gmail API or email service
  await sendEmail({
    to: customer.email,
    subject: template.subject,
    body: template.body,
  });
}
```

**Update Webhook Handler**:

```typescript
// src/app/api/stripe/webhook/route.ts

// Line 464:
- // TODO: Send email notification to customer
+ await sendPaymentNotification(subscription.customer, "failed", { subscription });

// Line 473:
- // TODO: Send email notification to customer to complete payment
+ await sendPaymentNotification(invoice.customer, "action_required", { invoice });

// Line 564:
- // TODO: Send email notification to customer
+ await sendPaymentNotification(paymentIntent.customer, "failed", { paymentIntent });
```

**Email Service Options**:
1. Use existing Gmail integration
2. Use SendGrid/Mailgun
3. Use Supabase Edge Functions + Resend

**Acceptance Criteria**:
- [ ] Payment success emails sent
- [ ] Payment failure emails sent
- [ ] Action required emails sent
- [ ] Emails formatted professionally
- [ ] Unsubscribe link included

---

## P3: Low Priority (Future Enhancements)

**Estimated Total**: 52 hours
**Impact**: Nice-to-haves, optimizations

---

### P3-1: Implement Background Processing (Media Upload)

**Priority**: P3
**Effort**: 40 hours
**Impact**: Low - Phase 3 feature, not blocking

**Current TODO**:

**File**: `src/app/api/media/upload/route.ts` (Lines 270, 277)
```typescript
// 8. TRIGGER BACKGROUND PROCESSING (PHASE 3 - TODO)
// TODO: Phase 3 - Implement transcription endpoint
```

**Features**:
- Video transcription
- Audio transcription
- Thumbnail generation
- Video optimization
- Async job queue

**Implementation**:
- Use Supabase Edge Functions or separate worker service
- Queue system (Redis, BullMQ, or pg-boss)
- Progress tracking in database

**Deferred**: This is Phase 3 work, not needed for MVP

---

### P3-2: Make Timezone Configurable

**Priority**: P3
**Effort**: 4 hours
**Impact**: Low - user preference

**Current TODO**:

**File**: `src/lib/services/google-calendar.ts` (Line 252)
```typescript
timeZone: "America/New_York", // TODO: Make configurable
```

**Implementation**:
1. Add timezone field to user_profiles table
2. Add timezone selector in profile settings
3. Use user's timezone for all calendar operations

**Acceptance Criteria**:
- [ ] Timezone stored in user profile
- [ ] Timezone selector in settings
- [ ] All calendar events use user timezone

---

### P3-3: Landing Page Export (HTML/PDF)

**Priority**: P3
**Effort**: 8 hours
**Impact**: Low - enhancement feature

**Current TODO**:

**File**: `src/app/dashboard/resources/landing-pages/[id]/page.tsx` (Line 134)
```typescript
// TODO: Implement actual export functionality
```

**Implementation**:
- HTML export: Generate standalone HTML file
- PDF export: Use Puppeteer or similar
- Download functionality

**Acceptance Criteria**:
- [ ] Export to HTML works
- [ ] Export to PDF works
- [ ] Downloaded file is properly formatted

---

## Summary Table

| Priority | Task | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| P0-1 | Re-enable Authentication | 4h | Critical | Pending |
| P0-2 | Fix Landing Footer | 2h | Critical | Pending |
| P0-3 | Fix Auth Footer | 1h | Critical | Pending |
| P0-4 | Create Legal Pages | 4h | Critical | Pending |
| P0-5 | Verify Workspace Isolation | 1h | Critical | Pending |
| **P0 Total** | | **12h** | | |
| P1-1 | Reports Dashboard | 8h | High | Pending |
| P1-2 | Task Management | 8h | High | Pending |
| P1-3 | Feedback System | 8h | High | Pending |
| P1-4 | Social Templates Page | 4h | High | Pending |
| P1-5 | Fix Button Handlers | 4h | High | Pending |
| **P1 Total** | | **32h** | | |
| P2-1 | Unified Inbox | 12h | Medium | Pending |
| P2-2 | Cloud Storage | 8h | Medium | Pending |
| P2-3 | Email Notifications | 4h | Medium | Pending |
| **P2 Total** | | **24h** | | |
| P3-1 | Background Processing | 40h | Low | Deferred |
| P3-2 | Timezone Config | 4h | Low | Deferred |
| P3-3 | Landing Export | 8h | Low | Deferred |
| **P3 Total** | | **52h** | | |
| **GRAND TOTAL** | | **120h** | | |

---

## Implementation Timeline

### Week 1: Critical Fixes (P0)
- Day 1-2: Authentication + Legal pages
- Day 3: Landing page footer
- Day 4: Auth page footers
- Day 5: Workspace isolation verification

### Week 2: Core Features (P1)
- Day 1-2: Reports dashboard
- Day 3: Task management
- Day 4: Feedback system
- Day 5: Social templates + button handlers

### Week 3: Enhancements (P2)
- Day 1-3: Unified inbox
- Day 4: Cloud storage
- Day 5: Email notifications

### Future: Optimizations (P3)
- Deferred to next quarter

---

## Testing Checklist

### After P0 Completion
- [ ] All API routes require authentication
- [ ] No TODO comments about authentication
- [ ] All landing page links work
- [ ] All auth page links work
- [ ] Legal pages accessible
- [ ] Privacy policy comprehensive
- [ ] Terms of service comprehensive
- [ ] Workspace isolation verified

### After P1 Completion
- [ ] Reports page displays data
- [ ] Charts render correctly
- [ ] Tasks can be created/edited/deleted
- [ ] Tasks can be assigned
- [ ] Feedback can be submitted
- [ ] Feedback status updates
- [ ] Social templates page works
- [ ] All buttons have handlers
- [ ] Contact actions work

### After P2 Completion
- [ ] Unified inbox aggregates messages
- [ ] Channel filtering works
- [ ] Files upload to cloud
- [ ] Signed URLs work
- [ ] Email notifications sent
- [ ] Notification templates formatted

---

## Rollout Strategy

1. **Deploy P0 to staging**: Test all critical fixes
2. **Security audit**: Verify authentication and workspace isolation
3. **Deploy P0 to production**: Fix critical issues
4. **Deploy P1 to staging**: Test new features
5. **User acceptance testing**: Get feedback on new features
6. **Deploy P1 to production**: Launch core features
7. **Iterate on P2**: Deploy enhancements incrementally
8. **Plan P3**: Schedule future optimizations

---

## Success Metrics

### P0 Success Criteria
- [ ] Zero broken links on landing page
- [ ] Zero broken links on auth pages
- [ ] All API routes authenticated
- [ ] Legal pages compliant with GDPR/CCPA
- [ ] No data leakage between workspaces

### P1 Success Criteria
- [ ] Reports page used by >50% of users
- [ ] Tasks created by >30% of teams
- [ ] Feedback submitted by >20% of clients
- [ ] Social templates used by >40% of users
- [ ] Zero complaints about broken buttons

### P2 Success Criteria
- [ ] Unified inbox saves users 30% time
- [ ] File uploads persist successfully
- [ ] Email notification open rate >40%
- [ ] User satisfaction score >4.5/5

---

**Action Plan End**

*Use this plan in conjunction with SITE-AUDIT-REPORT.md and INTEGRATION-BLUEPRINT.md for complete implementation guidance.*
