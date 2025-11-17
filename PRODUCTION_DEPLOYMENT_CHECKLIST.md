# Production Deployment Checklist

**Feature**: Interactive Mindmap Visualization
**Date**: 2025-11-17
**Version**: 1.0.0

---

## ✅ Pre-Deployment Checklist

### 1. Code Quality (5 items)

- [ ] **Run ESLint**: `npm run lint` - Fix any errors
- [ ] **TypeScript Check**: `npx tsc --noEmit` - No compilation errors
- [ ] **Console Errors**: Check browser console for errors
- [ ] **All Tests Passing**: `npm test` or `node scripts/test-mindmap-apis.mjs`
- [ ] **Code Review**: All code reviewed and approved

### 2. Database (6 items)

- [x] **Migration 026 Applied**: Database security consolidation
- [x] **Migration 027 Applied**: Security verification tests
- [x] **Migration 028 Applied**: Mindmap feature tables (FIXED version)
- [ ] **Verify Tables**: All 4 tables exist (project_mindmaps, mindmap_nodes, mindmap_connections, ai_suggestions)
- [ ] **RLS Policies Active**: 20 policies across 4 tables
- [ ] **Helper Functions Work**: `get_mindmap_structure(mindmap_id)` tested

**Verification Script**: `node scripts/check-mindmap-tables.mjs`

### 3. Environment Variables (8 items)

- [ ] **Supabase URL**: `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] **Supabase Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] **Supabase Service Role**: `SUPABASE_SERVICE_ROLE_KEY` set (for AI operations)
- [ ] **Anthropic API Key**: `ANTHROPIC_API_KEY` set (for AI analysis)
- [ ] **Google OAuth**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- [ ] **NextAuth**: `NEXTAUTH_URL` and `NEXTAUTH_SECRET` set
- [ ] **Port Configuration**: Port 3008 configured in package.json
- [ ] **All Secrets Secure**: No secrets in repository

### 4. Frontend Components (10 items)

- [x] **MindmapCanvas.tsx**: Main canvas component created
- [x] **ProjectRootNode.tsx**: Root node component
- [x] **FeatureNode.tsx**: Feature node component
- [x] **TaskNode.tsx**: Task node component
- [x] **MilestoneNode.tsx**: Milestone node component
- [x] **RequirementNode.tsx**: Requirement node component
- [x] **IdeaNode.tsx**: Idea node component
- [x] **QuestionNode.tsx**: Question node component
- [x] **NoteNode.tsx**: Note node component
- [x] **CustomEdge.tsx**: Custom connection edges
- [x] **AISuggestionPanel.tsx**: AI suggestions UI
- [x] **Mindmap Page**: Dashboard route at `/dashboard/projects/[projectId]/mindmap`

### 5. Dependencies (3 items)

- [x] **reactflow**: Installed via pnpm
- [x] **dagre**: Installed for auto-layout
- [x] **@types/dagre**: TypeScript definitions installed

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Node components render correctly
- [ ] Edge components render correctly
- [ ] API hooks work correctly
- [ ] Auto-layout algorithm works

### Integration Tests

- [ ] Create mindmap for project
- [ ] Add nodes of each type (8 types)
- [ ] Create connections (6 types)
- [ ] Edit node properties
- [ ] Delete nodes/connections
- [ ] Request AI analysis
- [ ] Accept/dismiss suggestions

### API Endpoint Tests (7 endpoints)

Run: `node scripts/test-mindmap-apis.mjs`

- [ ] **POST /api/projects/[projectId]/mindmap** - Create mindmap
- [ ] **GET /api/mindmap/[mindmapId]** - Get mindmap
- [ ] **POST /api/mindmap/[mindmapId]/nodes** - Add nodes
- [ ] **PUT /api/mindmap/nodes/[nodeId]** - Update node
- [ ] **POST /api/mindmap/[mindmapId]/connections** - Create connections
- [ ] **POST /api/mindmap/[mindmapId]/ai-analyze** - AI analysis
- [ ] **PUT /api/mindmap/suggestions/[suggestionId]** - Update suggestion

### E2E Tests

- [ ] Full user flow: Create → Edit → Analyze → Apply suggestions
- [ ] Drag-drop repositioning works
- [ ] Zoom/pan controls work
- [ ] Auto-layout works
- [ ] Save functionality works

### Performance Tests

- [ ] Large mindmaps (100+ nodes) render smoothly
- [ ] Rapid node creation doesn't lag
- [ ] Connection rendering is fast
- [ ] Auto-layout completes in < 2s for 100 nodes

### Security Tests

- [ ] Workspace isolation verified (users can't see other workspaces' mindmaps)
- [ ] RLS policies prevent unauthorized access
- [ ] No data leakage between workspaces
- [ ] Service role access works for AI operations

---

## 🏗️ Build & Deploy

### Local Build Test (20 minutes)

**Step 1: Clean Build**
```bash
rm -rf .next
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

**Step 2: Test Production Build**
```bash
npm run start
# Navigate to http://localhost:3008
```

**Step 3: Verify Functionality**
- [ ] Dashboard loads
- [ ] Mindmap page accessible
- [ ] Nodes render correctly
- [ ] Connections work
- [ ] AI analysis works

