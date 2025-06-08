-- ========================================
-- READY TO RUN - YOUR PROFILE SETUP
-- ========================================

-- STEP 1: Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- STEP 2: Create YOUR profile with Master role
INSERT INTO public.user_profiles (id, email, role, is_active)
VALUES (
    'fad6dffa-afb6-4fa5-8111-331e62d38b76',  -- Your ID
    'phill.m@carsi.com.au',
    'Master',
    true
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'Master',
    email = 'phill.m@carsi.com.au',
    is_active = true;

-- STEP 3: Verify it worked
SELECT * FROM public.user_profiles WHERE id = 'fad6dffa-afb6-4fa5-8111-331e62d38b76';

-- You should see:
-- id: fad6dffa-afb6-4fa5-8111-331e62d38b76
-- email: phill.m@carsi.com.au
-- role: Master
-- is_active: true

-- ========================================
-- INSTRUCTIONS:
-- 1. Go to Supabase SQL Editor
-- 2. Copy ALL of this SQL
-- 3. Paste it in the editor
-- 4. Click "Run"
-- 5. Check the results - you should see your profile with role = 'Master'
-- 6. Restart your dev server and try logging in!
-- ========================================
