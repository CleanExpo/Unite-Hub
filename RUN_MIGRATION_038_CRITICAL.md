# 🚨 CRITICAL: Migration 038 - Core SaaS Tables

**Priority:** P0 - SYSTEM BREAKING
**Status:** ⚠️ **MUST RUN IMMEDIATELY**
**Impact:** 60+ files depend on these missing tables
**Estimated Time:** 2 minutes

---

## ⚠️ Why This Is Critical

Migration 038 creates **6 essential tables** that are referenced in **60+ files** across the codebase but don't currently exist in the database. Without these tables, major features are broken.

### Tables Created

1. **`projects`** - Project management (referenced by media_files, mindmap features)
2. **`subscriptions`** - Billing & Stripe integration (21 files depend on this)
3. **`email_integrations`** - Gmail/Outlook OAuth (14 files depend on this)
4. **`sent_emails`** - Email tracking system (11 files depend on this)
5. **`user_onboarding`** - Onboarding progress (11 files depend on this)
6. **`client_emails`** - Gmail sync storage (12 files depend on this)

**Total Dependencies:** 60+ files will start working after this migration

---

## 🔴 Current Broken Features (Fixed After Migration)

Without these tables, the following features are completely broken:

### Broken Due to Missing `subscriptions`:
- ❌ Pricing page signup
- ❌ Stripe integration
- ❌ Subscription management
- ❌ Billing portal
- ❌ Trial period tracking
- ❌ Plan upgrades/downgrades

### Broken Due to Missing `email_integrations`:
- ❌ Gmail OAuth connection
- ❌ Email sync functionality
- ❌ Outlook integration
- ❌ SMTP configuration
- ❌ Email provider status

### Broken Due to Missing `sent_emails`:
- ❌ Email tracking (opens, clicks)
- ❌ Campaign email history
- ❌ Drip campaign execution
- ❌ Email analytics
- ❌ Send email functionality

### Broken Due to Missing `client_emails`:
- ❌ Gmail inbox sync
- ❌ Email threading
- ❌ AI email processing
- ❌ Contact email history
- ❌ Email search

### Broken Due to Missing `user_onboarding`:
- ❌ Onboarding wizard
- ❌ Setup progress tracking
- ❌ First-time user experience
- ❌ Onboarding completion status

### Broken Due to Missing `projects`:
- ❌ Project management
- ❌ Media file organization
- ❌ Mindmap features
- ❌ Client project tracking

---

## 📋 How to Run Migration 038

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Unite-Hub project
3. Navigate to **SQL Editor**

### Step 2: Copy Migration SQL
1. Open `supabase/migrations/038_core_saas_tables.sql`
2. Copy the **entire file** (548 lines)

### Step 3: Execute Migration
1. In SQL Editor, click **New Query**
2. Paste the migration SQL
3. Click **Run** button
4. Wait for execution (~5-10 seconds)

### Step 4: Verify Success
Look for this message in the output:
```
✅ Migration 038 complete: All 6 core tables created successfully
```

---

## ✅ Expected Results

After successful migration, you should see:

### Tables Created
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations',
                     'sent_emails', 'user_onboarding', 'client_emails');
```

**Expected:** 6 rows (all tables exist)

### RLS Policies Created
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('projects', 'subscriptions', 'email_integrations',
                     'sent_emails', 'user_onboarding', 'client_emails')
GROUP BY tablename
ORDER BY tablename;
```

**Expected:**
```
 tablename           | policy_count
---------------------+--------------
 client_emails       |            3
 email_integrations  |            4
 projects            |            4
 sent_emails         |            3
 subscriptions       |            2
 user_onboarding     |            3
```

**Total:** 19 RLS policies created

### Indexes Created
Each table has multiple indexes for performance:
- `projects`: 4 indexes
- `subscriptions`: 4 indexes
- `email_integrations`: 5 indexes
- `sent_emails`: 8 indexes
- `user_onboarding`: 3 indexes
- `client_emails`: 8 indexes

**Total:** 32 indexes created

---

## 🔍 Table Schemas Overview

### 1. projects
```sql
- id (UUID, PK)
- workspace_id (FK → workspaces)
- org_id (FK → organizations)
- name, description
- status (active, paused, completed, archived)
- client_contact_id (FK → contacts)
- start_date, end_date, budget
- created_by (FK → auth.users)
- timestamps
```

**Purpose:** Organize client work and media files by project

### 2. subscriptions
```sql
- id (UUID, PK)
- org_id (FK → organizations)
- stripe_customer_id, stripe_subscription_id
- plan (starter, professional, enterprise, custom)
- status (trialing, active, past_due, canceled, unpaid)
- current_period_start, current_period_end
- trial_start, trial_end
- metadata (JSONB)
- timestamps
```

**Purpose:** Stripe billing integration, subscription management

### 3. email_integrations
```sql
- id (UUID, PK)
- workspace_id (FK → workspaces)
- provider (gmail, outlook, smtp)
- email_address
- access_token, refresh_token (OAuth)
- smtp_host, smtp_port, smtp_username (SMTP)
- status (active, expired, revoked, error)
- last_sync_at, sync_error
- timestamps
```

**Purpose:** Gmail/Outlook OAuth connections per workspace

