# Workspace Isolation Fix - Quick Start Guide

**Last Updated**: 2025-11-16
**Time Required**: 2-4 hours (Phase 1)
**Difficulty**: Medium

---

## What This Guide Does

This is a **step-by-step implementation guide** to fix the critical workspace isolation vulnerability in Unite-Hub. Follow these steps exactly to secure your multi-tenant database.

---

## Prerequisites

- ✅ You've read `WORKSPACE_ISOLATION_SUMMARY.md`
- ✅ You have access to `src/lib/db.ts`
- ✅ You can deploy to staging environment
- ✅ You understand TypeScript and Supabase

---

## Phase 1: Add Secure Methods (2-4 hours)

### Step 1: Backup Current Code (5 minutes)

```bash
# Create backup of db.ts
cp src/lib/db.ts src/lib/db.ts.backup

# Create feature branch
git checkout -b fix/workspace-isolation-critical
git add src/lib/db.ts.backup
git commit -m "Backup db.ts before workspace isolation fix"
```

### Step 2: Open db.ts (1 minute)

```bash
# Open in your editor
code src/lib/db.ts
# or
vim src/lib/db.ts
```

### Step 3: Add Secure Contact Methods (30 minutes)

**Location**: After line 208 (after existing `contacts` methods)

**Add this code**:

```typescript
  // ==========================================
  // SECURE METHODS - Added 2025-11-16
  // Workspace isolation fix
  // ==========================================

  /**
   * Get contact by ID with workspace validation
   * @security REQUIRED - Always use this instead of getById()
   * @param id - Contact UUID
   * @param workspaceId - Workspace UUID to verify access
   * @returns Contact if found and belongs to workspace, null otherwise
   */
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found or wrong workspace
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
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      throw new Error(`Contact ${id} not found in workspace ${workspaceId}`);
    }

    const supabaseServer = await getSupabaseServer();
    const { data: updated, error } = await supabaseServer
      .from("contacts")
      .update(data)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return { data: updated, error: null };
  },

  /**
   * Update AI score with workspace validation
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
   * Get contact with emails (workspace-validated)
   */
  getWithEmailsSecure: async (id: string, workspaceId: string) => {
    const contact = await db.contacts.getByIdSecure(id, workspaceId);
    if (!contact) {
      return null;
    }

    const emails = await db.emails.getByContact(id);
    return { ...contact, emails };
  },
```

### Step 4: Add Deprecation Warnings to Old Methods (15 minutes)

**Find each old method and add warning at the start:**

```typescript
  // EXISTING METHOD - Add warning at line 140
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY: db.contacts.getById() is deprecated. Use getByIdSecure(id, workspaceId)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },

  // EXISTING METHOD - Add warning at line 100
  update: async (id: string, data: any) => {
    console.warn('⚠️ SECURITY: db.contacts.update() is deprecated. Use updateSecure(id, workspaceId, data)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },

  // EXISTING METHOD - Add warning at line 158
  updateScore: async (id: string, score: number) => {
    console.warn('⚠️ SECURITY: db.contacts.updateScore() is deprecated. Use updateScoreSecure(id, workspaceId, score)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },

  // EXISTING METHOD - Add warning at line 184
  getWithEmails: async (id: string) => {
    console.warn('⚠️ SECURITY: db.contacts.getWithEmails() is deprecated. Use getWithEmailsSecure(id, workspaceId)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },
```

### Step 5: Add Secure Email Methods (15 minutes)

**Location**: After line 276 (after existing `emails` methods)

```typescript
  // SECURE METHOD
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },
```

**Add deprecation warning to old method** (line 242):

```typescript
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY: db.emails.getById() is deprecated. Use getByIdSecure(id, workspaceId)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },
```

### Step 6: Add Secure Content Methods (15 minutes)

**Location**: After line 333 (after existing `content` methods)

```typescript
  // SECURE METHOD
  getByIdSecure: async (id: string, workspaceId: string) => {
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },
```

**Add deprecation warning** (line 316):

