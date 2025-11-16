# Workspace Isolation Security Fixes

**Related Audit**: WORKSPACE_ISOLATION_AUDIT_REPORT.md
**Priority**: 🔴 **CRITICAL** - Deploy immediately
**Estimated Time**: 4-6 hours
**Breaking Changes**: Yes (db.ts API changes)

---

## Fix Strategy

We'll use a **phased migration** approach to minimize breaking changes:

### Phase 1: Add Secure Methods (No Breaking Changes)
- Add new `*WithWorkspace()` methods alongside existing ones
- Mark old methods as deprecated with console warnings
- Update critical API endpoints to use new methods

### Phase 2: Migrate All Callers (1-2 days)
- Update all 20+ API endpoints to use secure methods
- Add integration tests for each endpoint
- Verify workspace isolation works end-to-end

### Phase 3: Remove Deprecated Methods (After migration)
- Delete old insecure methods from db.ts
- Update TypeScript to catch any remaining usages
- Deploy final secured version

---

## Phase 1: Add Secure Helper Methods

### File: `src/lib/db.ts`

**Add these new secure methods immediately after existing methods:**

```typescript
// ==========================================
// SECURE WORKSPACE-VALIDATED METHODS
// Added: 2025-11-16 - Workspace Isolation Fix
// ==========================================

contacts: {
  // ... existing methods ...

  /**
   * Get contact by ID with workspace validation
   * @security REQUIRED - Always use this method instead of getById()
   * @param id - Contact UUID
   * @param workspaceId - Workspace UUID to verify access
   * @returns Contact if found and belongs to workspace, null otherwise
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found - either doesn't exist or wrong workspace
        return null;
      }
      throw error;
    }
    return data;
  },

  /**
   * Update contact with workspace validation
   * @security REQUIRED - Verifies contact belongs to workspace before update
   */
  updateSecure: async (id: string, workspaceId: string, data: any) => {
    // First verify contact belongs to workspace
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      throw new Error(`Contact ${id} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    const { data: updated, error } = await supabaseServer
      .from("contacts")
      .update(data)
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ DOUBLE CHECK
      .select()
      .single();

    if (error) throw error;
    return { data: updated, error: null };
  },

  /**
   * Update AI score with workspace validation
   * @security REQUIRED - Verifies contact belongs to workspace
   */
  updateScoreSecure: async (id: string, workspaceId: string, score: number) => {
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      throw new Error(`Contact ${id} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("contacts")
      .update({ ai_score: score, updated_at: new Date() })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update intelligence data with workspace validation
   * @security REQUIRED - Verifies contact belongs to workspace
   */
  updateIntelligenceSecure: async (id: string, workspaceId: string, intelligence: any) => {
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      throw new Error(`Contact ${id} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("contacts")
      .update({
        ...intelligence,
        last_analysis_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get contact with emails (workspace-validated)
   * @security REQUIRED - Validates workspace for both contact and emails
   */
  getWithEmailsSecure: async (id: string, workspaceId: string) => {
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      return null;
    }

    // Emails will be filtered by contact_id, which is already workspace-validated
    const emails = await db.emails.getByContact(id);
    return { ...contact, emails };
  },

  // DEPRECATED METHODS - Add warnings to existing methods
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.contacts.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, data: any) => {
    console.warn('⚠️ SECURITY WARNING: db.contacts.update() is deprecated. Use updateSecure(id, workspaceId, data) instead.');
    console.trace('Called from:');

    const supabaseServer = await getSupabaseServer();
    const { data: contact, error } = await supabaseServer
      .from("contacts")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data: contact, error: null };
  },

  updateScore: async (id: string, score: number) => {
    console.warn('⚠️ SECURITY WARNING: db.contacts.updateScore() is deprecated. Use updateScoreSecure(id, workspaceId, score) instead.');
    console.trace('Called from:');

    const supabaseServer = await getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("contacts")
      .update({ ai_score: score, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateIntelligence: async (id: string, intelligence: any) => {
    console.warn('⚠️ SECURITY WARNING: db.contacts.updateIntelligence() is deprecated. Use updateIntelligenceSecure(id, workspaceId, intelligence) instead.');
    console.trace('Called from:');

    const supabaseServer = await getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("contacts")
      .update({
        ...intelligence,
        last_analysis_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getWithEmails: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.contacts.getWithEmails() is deprecated. Use getWithEmailsSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const contact = await db.contacts.getById(id);
    const emails = await db.emails.getByContact(id);
    return { ...contact, emails };
  },
},

emails: {
  // ... existing methods ...

  /**
   * Get email by ID with workspace validation
   * @security REQUIRED - Always use this method instead of getById()
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // DEPRECATED
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.emails.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
},

content: {
  // ... existing methods ...

  /**
   * Get generated content by ID with workspace validation
   * @security REQUIRED - Always use this method instead of getById()
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // DEPRECATED
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.content.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
},

sentEmails: {
  // ... existing methods ...

  /**
   * Get sent email by ID with workspace validation
   * @security REQUIRED - Always use this method instead of getById()
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("sent_emails")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // DEPRECATED
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.sentEmails.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("sent_emails")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Record email open with workspace validation
   * @security REQUIRED - Verifies email belongs to workspace before recording open
   */
  recordOpenSecure: async (sentEmailId: string, workspaceId: string, metadata: any) => {
    // Verify email belongs to workspace
    const email = await db.sentEmails.getByIdSecure(sentEmailId, workspaceId);
    if (!email) {
      throw new Error(`Email ${sentEmailId} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    await supabaseServer
      .from("email_opens")
      .insert([{ sent_email_id: sentEmailId, ...metadata }]);

    // Increment opens count
    await supabaseServer
      .from("sent_emails")
      .update({
        opens: (email.opens || 0) + 1,
        first_open_at: email.first_open_at || new Date(),
      })
      .eq("id", sentEmailId)
      .eq("workspace_id", workspaceId);  // ✅ DOUBLE CHECK
  },

  /**
   * Record email click with workspace validation
   * @security REQUIRED - Verifies email belongs to workspace before recording click
   */
  recordClickSecure: async (sentEmailId: string, workspaceId: string, linkUrl: string, metadata: any) => {
    // Verify email belongs to workspace
    const email = await db.sentEmails.getByIdSecure(sentEmailId, workspaceId);
    if (!email) {
      throw new Error(`Email ${sentEmailId} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    await supabaseServer
      .from("email_clicks")
      .insert([
        {
          sent_email_id: sentEmailId,
          link_url: linkUrl,
          ...metadata,
        },
      ]);

    // Increment clicks count
    await supabaseServer
      .from("sent_emails")
      .update({
        clicks: (email.clicks || 0) + 1,
        first_click_at: email.first_click_at || new Date(),
      })
      .eq("id", sentEmailId)
      .eq("workspace_id", workspaceId);  // ✅ DOUBLE CHECK
  },
},

clientEmails: {
  // ... existing methods ...

  /**
   * Get client email by ID with workspace validation
   * @security REQUIRED - Validates via parent contact's workspace
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("client_emails")
      .select("*, contacts!inner(*)")
      .eq("id", id)
      .eq("contacts.workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION VIA JOIN
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // DEPRECATED
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.clientEmails.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("client_emails")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
},

whatsappMessages: {
  // ... existing methods ...

  /**
   * Get WhatsApp message by ID with workspace validation
   * @security REQUIRED - Always use this method instead of getById()
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)  // ✅ WORKSPACE VALIDATION
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // DEPRECATED
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY WARNING: db.whatsappMessages.getById() is deprecated. Use getByIdSecure(id, workspaceId) instead.');
    console.trace('Called from:');

    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
},
```

---

## Phase 2: Update API Endpoints

### Pattern for Updating Endpoints

**Before (VULNERABLE)**:
```typescript
export async function GET(request, { params }) {
  const { id } = await params;

  // ❌ VULNERABLE - No workspace check
  const client = await db.contacts.getById(id);

  return NextResponse.json({ client });
}
```

**After (SECURE)**:
```typescript
export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's workspace
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!userOrg) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("org_id", userOrg.org_id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // ✅ SECURE - Workspace validation
  const client = await db.contacts.getByIdSecure(id, workspace.id);

  if (!client) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}
```

### Files Requiring Updates

**Priority Order** (fix most critical first):

#### 🔴 CRITICAL (Fix Today)
1. `src/app/api/clients/[id]/persona/route.ts` - GET and PUT
2. `src/app/api/clients/[id]/mindmap/route.ts` - GET
3. `src/app/api/clients/[id]/campaigns/route.ts` - GET and POST
4. `src/app/api/clients/[id]/hooks/route.ts` - GET and POST

#### 🟡 HIGH (Fix This Week)
5. `src/app/api/clients/[id]/assets/route.ts`
6. `src/app/api/clients/[id]/assets/upload/route.ts`
7. `src/app/api/clients/[id]/assets/[assetId]/route.ts`
8. `src/app/api/clients/[id]/campaigns/duplicate/route.ts`
9. `src/app/api/clients/[id]/campaigns/[cid]/route.ts`
10. `src/app/api/clients/[id]/mindmap/export/route.ts`
11. `src/app/api/clients/[id]/mindmap/update/route.ts`
12. `src/app/api/clients/[id]/persona/export/route.ts`
13. `src/app/api/clients/[id]/persona/history/route.ts`

---

## Phase 3: Add Integration Tests

### File: `tests/security/workspace-isolation.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestUser, createTestOrganization, createTestWorkspace, createTestContact } from '../helpers/test-factory';
import { db } from '@/lib/db';

describe('Workspace Isolation Security Tests', () => {
  let orgA, orgB, workspaceA, workspaceB, contactA, contactB;

  beforeAll(async () => {
    // Setup: Create two separate organizations
    orgA = await createTestOrganization({ name: 'Org A' });
    orgB = await createTestOrganization({ name: 'Org B' });

    workspaceA = await createTestWorkspace({ org_id: orgA.id });
    workspaceB = await createTestWorkspace({ org_id: orgB.id });

    contactA = await createTestContact({ workspace_id: workspaceA.id, email: 'contact-a@example.com' });
    contactB = await createTestContact({ workspace_id: workspaceB.id, email: 'contact-b@example.com' });
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('db.contacts.getByIdSecure()', () => {
    it('should return contact when workspace matches', async () => {
      const result = await db.contacts.getByIdSecure(contactA.id, workspaceA.id);
      expect(result).not.toBeNull();
      expect(result.id).toBe(contactA.id);
      expect(result.email).toBe('contact-a@example.com');
    });

    it('should return null when workspace does NOT match', async () => {
      // Try to access Org A contact from Org B workspace
      const result = await db.contacts.getByIdSecure(contactA.id, workspaceB.id);
      expect(result).toBeNull();
    });

    it('should return null for non-existent contact', async () => {
      const result = await db.contacts.getByIdSecure('00000000-0000-0000-0000-000000000000', workspaceA.id);
      expect(result).toBeNull();
    });
  });

  describe('db.contacts.updateSecure()', () => {
    it('should update contact when workspace matches', async () => {
      const result = await db.contacts.updateSecure(contactA.id, workspaceA.id, { tags: ['test'] });
      expect(result.data.tags).toContain('test');
    });

    it('should throw error when workspace does NOT match', async () => {
      await expect(
        db.contacts.updateSecure(contactA.id, workspaceB.id, { tags: ['hacked'] })
      ).rejects.toThrow('not found in workspace');
    });
  });

  describe('API Route: GET /api/clients/[id]', () => {
    it('should allow access to own workspace contact', async () => {
      const response = await fetch(`/api/clients/${contactA.id}`, {
        headers: { Authorization: `Bearer ${orgAUserToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.client.id).toBe(contactA.id);
    });

    it('should deny access to other workspace contact', async () => {
      const response = await fetch(`/api/clients/${contactA.id}`, {
        headers: { Authorization: `Bearer ${orgBUserToken}` }
      });

      expect(response.status).toBe(404); // or 403
      const data = await response.json();
      expect(data.client).toBeUndefined();
    });
  });
});
```

---

## Phase 4: Add RLS Policies (Defense in Depth)

### Migration: `supabase/migrations/013_rls_workspace_isolation.sql`

```sql
-- ==========================================
-- RLS Policies for Workspace Isolation
-- Created: 2025-11-16
-- Purpose: Enforce workspace isolation at database level
-- ==========================================

-- Enable RLS on workspace-scoped tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CONTACTS TABLE
-- ==========================================

-- Users can only SELECT contacts in their workspace
CREATE POLICY "Users can view contacts in their workspace"
ON contacts
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can only INSERT contacts into their workspace
CREATE POLICY "Users can create contacts in their workspace"
ON contacts
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can only UPDATE contacts in their workspace
CREATE POLICY "Users can update contacts in their workspace"
ON contacts
FOR UPDATE
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can only DELETE contacts in their workspace
CREATE POLICY "Users can delete contacts in their workspace"
ON contacts
FOR DELETE
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- EMAILS TABLE
-- ==========================================

CREATE POLICY "Users can view emails in their workspace"
ON emails
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create emails in their workspace"
ON emails
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- CAMPAIGNS TABLE
-- ==========================================

CREATE POLICY "Users can view campaigns in their workspace"
ON campaigns
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create campaigns in their workspace"
ON campaigns
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update campaigns in their workspace"
ON campaigns
FOR UPDATE
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- DRIP_CAMPAIGNS TABLE
-- ==========================================

CREATE POLICY "Users can view drip campaigns in their workspace"
ON drip_campaigns
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create drip campaigns in their workspace"
ON drip_campaigns
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update drip campaigns in their workspace"
ON drip_campaigns
FOR UPDATE
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- GENERATED_CONTENT TABLE
-- ==========================================

CREATE POLICY "Users can view generated content in their workspace"
ON generated_content
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create generated content in their workspace"
ON generated_content
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- WHATSAPP_MESSAGES TABLE
-- ==========================================

CREATE POLICY "Users can view WhatsApp messages in their workspace"
ON whatsapp_messages
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create WhatsApp messages in their workspace"
ON whatsapp_messages
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- WHATSAPP_CONVERSATIONS TABLE
-- ==========================================

CREATE POLICY "Users can view WhatsApp conversations in their workspace"
ON whatsapp_conversations
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create WhatsApp conversations in their workspace"
ON whatsapp_conversations
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ==========================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- Service role needs to bypass RLS for system operations
-- ==========================================

-- This allows backend operations to work while still enforcing
-- RLS for regular user queries
```

---

## Phase 5: Add Audit Logging

### File: `src/lib/audit-logger.ts`

```typescript
import { db } from './db';

export interface SecurityEvent {
  type: 'workspace_violation' | 'unauthorized_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  resourceType: string;
  resourceId: string;
  attemptedWorkspaceId?: string;
  actualWorkspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
}

export async function logSecurityEvent(event: SecurityEvent, orgId: string) {
  try {
    await db.auditLogs.create({
      org_id: orgId,
      action: `security_${event.type}`,
      resource: event.resourceType,
      resource_id: event.resourceId,
      agent: 'security_monitor',
      status: 'warning',
      details: {
        severity: event.severity,
        userId: event.userId,
        attemptedWorkspaceId: event.attemptedWorkspaceId,
        actualWorkspaceId: event.actualWorkspaceId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        ...event.details,
      },
    });

    // If critical, send alert
    if (event.severity === 'critical') {
      await sendSecurityAlert(event, orgId);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging should never break the app
  }
}

async function sendSecurityAlert(event: SecurityEvent, orgId: string) {
  // TODO: Implement Slack/email alerts for security team
  console.error('🚨 CRITICAL SECURITY EVENT:', event);
}
```

### Update db.ts to Use Audit Logger

```typescript
import { logSecurityEvent } from './audit-logger';

// In getByIdSecure methods, add logging
getByIdSecure: async (id: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  // If not found, check if it exists in ANOTHER workspace (security violation)
  if (!data && !error) {
    const { data: otherWorkspace } = await supabase
      .from("contacts")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (otherWorkspace) {
      // Contact exists but in DIFFERENT workspace - log security violation
      await logSecurityEvent({
        type: 'workspace_violation',
        severity: 'critical',
        resourceType: 'contact',
        resourceId: id,
        attemptedWorkspaceId: workspaceId,
        actualWorkspaceId: otherWorkspace.workspace_id,
        details: {
          message: 'Attempted cross-workspace contact access',
          method: 'getByIdSecure',
        },
      }, workspaceId);
    }
  }

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
},
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Create feature branch: `feature/workspace-isolation-fix`
- [ ] Apply Phase 1 fixes (add secure methods to db.ts)
- [ ] Add deprecation warnings to old methods
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`

### Deployment Steps
- [ ] Deploy Phase 1 changes to development
- [ ] Test deprecation warnings appear in logs
- [ ] Update 5 most critical API endpoints
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Monitor for security events
- [ ] Update remaining API endpoints
- [ ] Deploy RLS policies to staging database
- [ ] Test with real data
- [ ] Deploy to production

### Post-Deployment
- [ ] Monitor logs for deprecated method warnings
- [ ] Track security violation audit logs
- [ ] Update all endpoints within 1 week
- [ ] Remove deprecated methods after migration complete
- [ ] Update documentation
- [ ] Update developer onboarding guide

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Disable RLS policies (but keep code changes)
   ```sql
   ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
   ```

2. **Hotfix**: Remove deprecation warnings (they're just warnings, not blocking)

3. **Full Rollback**: Revert to previous git commit (but fix should be safe)

---

## Success Metrics

- ✅ Zero deprecation warnings in production logs (all endpoints migrated)
- ✅ Zero workspace violation security events
- ✅ All integration tests passing
- ✅ RLS policies active on all workspace-scoped tables
- ✅ Security audit report shows Grade A+

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Author**: Backend System Architect (Claude Code)
