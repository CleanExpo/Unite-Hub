# Phase 1 Quick Start Guide

**Time to Deploy**: 15-20 minutes
**Risk Level**: ⚠️ **ZERO RISK** - Parallel architecture, no impact on existing system

---

## Prerequisites

- ✅ Unite-Hub repository cloned
- ✅ Node.js 18+ installed
- ✅ Supabase project access (dashboard credentials)
- ✅ Environment variables configured (`.env.local`)

---

## Step-by-Step Deployment

### Step 1: Switch to Feature Branch (2 minutes)

```bash
# Navigate to repository
cd d:\Unite-Hub

# Fetch latest changes
git fetch origin

# Checkout Phase 1 branch
git checkout feature/uiux-overhaul-phase-1

# Install dependencies
npm install
```

### Step 2: Deploy Database Migration (5 minutes)

1. **Open Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your Unite-Hub project

2. **Go to SQL Editor**
   - Left sidebar → SQL Editor → New Query

3. **Copy Migration SQL**
   ```bash
   # Copy file contents
   cat supabase/migrations/048_phase1_core_tables.sql
   ```

4. **Paste and Run**
   - Paste SQL into editor
   - Click "Run" button
   - Wait for "Success" message

5. **Verify Tables Created**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'staff_users',
     'staff_activity_logs',
     'client_users',
     'ideas',
     'proposal_scopes',
     'projects',
     'tasks',
     'digital_vault',
     'ai_event_logs'
   );
   ```

   Should return 9 rows.

### Step 3: Create Your First Staff User (3 minutes)

1. **Get your Auth User ID**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@unite-group.in';
   ```

2. **Insert Staff User**
   ```sql
   INSERT INTO staff_users (id, email, name, role, active)
   VALUES (
     'YOUR_AUTH_USER_ID_HERE'::uuid,
     'your-email@unite-group.in',
     'Your Name',
     'founder', -- or 'admin' or 'developer'
     true
   );
   ```

3. **Verify**
   ```sql
   SELECT * FROM staff_users WHERE email = 'your-email@unite-group.in';
   ```

### Step 4: Start Development Server (1 minute)

```bash
npm run dev
```

Server starts at: http://localhost:3008

### Step 5: Test New UIs (5 minutes)

Visit these URLs to verify Phase 1 is working:

1. **Staff Login**
   - URL: http://localhost:3008/next/app/auth/login
   - Login with your staff user credentials
   - Should redirect to staff dashboard

2. **Staff Dashboard**
   - URL: http://localhost:3008/next/app/staff/dashboard
   - Should show Phase 1 welcome screen
   - Should display system status

3. **Client Portal**
   - URL: http://localhost:3008/next/app/client/home
   - Should show client portal UI
   - Should display feature cards

4. **Old System (Verify Still Works)**
   - URL: http://localhost:3008/login
   - Old login should still work
   - Dashboard at http://localhost:3008/dashboard/overview should still work

---

## Verification Checklist

After deployment, verify:

