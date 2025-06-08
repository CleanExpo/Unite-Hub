# How to Get Your User ID

## Step-by-Step Instructions:

### 1. Go to Supabase SQL Editor
- Go to https://supabase.com/dashboard
- Select your project: `hdfggelozqzdxvupbnbp`
- Click on "SQL Editor" in the left sidebar

### 2. Run This SQL Query
Copy and paste this exact query:

```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';
```

### 3. Click "Run" or press Ctrl+Enter

### 4. Look at the Results
You'll see something like:

| id | email |
|----|-------|
| 123e4567-e89b-12d3-a456-426614174000 | phill.m@carsi.com.au |

**The ID is the long string of numbers and letters** (like `123e4567-e89b-12d3-a456-426614174000`)

### 5. If You Get NO Results
This means you haven't signed up yet. You need to:
1. Go to your app (http://localhost:3000)
2. Click "Get Started" or go to `/register`
3. Sign up with email: `phill.m@carsi.com.au`
4. Then run the SQL query again

### 6. Copy Your ID
Once you have the ID, copy it and use it in Step 3 of the `SIMPLE_CRM_SETUP.sql` file.

## Example:
If your ID is `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, then in Step 3, change:

```sql
VALUES (
    'paste-your-id-here',  -- PASTE YOUR ACTUAL ID HERE!
```

To:

```sql
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Your actual ID
```

---

**Remember: The ID is unique to each user. You must get YOUR specific ID from the auth.users table!**