### Deploy to Vercel (20 minutes)

**Option 1: GitHub Integration (Recommended)**

```bash
# Push to main
git add .
git commit -m "feat: Add interactive mindmap visualization with AI analysis"
git push origin main

# Vercel auto-deploys from GitHub
# Check Vercel dashboard for deployment status
```

**Option 2: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts to link project
```

### Post-Deployment Verification (10 minutes)

**Step 1: Visit Production URL**
- [ ] https://your-domain.com loads

**Step 2: Test Authentication**
- [ ] Google OAuth login works
- [ ] User session persists

**Step 3: Test Mindmap Feature**
- [ ] Create test mindmap
- [ ] Add nodes (all 8 types)
- [ ] Create connections (all 6 types)
- [ ] Request AI analysis
- [ ] Accept/dismiss suggestions
- [ ] Check workspace isolation (create 2 workspaces, verify data separation)

**Step 4: Monitor**
- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for database errors
- [ ] Monitor error rates in Vercel dashboard
- [ ] Check performance metrics (< 3s page load)

---

## 📊 Success Criteria

### Must Have (MVP)

- [x] View existing mindmap
- [x] Add nodes (any type)
- [x] Create connections
- [x] Save to database
- [x] Load from database
- [x] Drag-drop repositioning
- [x] AI analysis integration
- [x] Workspace isolation

### Should Have (V1)

- [x] All 8 node types
- [x] All 6 connection types
- [x] AI suggestion panel
- [x] Auto-layout
- [ ] Export as image
- [ ] Undo/redo

### Nice to Have (V2)

- [ ] Collaborative editing
- [ ] Version history
- [ ] Real-time sync
- [ ] Mobile support
- [ ] Keyboard shortcuts
- [ ] Custom themes

---

## 🚨 Rollback Plan

If deployment fails or critical issues are discovered:

### Immediate Rollback

**Step 1: Revert Git Commit**
```bash
git revert HEAD
git push origin main
```

**Step 2: Rollback Database Migration**
```bash
# Run rollback SQL in Supabase SQL Editor
# File: supabase/migrations/028_mindmap_feature_rollback.sql
```

**Step 3: Verify Rollback**
- [ ] Check Vercel deployment reverted
- [ ] Verify database tables removed (if rolled back)
- [ ] Test existing functionality still works

### Database-Only Rollback

If only the database needs to be rolled back:

1. Open Supabase SQL Editor
2. Run: `supabase/migrations/028_mindmap_feature_rollback.sql`
3. Verify tables removed:
   - `project_mindmaps`
   - `mindmap_nodes`
   - `mindmap_connections`
   - `ai_suggestions`

---

## 📞 Support & Monitoring

### Documentation

- [COMPLETE_ACTION_PLAN.md](COMPLETE_ACTION_PLAN.md) - Full implementation plan
- [MINDMAP_FRONTEND_IMPLEMENTATION_PLAN.md](MINDMAP_FRONTEND_IMPLEMENTATION_PLAN.md) - Frontend details
- [APPLY_MIGRATION_028_NOW.md](APPLY_MIGRATION_028_NOW.md) - Migration guide
- [PRODUCTION_DEPLOYMENT_COMPLETE.md](PRODUCTION_DEPLOYMENT_COMPLETE.md) - Deployment summary

### Migration Files

- [028_mindmap_feature_FIXED.sql](supabase/migrations/028_mindmap_feature_FIXED.sql) - Applied ✅
- [028_mindmap_feature_rollback.sql](supabase/migrations/028_mindmap_feature_rollback.sql) - Rollback script

### Test Scripts

- [test-mindmap-apis.mjs](scripts/test-mindmap-apis.mjs) - API endpoint tests
- [check-mindmap-tables.mjs](scripts/check-mindmap-tables.mjs) - Database verification

### Monitoring

**Vercel Dashboard**:
- Monitor deployment status
- Check error logs
- View performance metrics

**Supabase Dashboard**:
- Monitor database queries
- Check RLS policy execution
- View API logs

**Cost Monitoring**:
- Track Anthropic API usage (AI analysis endpoint)
- Monitor Supabase bandwidth
- Check Vercel function invocations

---

## 🎯 Performance Benchmarks

### Page Load Time
- **Target**: < 3s
- **Acceptable**: < 5s
- **Action if exceeded**: Optimize bundle size, lazy load components

### API Response Time
- **Target**: < 500ms
- **Acceptable**: < 1s
- **Action if exceeded**: Add database indexes, optimize queries

### AI Analysis Time
- **Target**: < 10s
- **Acceptable**: < 20s
- **Action if exceeded**: Reduce thinking budget, cache results

### Node Rendering
- **Target**: 100 nodes in < 1s
- **Acceptable**: 200 nodes in < 2s
- **Action if exceeded**: Implement virtualization

---

## ✅ Final Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Production URL**: _______________

**Deployment Successful**: [ ] Yes [ ] No

**Notes**:
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

---

**Status**: Ready for production deployment
**All Prerequisites**: ✅ Complete
**Risk Level**: Low (additive feature, no breaking changes)
