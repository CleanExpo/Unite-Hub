-- ================================================
-- CREATE YOUR PROFILE IN THE CORRECT SUPABASE PROJECT
-- Project: hdfggelozqzdxvupbnbp
-- ================================================

-- First, check if you already have an auth user
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- If you don't have an auth user, you need to sign up first through the app

-- If you DO have an auth user, copy the ID and run this:
-- Replace 'YOUR-AUTH-USER-ID' with the actual ID from above

-- Step 1: Check if user_profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
);

-- Step 2: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 3: Create your profile with Master role
-- IMPORTANT: Replace 'YOUR-AUTH-USER-ID' with your actual auth user ID
INSERT INTO user_profiles (id, email, role, is_active)
VALUES (
    'YOUR-AUTH-USER-ID',  -- Replace this!
    'phill.m@carsi.com.au',
    'Master',
    true
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'Master',
    email = 'phill.m@carsi.com.au',
    is_active = true;

-- Step 4: Verify it worked
SELECT * FROM user_profiles WHERE email = 'phill.m@carsi.com.au';

-- You should see your profile with role = 'Master'