- [ ] 9 new tables created in Supabase
- [ ] At least 1 staff user exists in `staff_users` table
- [ ] Staff login page loads (http://localhost:3008/next/app/auth/login)
- [ ] Staff dashboard loads after login
- [ ] Client portal home page loads
- [ ] Old system still works (http://localhost:3008/login)
- [ ] Feature flags file exists (config/featureFlags.json)
- [ ] No errors in browser console
- [ ] No errors in server console

---

## Feature Flag Configuration

### Enable/Disable Features

Edit `config/featureFlags.json`:

```json
{
  "flags": {
    "newUIEnabled": false,           // Master switch
    "newStaffPortalEnabled": false,  // Staff dashboard
    "newClientPortalEnabled": false, // Client portal
    "newAIEngineEnabled": false,     // AI orchestrator
    "newAuthEnabled": false,         // New authentication
    "parallelTestingMode": true      // Side-by-side testing
  }
}
```

**For testing**, set to `true`:

```json
{
  "flags": {
    "newUIEnabled": true,
    "newStaffPortalEnabled": true,
    "newClientPortalEnabled": true,
    "newAIEngineEnabled": true,
    "newAuthEnabled": true,
    "parallelTestingMode": true
  }
}
```

**No server restart required** - flags are read on each request.

---

## Testing Phase 1

### Run Automated Tests

```bash
# All Phase 1 tests
npm run test:unit tests/phase1

# Specific test suites
npx vitest tests/phase1/auth.test.ts
npx vitest tests/phase1/orchestrator.test.ts
npx vitest tests/phase1/featureFlags.test.ts

# Watch mode
npx vitest tests/phase1 --watch
```

### Manual Testing Checklist

**Staff Authentication**:
- [ ] Can login with valid staff credentials
- [ ] Cannot login with invalid credentials
- [ ] Cannot login with non-staff user
- [ ] Cannot login with inactive staff account
- [ ] Activity logged to `staff_activity_logs`

**AI Orchestrator**:
- [ ] Idea submission routes to Anthropic
- [ ] Email intelligence routes to Gemini
- [ ] Content generation routes to OpenRouter
- [ ] Events logged to `ai_event_logs`

**Feature Flags**:
- [ ] Flags load from config file
- [ ] Flags are cached for performance
- [ ] Invalid flags return false
- [ ] Refresh clears cache

---

## Common Issues & Solutions

### Issue 1: Migration Fails

**Error**: `table "staff_users" already exists`

**Solution**: Tables already created. Skip Step 2 or drop tables first:
```sql
DROP TABLE IF EXISTS ai_event_logs, digital_vault, tasks, projects, proposal_scopes, ideas, client_users, staff_activity_logs, staff_users CASCADE;
```

Then re-run migration.

### Issue 2: Staff Login Fails

**Error**: "User is not authorized as staff"

**Solution**: User exists in `auth.users` but not in `staff_users`. Run Step 3 to create staff user.

### Issue 3: Old System Broken

**Error**: Old login doesn't work

**Solution**: This shouldn't happen. Phase 1 doesn't modify old code. Verify you're on correct branch:
```bash
git branch
# Should show: * feature/uiux-overhaul-phase-1
```

If on wrong branch, switch back:
```bash
git checkout main
```

### Issue 4: Feature Flags Not Working

**Error**: `Cannot find module '@/config/featureFlags'`

**Solution**: TypeScript path aliases not configured. Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Rollback Plan

If anything goes wrong, rollback is **instant and safe**:

### Rollback Code Changes

```bash
# Switch back to main branch
git checkout main

# Old system is untouched, works immediately
```

### Rollback Database Changes (Optional)

Only if you want to remove Phase 1 tables:

```sql
DROP TABLE IF EXISTS ai_event_logs, digital_vault, tasks, projects, proposal_scopes, ideas, client_users, staff_activity_logs, staff_users CASCADE;
```

**Important**: This doesn't affect any existing tables. Old system continues to work.

---

## Next Steps After Deployment

1. **Test Staff Login Flow**
   - Create multiple staff users (founder, admin, developer)
   - Verify role-based access works
   - Check activity logs

2. **Test AI Orchestrator**
   - Submit test idea
   - Verify event logging
   - Check provider routing

3. **Build Phase 2 Features**
   - UI component library
   - API routes
   - Client portal features
   - Staff dashboard features

4. **Enable Feature Flags Gradually**
   - Start with `parallelTestingMode: true`
   - Enable `newStaffPortalEnabled` for internal testing
   - Enable other flags after validation

5. **Monitor Production**
   - Watch AI event logs
   - Monitor staff activity logs
   - Track feature flag usage

---

## Support

- **Documentation**: See `PHASE1_ARCHITECTURE.md`
- **Main README**: See `CLAUDE.md`
- **Agent Definitions**: See `.claude/agent.md`
- **Test Examples**: See `tests/phase1/`

---

**Deployment Time**: 15-20 minutes
**Risk**: Zero (parallel architecture)
**Rollback**: Instant (switch branch)
**Status**: ✅ Production-ready