```typescript
  getById: async (id: string) => {
    console.warn('⚠️ SECURITY: db.content.getById() is deprecated. Use getByIdSecure(id, workspaceId)');
    console.trace('Called from:');
    // ... rest of existing code ...
  },
```

### Step 7: Test TypeScript Compilation (5 minutes)

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Should see NO errors related to db.ts
```

### Step 8: Commit Phase 1 Changes (5 minutes)

```bash
git add src/lib/db.ts
git commit -m "feat: Add secure workspace-validated methods to db.ts

- Add getByIdSecure() for contacts, emails, content
- Add updateSecure() methods with workspace validation
- Add deprecation warnings to old insecure methods
- Prepares for Phase 2 API endpoint migration

SECURITY: Fixes critical workspace isolation vulnerability
Ref: WORKSPACE_ISOLATION_AUDIT_REPORT.md"
```

### Step 9: Deploy to Staging (10 minutes)

```bash
# Push to staging
git push origin fix/workspace-isolation-critical

# Or deploy via your CI/CD
npm run deploy:staging
```

### Step 10: Verify Deprecation Warnings (10 minutes)

**Check staging logs for warnings:**

```bash
# View logs
npm run logs:staging

# You should see warnings like:
# ⚠️ SECURITY: db.contacts.getById() is deprecated...
# Called from: /api/clients/[id]/persona/route.ts:45
```

**Count how many deprecated calls exist:**

```bash
# Count occurrences
grep -r "db\.contacts\.getById" src/app/api --include="*.ts" | wc -l
# Example output: 20

# This tells you how many endpoints need fixing
```

---

## Phase 2: Update API Endpoints (Next Step)

### Example Fix for One Endpoint

**File**: `src/app/api/clients/[id]/persona/route.ts`

#### ❌ BEFORE (Vulnerable)

```typescript
export async function GET(req, { params }) {
  const { id } = await params;

  // VULNERABLE - No workspace check
  const client = await db.contacts.getById(id);

  return NextResponse.json({ client });
}
```

#### ✅ AFTER (Secure)

```typescript
export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get user's organization
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!userOrg) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  // 3. Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("org_id", userOrg.org_id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  // 4. Get contact with workspace validation
  const client = await db.contacts.getByIdSecure(id, workspace.id);

  if (!client) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}
