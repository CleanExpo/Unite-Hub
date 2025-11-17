# Apply Migration 028: Mindmap Feature

**Time Required**: 3 minutes
**Status**: Ready to apply
**Risk Level**: Low (additive only, no existing data affected)
**Mode**: ADDITIVE - Preserves all existing functionality

---

## What This Migration Does

### Creates 4 New Tables

1. **`project_mindmaps`** - One mindmap per project
   - Links to projects, workspaces, organizations
   - Version tracking
   - Creator/updater tracking

2. **`mindmap_nodes`** - Visual nodes in the mindmap
   - 8 node types (feature, requirement, task, milestone, etc.)
   - Position tracking (x, y coordinates)
   - Status tracking (pending, in_progress, completed, etc.)
   - Priority levels (0-10)
   - JSONB metadata for extensibility

3. **`mindmap_connections`** - Relationships between nodes
   - 6 connection types (depends_on, relates_to, leads_to, etc.)
   - Strength indicator (1-10)
   - Prevents duplicate connections

4. **`ai_suggestions`** - AI-generated recommendations
   - 7 suggestion types (add_feature, identify_dependency, etc.)
   - Confidence scores (0-1)
   - Status tracking (pending, accepted, dismissed, applied)

### Creates Security (RLS Policies)
- ✅ 20 RLS policies across 4 tables
- ✅ Workspace-scoped access (uses `get_user_workspaces()`)
- ✅ Service role access for AI operations
- ✅ Role-based permissions

### Creates Performance (Indexes)
- ✅ 14 strategic indexes
- ✅ GIN index for JSONB metadata
- ✅ Optimized for workspace filtering

### Creates Helper Function
- ✅ `get_mindmap_structure(mindmap_id)` - Export complete mindmap as JSONB

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor (1 minute)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **Unite-Hub** project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Apply Migration 028 (1 minute)

1. Open file: `d:\Unite-Hub\supabase\migrations\028_mindmap_feature.sql`
2. **Copy ALL contents** (443 lines)
3. **Paste** into Supabase SQL Editor
4. Click **Run** button (bottom right)
5. Wait for "Success" message

**Expected Output**:
```
Success. No rows returned
```

### Step 3: Verify Tables Created (1 minute)

The migration includes verification queries at the end. You should see:

**Tables Created**:
```
check_type: Tables Created
count: 4
tables: {ai_suggestions, mindmap_connections, mindmap_nodes, project_mindmaps}
```

**RLS Enabled**:
```
check_type: RLS Enabled
count: 4
tables: {ai_suggestions, mindmap_connections, mindmap_nodes, project_mindmaps}
```

**Indexes Created**:
```
check_type: Indexes Created
count: 14 (or more)
```

---

## Verification (Optional)

### Option 1: Run Verification Script
```bash
node scripts/check-mindmap-tables.mjs
```

**Expected Output**:
```
🔍 Checking mindmap tables...

✅ Table 'project_mindmaps' exists
✅ Table 'mindmap_nodes' exists
✅ Table 'mindmap_connections' exists
✅ Table 'ai_suggestions' exists

✅ RLS enabled on 'project_mindmaps'
✅ RLS enabled on 'mindmap_nodes'
✅ RLS enabled on 'mindmap_connections'
✅ RLS enabled on 'ai_suggestions'

✅ Helper function 'get_mindmap_structure' exists

🎉 All checks passed! Mindmap feature ready to use.
```

### Option 2: Manual Verification in Supabase

1. Go to **Table Editor**
2. Check for new tables:
   - `project_mindmaps` ✓
   - `mindmap_nodes` ✓
   - `mindmap_connections` ✓
   - `ai_suggestions` ✓

3. Go to **Database → Roles & Policies**
4. Verify RLS policies exist for all 4 tables

---

## What You Can Do After Migration

### API Endpoints Available

1. **Create mindmap for project**:
   ```bash
   POST /api/projects/[projectId]/mindmap
   ```

