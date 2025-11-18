# Migration 039 Checklist

**Migration**: Autonomous Client Intelligence System
**File**: `supabase/migrations/039_autonomous_intelligence_system.sql`
**Date**: 2025-11-18
**Status**: ✅ Ready to run

---

## Pre-Flight Checks ✅

- ✅ Production user initialized (phill.mcgurk@gmail.com)
- ✅ Workspace exists (5a92c7af-5aca-49a7-8866-3bfaa1d04532)
- ✅ Referenced tables exist (client_emails, contacts, workspaces)
- ✅ Migration follows existing patterns from 001_initial_schema.sql
- ✅ Migration is idempotent (safe to re-run)

---

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/[your-project-id]

### 2. Navigate to SQL Editor

Click: **SQL Editor** in left sidebar

### 3. Create New Query

Click: **New query** button

### 4. Copy Migration SQL

Open file: `d:\Unite-Hub\supabase\migrations\039_autonomous_intelligence_system.sql`

**Copy lines 1-207** (entire file)

### 5. Paste into SQL Editor

Paste the SQL into the editor

### 6. Review Before Running

Quick visual check:
- [ ] Lines 8-27: `email_intelligence` table
- [ ] Lines 34-48: `dynamic_questionnaires` table
- [ ] Lines 54-62: `questionnaire_responses` table
- [ ] Lines 67-85: `autonomous_tasks` table
- [ ] Lines 92-109: `marketing_strategies` table
- [ ] Lines 115-129: `knowledge_graph_nodes` table
- [ ] Lines 135-144: `knowledge_graph_edges` table
- [ ] Lines 149-168: 5 update triggers
- [ ] Lines 171-206: 7 RLS policies

### 7. Run Migration

Click: **Run** button (or press Ctrl+Enter)

### 8. Verify Success

**Expected output:**
```
Success. No rows returned
```

**If you see errors**, check [Troubleshooting](#troubleshooting) below.

### 9. Verify Tables Created

Run this verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
)
ORDER BY table_name;
```

**Expected result: 7 rows**

```
email_intelligence
dynamic_questionnaires
questionnaire_responses
autonomous_tasks
marketing_strategies
knowledge_graph_nodes
knowledge_graph_edges
```

### 10. Test Email Intelligence

Run the test script:

```bash
node scripts/test-email-intelligence.mjs
```

**Expected output:**
```
🧪 Testing Email Intelligence Extraction

Workspace: 5a92c7af-5aca-49a7-8866-3bfaa1d04532

✅ Found 5 emails to analyze

📧 Email 1/5
   From: example@email.com
   Subject: Test subject
   🤖 Analyzing with Claude Sonnet 4.5...
   ✅ Extracted:
      Ideas: 2
      Goals: 1
      Pain Points: 3
   💾 Saved to database

📊 Summary Report
Emails analyzed: 5
Total ideas extracted: 10
Total goals extracted: 5
Total pain points extracted: 15

✅ Email Intelligence extraction test complete!
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause**: Migration was already run (partially or fully)

**Solution**: This is OK! Migration is idempotent. The error means:
- Tables already exist (safe)
- `CREATE TABLE IF NOT EXISTS` skips creation
- Other statements continue normally

**Action**: Continue to verification step

### Error: "trigger already exists"

**Cause**: Triggers from migration 001 already exist

**Expected**: Migration includes `DROP TRIGGER IF EXISTS` before each `CREATE TRIGGER`

**Action**: If this error appears, the migration didn't run the DROP statements. Run this manually:

```sql
DROP TRIGGER IF EXISTS update_email_intelligence_updated_at ON email_intelligence;
DROP TRIGGER IF EXISTS update_questionnaires_updated_at ON dynamic_questionnaires;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON autonomous_tasks;
DROP TRIGGER IF EXISTS update_strategies_updated_at ON marketing_strategies;
DROP TRIGGER IF EXISTS update_knowledge_nodes_updated_at ON knowledge_graph_nodes;
```

Then re-run the migration.

### Error: "function update_updated_at_column does not exist"

**Cause**: Migration 001 wasn't run (or function was deleted)

**Solution**: Create the function manually:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

Then re-run the migration.

### Error: "foreign key violation"

**Cause**: Referenced tables don't exist

