# Workspace Isolation Fixes - Implementation Checklist

**Priority**: P0 - CRITICAL
**Estimated Time**: 8-10 hours
**Risk if not fixed**: Data breach, compliance violations

---

## Priority 1: HIGH RISK (3-4 hours)

### 1. Fix src/lib/db.ts - Core Database Layer ⚠️ CRITICAL

**File**: `D:\Unite-Hub\src\lib\db.ts`
**Lines to Fix**: 140-147, 158-167, 169-182, 223-231, 232-241, 242-249

**Current Vulnerable Functions**:
```typescript
// ❌ BEFORE (Line 140)
getById: async (id: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)  // ← No workspace_id filter
    .single();
}
```

**Fixed Implementation**:
```typescript
// ✅ AFTER
getById: async (id: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)  // ← Added
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}
```

**Functions to Update**:
- [ ] `contacts.getById()` - Add workspaceId param, add filter (Line 140)
- [ ] `contacts.update()` - Add workspaceId param, add filter (Line 100)
- [ ] `contacts.updateScore()` - Add workspaceId param, add filter (Line 158)
- [ ] `contacts.updateIntelligence()` - Add workspaceId param, add filter (Line 169)
- [ ] `contacts.getWithEmails()` - Update to pass workspaceId (Line 184)
- [ ] `emails.getById()` - Add workspaceId param, add filter (Line 242)
- [ ] `emails.getByContact()` - Add workspaceId param, validate contact ownership (Line 223)
- [ ] `emails.listByContact()` - Add workspaceId param, validate contact ownership (Line 232)

**Breaking Changes**: All callers must be updated to pass workspaceId.

**Impact**: ~50+ files will need updates where these functions are called.

**Testing**:
```bash
# After fixing, run:
npm run test -- src/lib/db.test.ts
```

---

### 2. Fix src/lib/google/gmail-intelligence.ts - Email Processing

**File**: `D:\Unite-Hub\src\lib\google\gmail-intelligence.ts`
**Lines to Fix**: 313-365

**Current Vulnerable Code**:
```typescript
// ❌ BEFORE (Line 317)
const { data: contact } = await supabase
  .from('contacts')
  .select('ai_score, tags')
  .eq('id', contactId)  // ← No workspace_id filter
  .single();

// ❌ BEFORE (Line 354)
await supabase
  .from('contacts')
  .update({ ai_score: newScore, tags: newTags })
  .eq('id', contactId);  // ← Can update ANY contact
```

**Fixed Implementation**:
```typescript
// ✅ AFTER
async function updateContactScore(
  contactId: string,
  intelligence: EmailIntelligence,
  workspaceId: string  // ← Added parameter
) {
  const supabase = getSupabaseAdmin();

  // Fetch current contact with workspace validation
  const { data: contact } = await supabase
    .from('contacts')
    .select('ai_score, tags, workspace_id')
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)  // ← Added filter
    .single();

  if (!contact) {
    console.warn(`Contact ${contactId} not found in workspace ${workspaceId}`);
    return;
  }

  // ... calculate score adjustment ...

  // Update with workspace validation
  await supabase
    .from('contacts')
    .update({
      ai_score: newScore,
      tags: newTags,
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', contactId)
    .eq('workspace_id', workspaceId);  // ← Added filter
}
```

**Changes Required**:
- [ ] Add `workspaceId` parameter to `updateContactScore()` (Line 313)
- [ ] Add workspace_id filter to contact SELECT (Line 317)
- [ ] Add workspace_id filter to contact UPDATE (Line 354)
- [ ] Update all callers to pass workspaceId

**Callers to Update**:
- `processEmailIntelligence()` - Extract workspaceId from email record

**Testing**:
```bash
# After fixing, test email processing:
npm run test -- src/lib/google/gmail-intelligence.test.ts
```

---

### 3. Replace Client-Side Direct Queries with API Calls

#### 3a. EditContactModal

**File**: `D:\Unite-Hub\src\components\modals\EditContactModal.tsx`
**Lines to Fix**: 99-107, 120-128

