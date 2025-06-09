# 📋 CRM Fix - Task Breakdown

## Overview
The main issue is that database tables don't exist, causing API errors. We'll fix this in small, manageable steps.

---

## 🔧 TASK 1: Fix API Error Handling (5 minutes)
**Goal:** Make APIs resilient to missing database tables

### Sub-tasks:
1. **Task 1.1:** Fix cookie consent API
   - File: `src/app/api/compliance/cookie-consent/route.ts`
   - Change: Remove auth requirement, handle missing tables
   
2. **Task 1.2:** Fix CRM projects API
   - File: `src/app/api/crm/projects/route.ts`
   - Change: Return empty array if tables don't exist
   
3. **Task 1.3:** Fix CRM dashboard API
   - File: `src/app/api/crm/dashboard/route.ts`
   - Change: Return default data if tables missing

---

## 📊 TASK 2: Prepare Database Scripts (3 minutes)
**Goal:** Verify SQL scripts are ready to run

### Sub-tasks:
1. **Task 2.1:** Check base CRM tables script
   - File: `database/setup-crm-complete.sql`
   - Action: Verify file exists and is complete
   
2. **Task 2.2:** Check views script
   - File: `database/setup-crm-views-and-fixes.sql`
   - Action: Verify file exists
   
3. **Task 2.3:** Check consultations script
   - File: `database/setup-consultations-table.sql`
   - Action: Verify file exists

---

## 🗄️ TASK 3: Create Database Tables (10 minutes)
**Goal:** Run SQL scripts in Supabase

### Sub-tasks:
1. **Task 3.1:** Run base CRM tables
   - Go to Supabase SQL Editor
   - Copy content from `database/setup-crm-complete.sql`
   - Run script
   
2. **Task 3.2:** Run views creation
   - Copy content from `database/setup-crm-views-and-fixes.sql`
   - Run script
   
3. **Task 3.3:** Run consultations table
   - Copy content from `database/setup-consultations-table.sql`
   - Run script
   
4. **Task 3.4:** Fix profile permissions
   - Run the profile RLS fix SQL (provided in action plan)

---

## 🚀 TASK 4: Deploy Changes (5 minutes)
**Goal:** Push fixes to production

### Sub-tasks:
1. **Task 4.1:** Stage changes
   ```bash
   git add .
   ```
   
2. **Task 4.2:** Commit with clear message
   ```bash
   git commit -m "🔧 Fix: CRM API error handling for missing tables"
   ```
   
3. **Task 4.3:** Push to main
   ```bash
   git push origin main
   ```

---

## ✅ TASK 5: Verify Fix (5 minutes)
**Goal:** Confirm everything works

### Sub-tasks:
1. **Task 5.1:** Wait for deployment
   - Wait 2-3 minutes for Vercel
   
2. **Task 5.2:** Clear browser cache
   - Ctrl+Shift+Delete
   
3. **Task 5.3:** Test pages
   - Visit dashboard
   - Check console for errors
   - Test CRM functionality

---

## 🎯 Quick Win Path (If you want immediate results):
1. **Just run the SQL scripts first** (Task 3 only)
   - This alone will stop most errors
   - No code deployment needed for immediate relief
   
2. **Then do code fixes later** (Tasks 1, 4, 5)
   - Makes the app more robust for the future

---

## Time Estimate
- **Fastest path (SQL only):** 10 minutes
- **Complete fix (all tasks):** 25-30 minutes

---

## Start Here:
**👉 Begin with Task 1.1 - Fix cookie consent API**

Would you like me to help you with Task 1.1 first?
