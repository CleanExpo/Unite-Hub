# Fix: Run Database Migrations in Supabase

## ✅ Good News!

**Google OAuth is WORKING!** You successfully signed in with Google. The errors you're seeing are because the database tables don't exist yet.

## The Problem:

Your app is looking for these tables:
- `user_profiles` - To store user profile info
- `user_organizations` - To link users to organizations

But they don't exist in your Supabase database yet!

---

## Solution: Run the Migrations

### Method 1: Using Supabase Dashboard (Easiest)

1. **Go to:** https://supabase.com/dashboard
2. **Select** your Unite-Hub project
3. **Click** "SQL Editor" in the left sidebar
4. **Click** "+ New Query"

5. **Copy and paste** the contents of `supabase/migrations/001_initial_schema.sql`
   - Click **RUN**
   - Wait for success message

6. **Create another new query**
7. **Copy and paste** the contents of `supabase/migrations/002_team_projects_approvals.sql`
   - Click **RUN**
   - Wait for success message

8. **Create another new query**
9. **Copy and paste** the contents of `supabase/migrations/003_user_organizations.sql`
   - Click **RUN**
   - Wait for success message

### Method 2: Using Supabase CLI (If you have it installed)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lksfwktwtmyznckodsau

# Run migrations
supabase db push
```

---

## After Running Migrations

1. **Sign out** from Unite-Hub (clear your session)
2. **Sign in again** with Google
3. The errors should be GONE! ✅

The trigger `handle_new_user()` will automatically create your user profile when you sign in again.

---

## What These Migrations Do:

### Migration 001 - Initial Schema
- Creates `organizations` table
- Creates `workspaces` table
- Creates `contacts` table
- Creates `emails`, `campaigns`, etc.

### Migration 002 - Team & Projects
- Creates `team_members` table
- Creates `projects` table
- Creates `approvals` table

### Migration 003 - User Auth (THE IMPORTANT ONE!)
- ✅ Creates `user_profiles` table
- ✅ Creates `user_organizations` table
- ✅ Creates `organization_invites` table
- ✅ Adds trigger to auto-create profile when user signs up
- ✅ Adds Row Level Security policies

---

## Quick Test After Migration:

1. Sign out from Unite-Hub
2. Visit: `http://localhost:3008/`
3. Click "Continue with Google"
4. Sign in with Google
5. You should land on the dashboard with NO ERRORS!

---

## Current Status:

✅ **Google OAuth configured correctly**
✅ **Google sign-in working**
✅ **User authenticated:** ID `0082768b-c40a-4c4e-8150-84a3dd406cbc`
❌ **Database tables missing** (need to run migrations)

Once you run the migrations, everything will work perfectly!
