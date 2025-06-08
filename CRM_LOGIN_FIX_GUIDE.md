# CRM Login Fix Guide for Phill

## Overview
This guide will fix your CRM login issue and give you full admin access to create team accounts.

## Step 1: Run the Database Fix Script

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy the entire contents of `FIX_CRM_LOGIN_AND_ADMIN.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the script

## Step 2: Verify Your Account

After running the script, you should see output showing:
- Your auth user account with email `phill.m@carsi.com.au`
- Your user profile with role `Master` and `is_active: true`

## Step 3: Test Your Login

1. Go to your app's CRM login page
2. Enter:
   - Email: `phill.m@carsi.com.au`
   - Password: Your password
3. You should now be able to login successfully

## Step 4: Creating New Team Members

As a Master user, you have two ways to create new team accounts:

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter the new user's email and password
4. After creation, go to SQL Editor and run:

```sql
UPDATE user_profiles 
SET 
    role = 'Admin',  -- or 'User', 'Manager', 'Master'
    full_name = 'Team Member Name',
    department = 'Department Name',
    job_title = 'Job Title',
    created_by = (SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au')
WHERE email = 'newteammember@company.com';
```

### Method 2: Using the Create Function

Run this SQL in the SQL Editor:

```sql
SELECT create_team_member(
    'newuser@company.com',     -- email
    'SecurePassword123!',      -- password
    'Admin',                   -- role
    'John Doe',                -- full name
    'Sales',                   -- department
    'Sales Manager',           -- job title
    (SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au')  -- your ID
);
```

This will give you instructions on completing the user creation.

## Available Roles

- **Master**: Full system access (you)
- **Admin**: Can manage CRM data and users
- **Manager**: Can manage CRM data
- **User**: Basic CRM access

## Troubleshooting

If you still can't login:

1. **Check your password**: Make sure you're using the correct password
2. **Check the email**: Ensure you're using exactly `phill.m@carsi.com.au`
3. **Check environment variables**: Verify your `.env` file has the correct Supabase URL and anon key
4. **Clear browser cache**: Try clearing cookies and cache for your app
5. **Check browser console**: Look for any error messages

## Need to Reset Your Password?

If you've forgotten your password:

1. Go to Supabase Dashboard > Authentication > Users
2. Find your account (`phill.m@carsi.com.au`)
3. Click the three dots menu
4. Select "Send password recovery"
5. Check your email for the reset link

## Quick SQL Commands

### Check your account status:
```sql
SELECT 
    au.email,
    up.role,
    up.is_active,
    up.full_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'phill.m@carsi.com.au';
```

### List all users:
```sql
SELECT 
    au.email,
    up.role,
    up.full_name,
    up.department,
    up.is_active
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
ORDER BY up.role, au.email;
```

### Deactivate a user:
```sql
UPDATE user_profiles 
SET is_active = false 
WHERE email = 'user@example.com';
```

### Reactivate a user:
```sql
UPDATE user_profiles 
SET is_active = true 
WHERE email = 'user@example.com';
```

## Next Steps

1. Run the fix script
2. Test your login
3. Create team accounts as needed
4. If issues persist, check the troubleshooting section

---

**Important**: After running the fix script, your account will have full Master privileges in the CRM system, including the ability to create and manage all team accounts.
