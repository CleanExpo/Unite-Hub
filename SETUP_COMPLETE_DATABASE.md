# Complete Database Setup for Unite-Hub

## 📋 All Tables Your App Needs

Based on your codebase analysis, here are ALL the tables Unite-Hub uses:

### ✅ Critical Tables (Need These First!)
1. **user_profiles** - User profile data ⚠️ **MISSING - CAUSES 404 ERROR**
2. **user_organizations** - Links users to orgs ⚠️ **MISSING - CAUSES 404 ERROR**
3. **organizations** - Organization data ✓ Already exists (but check structure)

### 📊 Core Business Tables
4. **contacts** - Contact/lead information
5. **workspaces** - Workspace management
6. **campaigns** - Marketing campaigns
7. **emails** - Email records
8. **generated_content** - AI-generated content

### 👥 Team & Project Tables
9. **team_members** - Team member info
10. **projects** - Project tracking
11. **project_assignees** - Project assignments
12. **project_milestones** - Project milestones
13. **project_messages** - Project communications
14. **approvals** - Approval workflows
15. **deliverables** - Project deliverables

### 📈 Tracking & Analytics
16. **audit_logs** - Activity tracking
17. **intake_submissions** - Form submissions
18. **organization_invites** - Pending invitations

---

## 🚀 Quick Setup Options

### Option 1: Run Individual Migrations (Recommended)

Run these 3 SQL files **in order** in Supabase SQL Editor:

#### Step 1: Core Schema
File: `supabase/migrations/001_initial_schema.sql`
- Creates: organizations, workspaces, contacts, emails, campaigns, etc.

#### Step 2: Team & Projects
File: `supabase/migrations/002_team_projects_approvals.sql`
- Creates: team_members, projects, approvals, deliverables

#### Step 3: User Auth (CRITICAL!)
File: `CREATE_MISSING_TABLES_FIXED.sql`
- Creates: user_profiles, user_organizations ⚠️ **Fixes your 404 errors!**

### Option 2: Run Complete Schema (All at Once)

I've created: `COMPLETE_DATABASE_SCHEMA.sql` (775 lines)

This single file contains ALL tables. Run it once in Supabase SQL Editor.

---

## ⚠️ Important: Check What You Already Have

Before running anything, check what tables exist:

### In Supabase Dashboard:
1. Go to **Table Editor**
2. Look at the left sidebar - see which tables exist
3. Take a screenshot and show me

### Quick SQL Check:
Run this in SQL Editor to see all your tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🎯 Minimum to Fix Your Current Errors

If you just want to **fix the 404 errors and get Google login working**, you only need:

**Run:** `CREATE_MISSING_TABLES_FIXED.sql`

This creates:
- ✅ user_profiles
- ✅ user_organizations
- ✅ Links your Google account
- ✅ Creates default organization

After this, your dashboard will load without errors!

---

## 📊 Full Database vs Minimal Setup

### Minimal (Fix Errors Only):
```
CREATE_MISSING_TABLES_FIXED.sql → 228 lines
```
**Creates:** 2 tables (user_profiles, user_organizations)
**Time:** ~2 seconds
**Result:** ✅ Dashboard loads, Google login works

### Full (All Features):
```
COMPLETE_DATABASE_SCHEMA.sql → 775 lines
```
**Creates:** 18+ tables (everything)
**Time:** ~10 seconds
**Result:** ✅ All features enabled (contacts, campaigns, projects, etc.)

---

## 🔍 What Tables Are Used Where

| Feature | Tables Needed |
|---------|--------------|
| **Login/Auth** | user_profiles, user_organizations, organizations |
| **Dashboard Overview** | contacts, campaigns |
| **Team Management** | team_members, organizations |
| **Projects** | projects, project_assignees, project_milestones |
| **Contacts** | contacts, workspaces |
| **Campaigns** | campaigns, emails, generated_content |
| **Approvals** | approvals, deliverables |

---

## ✅ My Recommendation

### Do This First:
1. Run `CREATE_MISSING_TABLES_FIXED.sql` ← **Fixes your current errors**
2. Test: Refresh dashboard, check if 404 errors are gone
3. Test: Sign out and sign in with Google

### Then, If Needed:
4. Run `001_initial_schema.sql` ← Core business tables
5. Run `002_team_projects_approvals.sql` ← Team features

This way you can verify each step works before moving forward!

---

## 🐛 Current Errors You're Seeing

```
404: /rest/v1/user_profiles
404: /rest/v1/user_organizations
```

These will be **FIXED** by running `CREATE_MISSING_TABLES_FIXED.sql`

---

## 📝 Next Steps

1. **Tell me:** What tables do you see in Supabase Table Editor?
2. **Run:** `CREATE_MISSING_TABLES_FIXED.sql` first (to fix Google login)
3. **Test:** Refresh dashboard, verify errors are gone
4. **Then decide:** Do you want to add more tables for other features?

Let me know what you'd like to do!
