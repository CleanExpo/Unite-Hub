# RLS (Row Level Security) Verification Guide

**Date**: 2025-11-25
**Status**: ⚠️ **Manual Verification Required**

---

## Current Status

Row Level Security (RLS) policies have been implemented via migrations 020-037. However, **automatic verification via the Supabase JS client is not possible** because:

1. The `pg_policies` system catalog is not accessible via the Supabase client
2. Direct SQL queries require Supabase SQL Editor access
3. Workspace isolation testing requires existing workspace records

---

## RLS Implementation History

### Migrations Applied:
- **Migration 020**: Initial RLS policies
- **Migrations 031-036**: RLS fixes for specific tables
- **Migration 037**: Cleanup duplicate policies

### Tables with RLS:
- ✅ `organizations` (4 policies)
- ✅ `user_organizations` (4 policies)
- ✅ `workspaces` (4 policies)
- ✅ `user_profiles` (4 policies)
- ⚠️ `contacts` (requires verification)
- ⚠️ `campaigns` (requires verification)
- ⚠️ `drip_campaigns` (requires verification)
- ⚠️ `emails` (requires verification)

---

## Manual Verification Steps

### Step 1: Run RLS Verification SQL Script

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run the script: `scripts/verify-rls-policies.sql`

**Expected Output**:
```sql
-- Should show RLS enabled for all critical tables
tablename         | rls_status
----------------- | -----------
contacts          | ✅ Enabled
campaigns         | ✅ Enabled
drip_campaigns    | ✅ Enabled
emails            | ✅ Enabled
```

### Step 2: Verify Policy Definitions

Run this query in Supabase SQL Editor:

```sql
SELECT
  tablename,
  policyname,
  permissive,
  cmd as command_type,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contacts', 'campaigns', 'drip_campaigns', 'emails')
ORDER BY tablename, policyname;
```

**What to Check**:
- Each table should have policies for: SELECT, INSERT, UPDATE, DELETE
- Policies should filter by `workspace_id`
- Using expressions should include workspace access checks

### Step 3: Test Workspace Isolation

**Test Case 1**: Create two test contacts in different workspaces

```sql
-- Create test workspace 1
INSERT INTO workspaces (id, org_id, name, slug)
VALUES (
  'test-workspace-1',
  'your-org-id-here',
  'Test Workspace 1',
  'test-1'
);

-- Create test workspace 2
INSERT INTO workspaces (id, org_id, name, slug)
VALUES (
  'test-workspace-2',
  'your-org-id-here',
  'Test Workspace 2',
  'test-2'
);

-- Insert contact in workspace 1
INSERT INTO contacts (workspace_id, name, email, status)
VALUES (
  'test-workspace-1',
  'Contact 1',
  'contact1@test.com',
  'new'
);

-- Insert contact in workspace 2
INSERT INTO contacts (workspace_id, name, email, status)
VALUES (
  'test-workspace-2',
  'Contact 2',
  'contact2@test.com',
  'new'
);

-- Verify isolation: Should only return contact1
SELECT name, workspace_id
FROM contacts
WHERE workspace_id = 'test-workspace-1';
-- Expected: Only "Contact 1"

-- Cleanup
DELETE FROM contacts WHERE workspace_id IN ('test-workspace-1', 'test-workspace-2');
DELETE FROM workspaces WHERE id IN ('test-workspace-1', 'test-workspace-2');
```

---

## Known Limitations

### 1. Service Role Bypass

The Supabase **service role key** bypasses ALL RLS policies. This is by design for administrative operations.

**Impact**:
- Health check scripts using service role key cannot verify RLS
- Production code should use **anon key** or user-specific tokens

### 2. Foreign Key Constraints

The test script failed because:
```
insert or update on table "contacts" violates foreign key constraint "contacts_workspace_id_fkey"
```

**Reason**: `workspace_id` must reference an existing workspace in the `workspaces` table.

**Solution**: Create test workspaces before testing isolation.

### 3. pg_policies View Access

Supabase JS client cannot query `pg_policies` system catalog:
```
Could not find the table 'public.pg_policies' in the schema cache
```

**Workaround**: Use Supabase SQL Editor for policy inspection.

---

## Production Readiness Checklist

Before going to production, verify:

- [ ] Run `scripts/verify-rls-policies.sql` in Supabase SQL Editor
- [ ] Confirm RLS enabled for ALL tables with `workspace_id` column
- [ ] Test workspace isolation with real user sessions (not service role)
- [ ] Verify policies exist for: SELECT, INSERT, UPDATE, DELETE
- [ ] Check that policies filter by `workspace_id` or organization membership
- [ ] Test with multiple users in different workspaces
- [ ] Verify users cannot see other workspaces' data

---

## Automated Testing Recommendation

Create an integration test that:

1. Creates two real user accounts (via Supabase Auth)
2. Creates two separate workspaces for each user
3. Inserts data into each workspace
4. Attempts cross-workspace queries using user-specific session tokens
5. Verifies data isolation is enforced

**Example Test Structure**:
```typescript
describe('RLS Workspace Isolation', () => {
  it('should prevent user1 from seeing user2 data', async () => {
    const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const user2Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in as user1
    await user1Client.auth.signInWithPassword({
      email: 'user1@test.com',
      password: 'test123'
    });

    // Sign in as user2
    await user2Client.auth.signInWithPassword({
      email: 'user2@test.com',
      password: 'test123'
    });

    // User1 creates contact in workspace1
    await user1Client.from('contacts').insert({
      workspace_id: workspace1Id,
      name: 'Contact 1',
      email: 'c1@test.com'
    });

    // User2 tries to query workspace1 contacts
    const { data } = await user2Client
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspace1Id);

    // Should return empty (RLS blocks access)
    expect(data).toHaveLength(0);
  });
});
```

---

## Security Recommendations

### 1. Never Use Service Role Key in Frontend

**Current Risk**: If service role key is exposed in client code, ALL RLS is bypassed.

**Fix**: Use anon key + user sessions for client-side operations.

### 2. Audit RLS Bypass Points

Check all API routes for service role usage:
```bash
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/app/api/
```

**Review**: Each usage should have a business justification.

### 3. Monitor RLS Violations

Set up logging for attempted RLS violations:
```sql
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (event_type, user_id, details)
  VALUES ('rls_violation_attempt', auth.uid(), row_to_json(NEW));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Next Steps

1. **Immediate** (30 minutes):
   - Run `verify-rls-policies.sql` in Supabase SQL Editor
   - Document results in this file

2. **Short-term** (4 hours):
   - Create integration test suite for RLS
   - Test with real user sessions (not service role)

3. **Medium-term** (1 week):
   - Add RLS monitoring and alerting
   - Implement automated RLS testing in CI/CD
   - Audit all service role key usage

---

**Last Updated**: 2025-11-25
**Status**: ⚠️ Manual verification required - automated checks not possible via Supabase JS client