**Current Vulnerable Code**:
```typescript
// ❌ BEFORE (Line 99)
const { data: currentContact, error: fetchError } = await supabase
  .from("contacts")
  .select("*")
  .eq("id", contactId)  // ← Trusts prop from parent
  .single();

// ❌ BEFORE (Line 120)
const { error: updateError } = await supabase
  .from("contacts")
  .update(updateData)
  .eq("id", contactId)  // ← Can update ANY contact
  .single();
```

**Fixed Implementation**:
```typescript
// ✅ AFTER - Use API endpoint instead
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchContact() {
    try {
      const response = await fetch(`/api/v1/contacts/${contactId}`, {
        headers: {
          'x-workspace-id': workspaceId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contact');
      }

      const { data } = await response.json();
      setFormData({
        name: data.name || '',
        email: data.email || '',
        // ... other fields
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (isOpen && contactId) {
    fetchContact();
  }
}, [isOpen, contactId, workspaceId]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch(`/api/v1/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to update contact');
    }

    onContactUpdated();
    onClose();
  } catch (error) {
    console.error('Error updating contact:', error);
    setError('Failed to update contact');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Changes Required**:
- [ ] Replace direct Supabase query with fetch to `/api/v1/contacts/:id` (GET)
- [ ] Replace direct Supabase update with fetch to `/api/v1/contacts/:id` (PATCH)
- [ ] Pass workspaceId in headers
- [ ] Add error handling for API responses

---

#### 3b. DeleteContactModal

**File**: `D:\Unite-Hub\src\components\modals\DeleteContactModal.tsx`
**Lines to Fix**: 44-50

**Current Vulnerable Code**:
```typescript
// ❌ BEFORE (Line 44)
const { error } = await supabase
  .from("contacts")
  .delete()
  .eq("id", contactId);
```

**Fixed Implementation**:
```typescript
// ✅ AFTER - Use API endpoint instead
const handleDelete = async () => {
  setIsDeleting(true);

  try {
    const response = await fetch(`/api/v1/contacts/${contactId}`, {
      method: 'DELETE',
      headers: {
        'x-workspace-id': workspaceId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete contact');
    }

    onContactDeleted();
    onClose();
  } catch (error) {
    console.error('Error deleting contact:', error);
    setError('Failed to delete contact');
  } finally {
    setIsDeleting(false);
  }
};
```

**Changes Required**:
- [ ] Replace direct Supabase delete with fetch to `/api/v1/contacts/:id` (DELETE)
- [ ] Pass workspaceId in headers
- [ ] Add error handling

---

## Priority 2: MEDIUM RISK (4-6 hours)

### 4. Add Workspace Context to Agent Services

#### 4a. Client Agent Executor Service

**File**: `D:\Unite-Hub\src\lib\clientAgent\clientAgentExecutorService.ts`
**Lines to Fix**: 72, 89, 120, 133, 164, 195, 300

**Pattern to Apply**:
```typescript
// ❌ BEFORE
const { data: contact } = await supabase
  .from('contacts')
  .select('*')
  .eq('id', contactId)
  .single();

// ✅ AFTER
const { data: contact } = await supabase
  .from('contacts')
  .select('*')
  .eq('id', contactId)
  .eq('workspace_id', executionContext.workspaceId)  // ← Added
  .single();
```

**Changes Required**:
- [ ] Add workspaceId to `ClientAgentExecutionContext` type
- [ ] Pass workspaceId through all agent execution calls
- [ ] Add workspace_id filter to all contact/email queries

---

#### 4b. Founder Memory Services

**Files to Fix**:
- `D:\Unite-Hub\src\lib\founderMemory\weeklyDigestService.ts` (Lines 224, 261, 386, 390, 400, 405, 412)
- `D:\Unite-Hub\src\lib\founderMemory\riskAnalysisService.ts` (Lines 184, 225, 268, 355)
- `D:\Unite-Hub\src\lib\founderMemory\momentumScoringService.ts` (Lines 225, 241, 287, 364, 412, 422, 463, 482, 570)
- `D:\Unite-Hub\src\lib\founderMemory\patternExtractionService.ts` (Lines 138, 180, 202)
- `D:\Unite-Hub\src\lib\founderMemory\overloadDetectionService.ts` (Lines 190, 220, 247, 277)
- `D:\Unite-Hub\src\lib\founderMemory\founderMemoryAggregationService.ts` (Lines 234, 314, 362)

**Pattern to Apply**:
```typescript
// All Founder Memory services should receive workspaceId in their parameters
// and pass it through to all database queries

// Example:
export async function generateWeeklyDigest(
  founderId: string,
  workspaceId: string  // ← Add this parameter
): Promise<WeeklyDigest> {
  // Add workspace filter to all queries
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)  // ← Add this filter
    .order('created_at', { ascending: false });

  // ... rest of function
}
```

**Changes Required**:
- [ ] Add workspaceId parameter to all service functions
- [ ] Add workspace_id filter to all queries
- [ ] Update callers to pass workspaceId

---

#### 4c. Email Ingestion Services

**Files to Fix**:
- `D:\Unite-Hub\src\lib\emailIngestion\clientEmailMapper.ts` (Lines 230, 364)
- `D:\Unite-Hub\src\lib\emailIngestion\preClientMapperService.ts` (Lines 507, 529)

**Pattern**: Same as 4b above.

---

### 5. Enforce Required workspaceId in Drip Campaign Service

**File**: `D:\Unite-Hub\src\lib\services\drip-campaign.ts`
**Lines to Fix**: 32-65, 67-83, 85-160

**Current Issue**:
```typescript
// ⚠️ BEFORE - workspaceId is OPTIONAL
export async function addCampaignStep(
  campaignId: string,
  stepData: Partial<CampaignStep>,
  workspaceId?: string  // ← OPTIONAL - can be bypassed!
): Promise<CampaignStep> {
  if (workspaceId) {  // ← Can be skipped
    const campaign = await supabase
      .from("drip_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("workspace_id", workspaceId)
      .single();

    if (campaign.error) {
      throw new Error("Campaign not found or access denied");
    }
  }

  // Always proceeds to insert regardless of validation
  const step = await supabaseServer
    .from("campaign_steps")
    .insert([{ campaign_id: campaignId, ...stepData }])
    .select()
    .single();
}
```

**Fixed Implementation**:
```typescript
// ✅ AFTER - workspaceId is REQUIRED
export async function addCampaignStep(
  campaignId: string,
  stepData: Partial<CampaignStep>,
  workspaceId: string  // ← REQUIRED
): Promise<CampaignStep> {
  // Always validate campaign ownership
  const campaign = await supabase
    .from("drip_campaigns")
    .select("id, workspace_id")
    .eq("id", campaignId)
    .eq("workspace_id", workspaceId)
    .single();

  if (campaign.error || !campaign.data) {
    throw new Error("Campaign not found or access denied");
  }

  // Proceed with insert
  const supabaseServer = await getSupabaseServer();
  const step = await supabaseServer
    .from("campaign_steps")
    .insert([{
      campaign_id: campaignId,
      workspace_id: workspaceId,  // ← Explicitly set
      ...stepData,
    }])
    .select()
    .single();

  if (step.error) throw step.error;
  return step.data;
}
```

**Functions to Update**:
- [ ] `addCampaignStep()` - Make workspaceId required (Line 32)
- [ ] `getCampaignWithSteps()` - Add workspaceId param and filter (Line 67)
- [ ] `enrollContactInCampaign()` - Make workspaceId required (Line 85)
- [ ] `getWorkspaceIntegration()` - Validate workspace ownership (Line 444)

---

## Priority 3: Database-Level Protection (1-2 hours)

### 6. Apply Database Migration

**File**: `D:\Unite-Hub\supabase\migrations\080_workspace_isolation_constraints.sql`

**Pre-Migration Checklist**:
- [ ] Check for NULL workspace_id values in all tables:
  ```sql
  SELECT 'contacts' AS table, COUNT(*) FROM contacts WHERE workspace_id IS NULL
  UNION ALL
  SELECT 'emails', COUNT(*) FROM emails WHERE workspace_id IS NULL
  UNION ALL
  SELECT 'campaigns', COUNT(*) FROM campaigns WHERE workspace_id IS NULL;
  ```

- [ ] Backfill any NULL values with appropriate workspace IDs
- [ ] Test migration in development environment first
- [ ] Schedule during low-traffic window

**Steps to Apply**:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `080_workspace_isolation_constraints.sql`
3. Run in development first
4. Verify with post-migration queries (in the migration file)
5. Run in production during maintenance window

**What This Migration Does**:
- ✅ Adds NOT NULL constraints on workspace_id
- ✅ Adds foreign key constraints to workspaces table
- ✅ Creates composite indexes for performance
- ✅ Creates workspace context functions
- ✅ Adds audit triggers (optional)
- ✅ Creates helper views for monitoring

---

### 7. Enable Row-Level Security (RLS)

**Status**: Optional but recommended

**Implementation** (after testing application-level fixes):

```sql
-- Enable RLS on tenant tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generatedContent" ENABLE ROW LEVEL SECURITY;

-- Create policies (example for contacts)
CREATE POLICY contacts_workspace_isolation ON contacts
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

CREATE POLICY contacts_insert_same_workspace ON contacts
  FOR INSERT
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Repeat for all tables...
```

**Note**: Requires setting workspace context in each request:
```typescript
// In middleware or API handlers
await supabase.rpc('set_workspace_context', { workspace_uuid: workspaceId });
```

---

## Testing Checklist

### Unit Tests

- [ ] `tests/lib/db.test.ts` - Test all db.ts functions with workspace filtering
- [ ] `tests/lib/gmail-intelligence.test.ts` - Test email processing with workspace context
- [ ] `tests/components/modals/EditContactModal.test.tsx` - Test API calls instead of direct queries

### Integration Tests

- [ ] `tests/integration/workspace-isolation.test.ts` - Cross-workspace access prevention
- [ ] `tests/integration/drip-campaigns.test.ts` - Campaign workspace validation

### Manual Testing

- [ ] Create 2 test workspaces (A and B)
- [ ] Create contacts in each workspace
- [ ] Try to access workspace A contact from workspace B session
- [ ] Verify API returns 404/403
- [ ] Try to update workspace A contact from workspace B
- [ ] Verify update fails with proper error
- [ ] Test campaign enrollment across workspaces
- [ ] Verify proper error handling

---

## Rollout Plan

### Phase 1: Application-Level Fixes (Week 1)
- Day 1-2: Fix src/lib/db.ts (Priority 1.1)
- Day 2-3: Fix gmail-intelligence.ts and client modals (Priority 1.2, 1.3)
- Day 3-4: Fix agent services (Priority 2)
- Day 4-5: Testing and bug fixes

### Phase 2: Database-Level Protection (Week 2)
- Day 1: Test migration in development
- Day 2: Apply migration to staging
- Day 3: Monitor staging, fix any issues
- Day 4: Apply to production during maintenance window
- Day 5: Post-deployment monitoring

### Phase 3: RLS Implementation (Week 3) - Optional
- Day 1-2: Implement RLS policies
- Day 3-4: Test with real-world scenarios
- Day 5: Enable in production

---

## Success Criteria

- [ ] All 52 vulnerable queries now have workspace_id filters
- [ ] All unit tests pass
- [ ] Integration tests confirm cross-workspace access is prevented
- [ ] Manual testing confirms proper error handling
- [ ] Database constraints prevent NULL workspace_id values
- [ ] Performance benchmarks show no regression
- [ ] Zero security audit findings

---

## Risk Mitigation

### If Issues Found During Rollout

1. **Database migration fails**
   - Rollback using commands in migration file
   - Investigate NULL values
   - Backfill and retry

2. **Application breaks after db.ts fixes**
   - Identify callers without workspaceId
   - Add temporary backwards-compatible overloads
   - Phase out old signatures

3. **Performance degradation**
   - Verify indexes are created
   - Analyze query plans
   - Adjust index strategy if needed

4. **Production incident**
   - Have rollback plan ready
   - Monitor error rates
   - Coordinate with team before deployment

---

## Resources

- **Audit Report**: `docs/WORKSPACE_ISOLATION_AUDIT.md`
- **Migration File**: `supabase/migrations/080_workspace_isolation_constraints.sql`
- **Architecture Docs**: `CLAUDE.md` - Workspace Isolation section
- **RLS Workflow**: `.claude/RLS_WORKFLOW.md`

---

## Contact

For questions or issues during implementation:
1. Check audit report for detailed analysis
2. Review CLAUDE.md for workspace isolation patterns
3. Test changes in development first
4. Document any deviations from this plan

---

**Last Updated**: 2025-12-02
**Status**: ⚠️ READY FOR IMPLEMENTATION - P0 CRITICAL
