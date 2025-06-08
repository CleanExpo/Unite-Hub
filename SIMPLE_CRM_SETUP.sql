-- ========================================
-- SIMPLE CRM SETUP FOR YOUR SUPABASE PROJECT
-- ========================================

-- STEP 1: First check if you have an auth user
-- Run this and see if it returns any results:
SELECT id, email 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- IF NO RESULTS: You need to sign up first through your app
-- IF YOU GET A RESULT: Copy the ID (looks like: 123e4567-e89b-12d3-a456-426614174000)

-- ========================================

-- STEP 2: Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- ========================================

-- STEP 3: Insert your profile (REPLACE THE ID!)
-- Replace 'paste-your-id-here' with the ID from Step 1
INSERT INTO public.user_profiles (id, email, role, is_active)
VALUES (
    'paste-your-id-here',  -- PASTE YOUR ACTUAL ID HERE!
    'phill.m@carsi.com.au',
    'Master',
    true
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'Master',
    email = 'phill.m@carsi.com.au',
    is_active = true;

-- ========================================

-- STEP 4: Verify it worked
SELECT * FROM public.user_profiles WHERE email = 'phill.m@carsi.com.au';

-- You should see your profile with role = 'Master'

-- ========================================
-- INSTRUCTIONS:
-- 1. Go to Supabase SQL Editor
-- 2. Run each step one by one
-- 3. Don't forget to replace 'paste-your-id-here' with your actual ID!
-- ========================================
