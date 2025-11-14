# How to Create Missing Tables in Supabase

## Quick Steps:

### 1. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your **Unite-Hub project**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New query"** button

### 2. Copy and Paste the SQL
1. Open the file: `CREATE_MISSING_TABLES.sql`
2. **Select ALL** the SQL code (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. Go back to Supabase SQL Editor
5. **Paste** into the query editor (Ctrl+V)

### 3. Run the SQL
1. Click the **"RUN"** button (or press Ctrl+Enter)
2. Wait for it to complete (should take 2-3 seconds)
3. You should see a success message and results at the bottom

### 4. Verify Tables Created
At the bottom of the SQL Editor, you should see output like:
```
table_name           | row_count
---------------------|----------
user_profiles        | 1
user_organizations   | 1
organizations        | 1
```

This means:
✅ Tables created successfully
✅ Your Google user profile created
✅ Default organization created
✅ You're linked to your organization as owner

### 5. Refresh Your Dashboard
1. Go back to: `http://localhost:3008/dashboard/overview`
2. **Refresh the page** (F5)
3. The errors should be **GONE**! ✅

---

## What This SQL Does:

### Creates These Tables:
1. **user_profiles** - Stores your profile info (name, email, avatar)
2. **organizations** - Stores organization details
3. **user_organizations** - Links users to organizations with roles

### Creates These Triggers:
1. **Auto-create profile** - When new user signs up
2. **Auto-update timestamps** - Keeps updated_at current

### Fixes Your Current User:
1. Creates profile for your Google account (ID: 0082768b...)
2. Creates a default organization for you
3. Makes you the **owner** of that organization

---

## After Running:

You can verify in Supabase:
1. Go to **"Table Editor"** in Supabase
2. You should now see these tables:
   - `user_profiles`
   - `user_organizations`
   - `organizations`
3. Click on `user_profiles` - you should see YOUR Google account!

---

## Troubleshooting:

### Error: "relation does not exist"
- Make sure you're connected to the correct project
- Check that you copied ALL the SQL code

### Error: "permission denied"
- You need to be the project owner to run this
- Try logging into Supabase with the account that created the project

### Error: "column does not exist"
- Some columns might already exist from old migrations
- That's okay, the script uses `IF NOT EXISTS` to avoid duplicates

---

## Still Getting Errors in Unite-Hub?

After running the SQL, if you still see errors:

1. **Sign out** from Unite-Hub completely
2. **Close all browser tabs** for localhost:3008
3. **Open a new tab** and go to `http://localhost:3008/`
4. **Sign in again** with Google
5. Should work perfectly now! ✅

---

## What You'll See After:

✅ No more 404 errors in console
✅ Dashboard loads properly
✅ Your name shows in the sidebar
✅ Organization name displays correctly
✅ All features work!

The SQL script is ready - just copy, paste, and run it in Supabase! 🚀