```

### Files to Update (Priority Order)

1. ✅ **HIGH PRIORITY** (Update today):
   - `src/app/api/clients/[id]/persona/route.ts`
   - `src/app/api/clients/[id]/mindmap/route.ts`
   - `src/app/api/clients/[id]/campaigns/route.ts`
   - `src/app/api/clients/[id]/hooks/route.ts`
   - `src/app/api/clients/[id]/campaigns/[cid]/route.ts`

2. ⚠️ **MEDIUM PRIORITY** (Update this week):
   - All other files in `src/app/api/clients/[id]/*`

### Automated Migration Helper

**Create a script to help identify all usages:**

```bash
# Find all files using deprecated methods
grep -rn "db\.contacts\.getById" src/app/api --include="*.ts" > deprecated-calls.txt

# Review the file
cat deprecated-calls.txt
```

---

## Verification Checklist

After Phase 1 deployment:

- [ ] TypeScript compiles without errors
- [ ] Staging deployment successful
- [ ] Deprecation warnings appear in logs
- [ ] No broken API endpoints
- [ ] Can still access own contacts
- [ ] Count of deprecated calls documented
- [ ] Team notified of upcoming Phase 2 changes

After Phase 2 completion:

- [ ] All API endpoints updated
- [ ] Zero deprecation warnings in logs
- [ ] Integration tests pass
- [ ] Can access own workspace contacts ✅
- [ ] Cannot access other workspace contacts ✅
- [ ] Security audit shows no violations

---

## Testing

### Manual Test

**Test 1: Access Own Contact (Should Work)**

```bash
# Get your workspace ID from dashboard
WORKSPACE_ID="your-workspace-id"
CONTACT_ID="your-contact-id"

# Test the secure method
curl -X GET "http://localhost:3008/api/clients/${CONTACT_ID}" \
  -H "Authorization: Bearer ${YOUR_TOKEN}"

# Should return contact data ✅
```

**Test 2: Access Other Workspace Contact (Should Fail)**

```bash
# Use contact ID from DIFFERENT workspace
OTHER_CONTACT_ID="other-workspace-contact-id"

curl -X GET "http://localhost:3008/api/clients/${OTHER_CONTACT_ID}" \
  -H "Authorization: Bearer ${YOUR_TOKEN}"

# Should return 404 Not Found ✅
```

### Automated Test

**Create**: `tests/workspace-isolation.test.ts`

```typescript
describe('Workspace Isolation', () => {
  it('should return contact from own workspace', async () => {
    const contact = await db.contacts.getByIdSecure(
      contactIdInWorkspaceA,
      workspaceA
    );
    expect(contact).not.toBeNull();
  });

  it('should return null for contact in other workspace', async () => {
    const contact = await db.contacts.getByIdSecure(
      contactIdInWorkspaceA, // Contact from Workspace A
      workspaceB            // Trying to access from Workspace B
    );
    expect(contact).toBeNull();  // Should be null ✅
  });
});
```

---

## Troubleshooting

### Issue: TypeScript errors after adding secure methods

**Solution**: Make sure you're adding methods INSIDE the existing objects:

```typescript
contacts: {
  // ... existing methods ...

  getByIdSecure: async (id: string, workspaceId: string) => {
    // ... code ...
  }, // <-- Don't forget comma!

  // ... more methods ...
},  // <-- Closing brace for contacts object
```

### Issue: Deprecation warnings not appearing

**Solution**: Check console.warn is not suppressed:

```bash
# In your .env.local
NODE_ENV=development  # Warnings only show in development
LOG_LEVEL=debug       # Enable all logs
```

### Issue: API routes returning 401 after fix

**Solution**: Make sure you're passing workspaceId:

```typescript
// ❌ Wrong - Missing workspaceId
const contact = await db.contacts.getByIdSecure(id);

// ✅ Correct - Include workspaceId
const contact = await db.contacts.getByIdSecure(id, workspace.id);
```

---

## Next Steps

1. ✅ **Complete Phase 1** (You're here!)
2. ⏭️ **Start Phase 2**: Update API endpoints (see `WORKSPACE_ISOLATION_FIXES.md`)
3. ⏭️ **Phase 3**: Add RLS policies (see migration SQL in fixes doc)
4. ⏭️ **Phase 4**: Add integration tests
5. ✅ **Final**: Remove deprecated methods, celebrate! 🎉

---

## Getting Help

- **Full Audit Report**: `WORKSPACE_ISOLATION_AUDIT_REPORT.md`
- **Detailed Fixes**: `WORKSPACE_ISOLATION_FIXES.md`
- **Visual Guide**: `WORKSPACE_ISOLATION_VISUAL.md`
- **Summary**: `WORKSPACE_ISOLATION_SUMMARY.md`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              QUICK REFERENCE                            │
├─────────────────────────────────────────────────────────┤
│ OLD (INSECURE):                                         │
│   db.contacts.getById(id)                               │
│                                                         │
│ NEW (SECURE):                                           │
│   db.contacts.getByIdSecure(id, workspaceId)            │
├─────────────────────────────────────────────────────────┤
│ WHERE TO GET workspaceId:                               │
│   1. From user's organization                           │
│   2. Via user_organizations → workspaces join           │
│   3. Never hardcode "default-org"                       │
├─────────────────────────────────────────────────────────┤
│ WHEN CONTACT NOT FOUND:                                 │
│   - Returns: null (not error)                           │
│   - HTTP: 404 Not Found                                 │
│   - Log: Security violation if exists in other workspace│
└─────────────────────────────────────────────────────────┘
```

---

**Quick Start Version**: 1.0
**Created**: 2025-11-16
**Estimated Time**: 2-4 hours (Phase 1)

**Good luck! You've got this! 🚀**