2. **Manage mindmap**:
   ```bash
   GET /api/mindmap/[mindmapId]
   PUT /api/mindmap/[mindmapId]
   DELETE /api/mindmap/[mindmapId]
   ```

3. **Manage nodes**:
   ```bash
   GET /api/mindmap/[mindmapId]/nodes
   POST /api/mindmap/[mindmapId]/nodes
   PUT /api/mindmap/nodes/[nodeId]
   DELETE /api/mindmap/nodes/[nodeId]
   ```

4. **Manage connections**:
   ```bash
   GET /api/mindmap/[mindmapId]/connections
   POST /api/mindmap/[mindmapId]/connections
   ```

5. **AI analysis**:
   ```bash
   POST /api/mindmap/[mindmapId]/ai-analyze
   ```

6. **Update suggestions**:
   ```bash
   PUT /api/mindmap/suggestions/[suggestionId]
   ```

### Node Types Available
- `project_root` - Root node of the mindmap
- `feature` - Feature requirement
- `requirement` - Functional requirement
- `task` - Actionable task
- `milestone` - Project milestone
- `idea` - Brainstorm idea
- `question` - Question to answer
- `note` - General note

### Connection Types Available
- `relates_to` - General relationship
- `depends_on` - Dependency relationship
- `leads_to` - Sequential relationship
- `part_of` - Hierarchical relationship
- `inspired_by` - Inspiration relationship
- `conflicts_with` - Conflict relationship

### AI Suggestion Types
- `add_feature` - Suggest adding a feature
- `clarify_requirement` - Suggest clarifying requirements
- `identify_dependency` - Identify dependencies
- `suggest_technology` - Recommend technology
- `warn_complexity` - Warn about complexity
- `estimate_cost` - Estimate implementation cost
- `propose_alternative` - Propose alternative approach

---

## Troubleshooting

### Error: "relation 'projects' does not exist"
**Problem**: The `projects` table doesn't exist yet
**Solution**: You need to create a projects table first, or we can modify the migration to remove the project dependency

### Error: "function update_updated_at_column() does not exist"
**Problem**: Missing trigger function
**Solution**: Run this first:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "permission denied"
**Problem**: Not using service role
**Solution**: Make sure you're running the migration with the Supabase service role (automatic in SQL Editor)

---

## Rollback (If Needed)

If you need to undo the migration:

1. Open `d:\Unite-Hub\supabase\migrations\028_mindmap_feature_rollback.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Run

This will cleanly remove all 4 tables, indexes, policies, and the helper function.

---

## Security Notes

✅ **Safe to apply** - This migration is additive only
✅ **No data loss** - Does not modify existing tables
✅ **RLS enforced** - All tables have proper workspace isolation
✅ **Workspace scoped** - Users can only access their own mindmaps
✅ **Role-based** - Permissions follow user roles
✅ **Service role ready** - AI operations have proper access

---

## Performance Notes

✅ **14 indexes** created for optimal query performance
✅ **GIN index** on JSONB metadata for fast queries
✅ **CASCADE deletes** ensure data consistency
✅ **Updated triggers** for automatic timestamp management

---

## Next Steps After Migration

1. ✅ **Migration complete** - Tables created
2. 🎨 **Build frontend** - Install react-flow-renderer
3. 🎨 **Create components** - MindmapCanvas, NodeTypes
4. 🧪 **Test APIs** - Use Postman or curl
5. 🤖 **Try AI analysis** - Generate project suggestions

---

**Ready to apply?**

Just follow Steps 1-3 above. Should take less than 3 minutes!

If you encounter any issues, check the Troubleshooting section or reach out for help.

---

**Migration File**: `supabase/migrations/028_mindmap_feature.sql`
**Rollback File**: `supabase/migrations/028_mindmap_feature_rollback.sql`
**Verification Script**: `scripts/check-mindmap-tables.mjs`