**Check**: Run this query to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('client_emails', 'contacts', 'workspaces')
ORDER BY table_name;
```

**Expected**: 3 rows (client_emails, contacts, workspaces)

**If missing**: You need to run earlier migrations first:
1. Migration 001 (initial schema)
2. Migration 038 (core SaaS tables)

### Error: "permission denied"

**Cause**: Not using service role or admin access

**Check**: Are you logged into Supabase with the project owner account?

**Solution**:
1. Log out of Supabase
2. Log in with the account that created the project
3. Try again

### Test Script: "No emails found"

**Cause**: No emails synced to workspace yet

**Solution**:
1. Go to Dashboard → Integrations → Gmail
2. Click "Sync Emails"
3. Wait for sync to complete
4. Run test script again

### Test Script: "ANTHROPIC_API_KEY is not set"

**Cause**: Environment variable missing

**Check**: Open `.env.local` and verify:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Get key**: https://console.anthropic.com/settings/keys

### Test Script: Rate limit error

**Cause**: Analyzing too many emails too fast

**Solution**: Script has 1-second delay. If still hitting limits:

1. Open `scripts/test-email-intelligence.mjs`
2. Find line: `await new Promise(resolve => setTimeout(resolve, 1000));`
3. Change to: `await new Promise(resolve => setTimeout(resolve, 2000));` (2 seconds)

---

## What Happens After Migration

### Immediate Capabilities

✅ **Email Intelligence Extraction**
- Analyze emails for ideas, goals, pain points, requirements
- Extract sentiment, energy level, decision readiness
- Store in `email_intelligence` table

✅ **Database Ready for Phase 2-6**
- Knowledge graph tables ready
- Questionnaire tables ready
- Task queue ready for autonomous execution
- Strategy storage ready

### Next Steps

1. **Run Test Script** - Verify extraction works
2. **Batch Analyze** - Process all existing emails
3. **Setup Auto-Processing** - Analyze new emails automatically
4. **Build Dashboard** - Visualize extracted intelligence
5. **Implement Phase 2** - Knowledge Graph Builder

---

## Migration Details

### Tables Created (7)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `email_intelligence` | Stores extracted business intelligence | ideas, goals, pain_points, sentiment |
| `dynamic_questionnaires` | AI-generated questionnaires | questions, status, completion_percentage |
| `questionnaire_responses` | Client questionnaire answers | question_id, answer, answer_data |
| `autonomous_tasks` | Task queue for autonomous execution | task_type, assigned_agent, status |
| `marketing_strategies` | Generated marketing strategies | strategy_document, target_audience, kpis |
| `knowledge_graph_nodes` | Knowledge entities (ideas, goals, etc.) | node_type, label, confidence_score |
| `knowledge_graph_edges` | Relationships between entities | relationship_type, strength |

### Indexes Created (13)

- 3 on `email_intelligence` (email_id, contact_id, workspace_id)
- 2 on `dynamic_questionnaires` (contact_id, workspace_id)
- 1 on `questionnaire_responses` (questionnaire_id)
- 3 on `autonomous_tasks` (workspace_id, contact_id, status)
- 2 on `marketing_strategies` (contact_id, workspace_id)
- 2 on `knowledge_graph_nodes` (workspace_id, contact_id)
- 2 on `knowledge_graph_edges` (workspace_id, source_node_id)

### Triggers Created (5)

All use existing `update_updated_at_column()` function:
- `update_email_intelligence_updated_at`
- `update_questionnaires_updated_at`
- `update_tasks_updated_at`
- `update_strategies_updated_at`
- `update_knowledge_nodes_updated_at`

### RLS Policies (7)

All use simple `FOR ALL USING (true)` pattern matching existing migrations:
- `email_intelligence_workspace_isolation`
- `questionnaires_workspace_isolation`
- `tasks_workspace_isolation`
- `strategies_workspace_isolation`
- `knowledge_nodes_workspace_isolation`
- `knowledge_edges_workspace_isolation`
- `responses_workspace_isolation`

---

## Success Criteria

✅ **Migration succeeds** - No errors in SQL Editor
✅ **7 tables created** - Verification query returns 7 rows
✅ **Test script runs** - Analyzes 5 emails successfully
✅ **Data saved** - Intelligence records appear in database
✅ **No production errors** - 403 errors resolved from earlier fix

---

## Related Documentation

- [AUTONOMOUS_SYSTEM_SETUP.md](AUTONOMOUS_SYSTEM_SETUP.md) - Complete setup guide
- [AUTONOMOUS_INTELLIGENCE_SYSTEM.md](docs/AUTONOMOUS_INTELLIGENCE_SYSTEM.md) - Full architecture
- [PHASE1_IMPLEMENTATION_GUIDE.md](docs/PHASE1_IMPLEMENTATION_GUIDE.md) - Phase 1 details
- [email-intelligence-agent.ts](src/lib/agents/email-intelligence-agent.ts) - Agent implementation

---

**Ready to proceed?** Follow the steps above to run migration 039.

**Questions?** Check the [Troubleshooting](#troubleshooting) section.

**Last Updated**: 2025-11-18