### 4. sent_emails
```sql
- id (UUID, PK)
- workspace_id (FK → workspaces)
- from_email, to_email, cc_emails, bcc_emails
- subject, body_html, body_text
- contact_id, campaign_id, drip_campaign_id
- status (queued, sending, sent, failed, bounced)
- sent_at, failed_at, error_message
- provider_message_id, provider_thread_id
- opened_at, open_count, clicked_at, click_count
- timestamps
```

**Purpose:** Track all emails sent through Unite-Hub

### 5. user_onboarding
```sql
- id (UUID, PK)
- user_id (FK → auth.users)
- org_id (FK → organizations)
- completed_profile, completed_workspace_setup
- completed_gmail_integration, completed_first_contact
- completed_first_campaign
- onboarding_completed, onboarding_skipped
- timestamps for each step
```

**Purpose:** Track user onboarding progress

### 6. client_emails
```sql
- id (UUID, PK)
- workspace_id (FK → workspaces)
- integration_id (FK → email_integrations)
- provider_message_id (Gmail Message-ID)
- from_email, to_emails, cc_emails, bcc_emails
- subject, body_html, body_text, snippet
- contact_id (FK → contacts)
- direction (inbound, outbound)
- is_read, is_starred, labels
- ai_processed, ai_intent, ai_sentiment, ai_summary
- received_at
- timestamps
```

**Purpose:** Store Gmail/Outlook emails synced from inbox

---

## 🛡️ Security Features (RLS Policies)

All tables have Row Level Security (RLS) enabled with workspace isolation:

✅ **Users can only access data in their workspace**
✅ **No cross-workspace data leakage**
✅ **Direct subqueries to `user_organizations` (no helper functions)**
✅ **Follows RLS best practices from migrations 036-037**

---

## 🚀 Features Unlocked After Migration

### Immediate Benefits:
1. **Stripe Integration Works** - Subscriptions can be created/managed
2. **Gmail OAuth Works** - Email connections can be established
3. **Email Sending Works** - Campaigns can send emails with tracking
4. **Gmail Sync Works** - Inbox emails can be imported and analyzed
5. **Onboarding Works** - New users see onboarding wizard
6. **Projects Work** - Media files can be organized by project

### Dashboard Pages Fixed:
- ✅ `/dashboard/settings/billing` - Subscription management
- ✅ `/dashboard/settings/integrations` - Gmail/Outlook setup
- ✅ `/dashboard/campaigns/[id]/analytics` - Email tracking stats
- ✅ `/dashboard/inbox` - Gmail sync inbox
- ✅ `/dashboard/onboarding` - User onboarding wizard
- ✅ `/dashboard/projects` - Project management

---

## 📊 Impact Analysis

**Before Migration 038:**
- 60+ files reference tables that don't exist
- Major features completely broken
- Database queries fail with "table does not exist"

**After Migration 038:**
- All 6 core tables exist
- 19 RLS policies enforce security
- 32 indexes optimize performance
- 60+ files can now function properly

---

## ⚠️ Troubleshooting

### Error: "relation already exists"
**Cause:** Migration already run (or partial run)

**Solution:** This is OK—migration uses `CREATE TABLE IF NOT EXISTS`, so it's idempotent and safe to re-run.

### Error: "foreign key constraint violation"
**Cause:** Referenced tables (workspaces, organizations, contacts) don't exist

**Solution:** Run earlier migrations first (migrations 001-037)

### Error: "permission denied"
**Cause:** Not using service role connection

**Solution:** Ensure you're using the default service role connection in Supabase Dashboard

---

## 📝 Post-Migration Checklist

After running migration 038:

- [ ] Verify all 6 tables exist (`SELECT * FROM pg_tables WHERE tablename IN (...)`)
- [ ] Verify 19 RLS policies created (`SELECT COUNT(*) FROM pg_policies WHERE tablename IN (...)`)
- [ ] Test subscription creation (Stripe integration)
- [ ] Test Gmail OAuth connection
- [ ] Test email sending functionality
- [ ] Test onboarding wizard
- [ ] Verify workspace isolation (users can't see other workspace data)

---

## 🔗 Related Migrations

**Run in order:**
1. ✅ Migrations 001-036 (core schema)
2. ⏳ **Migration 037** - RLS policy cleanup (optional but recommended)
3. 🚨 **Migration 038** - Core SaaS tables (THIS MIGRATION - CRITICAL)

---

## 📚 Related Documentation

- [RUN_MIGRATION_037.md](RUN_MIGRATION_037.md) - RLS policy cleanup
- [PHASE1_IMPLEMENTATION_COMPLETE.md](PHASE1_IMPLEMENTATION_COMPLETE.md) - Security & legal pages
- [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md) - Marketing pages
- [.claude/RLS_WORKFLOW.md](.claude/RLS_WORKFLOW.md) - RLS best practices

---

## ✨ Summary

**Priority:** 🚨 P0 - CRITICAL
**Impact:** Fixes 60+ broken files
**Time:** 2 minutes
**Risk:** Low (idempotent, additive only)
**Rollback:** Not needed (safe to re-run)

**RUN THIS MIGRATION IMMEDIATELY** to restore core functionality!

---

**After running this migration, Unite-Hub will have a complete, functional database schema ready for production use.**
