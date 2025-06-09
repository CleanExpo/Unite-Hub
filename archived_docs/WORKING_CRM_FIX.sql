-- ========================================
-- BULLETPROOF CRM FIX - THIS WILL WORK
-- ========================================

-- STEP 1: Check your current situation
SELECT 'Checking what exists...' as status;

-- Check if your auth account exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- Check what columns exist in user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- STEP 2: Fix the user_profiles table structure
-- Add email column if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 3: Fix your profile specifically
DO $$
DECLARE
    v_user_id UUID;
    v_profile_exists BOOLEAN;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'phill.m@carsi.com.au'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: No auth user found for phill.m@carsi.com.au';
        RAISE NOTICE 'ACTION REQUIRED: Create account in Supabase Dashboard first!';
    ELSE
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = v_user_id) 
        INTO v_profile_exists;
        
        IF v_profile_exists THEN
            -- Update existing profile
            UPDATE user_profiles 
            SET 
                email = 'phill.m@carsi.com.au',
                role = 'Master',
                full_name = 'Phill McGurk',
                department = 'Executive',
                job_title = 'Co-Founder & CEO',
                is_active = true,
                updated_at = NOW()
            WHERE id = v_user_id;
            
            RAISE NOTICE '✅ SUCCESS: Updated existing profile to Master role';
        ELSE
            -- Create new profile
            INSERT INTO user_profiles (
                id, 
                email, 
                role, 
                full_name, 
                department, 
                job_title, 
                is_active
            ) VALUES (
                v_user_id,
                'phill.m@carsi.com.au',
                'Master',
                'Phill McGurk',
                'Executive',
                'Co-Founder & CEO',
                true
            );
            
            RAISE NOTICE '✅ SUCCESS: Created new profile with Master role';
        END IF;
    END IF;
END $$;

-- STEP 4: Verify the fix worked
SELECT 'VERIFICATION:' as status;

SELECT 
    up.id,
    up.email,
    up.role,
    up.is_active,
    up.full_name,
    CASE 
        WHEN up.role = 'Master' AND up.is_active = true THEN '✅ READY TO LOGIN'
        WHEN up.role != 'Master' THEN '❌ Wrong role: ' || up.role
        WHEN up.is_active = false THEN '❌ Account inactive'
        ELSE '❌ Unknown issue'
    END as status
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'phill.m@carsi.com.au';

-- If no results above, check if auth user exists
SELECT 
    '❌ NO PROFILE FOUND - Auth user status:' as status,
    CASE 
        WHEN COUNT(*) = 0 THEN 'No auth account - create in Supabase first'
        ELSE 'Auth account exists but profile creation failed'
    END as issue
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- ========================================
-- WHAT YOU SHOULD SEE:
-- 
-- ✅ "READY TO LOGIN" = You can now login to CRM
-- ❌ Any error = Check the specific message
-- 
-- IF NO AUTH ACCOUNT:
-- 1. Go to Supabase > Authentication > Users
-- 2. Add user with email: phill.m@carsi.com.au
-- 3. Run this script again
-- ========================================
