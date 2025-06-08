-- ========================================
-- DIAGNOSTIC AND FIX SCRIPT
-- ========================================

-- STEP 1: Get your auth user ID
SELECT 'Finding your auth user ID...' as step;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- Save the ID from above, you'll need it

-- STEP 2: Check if profile exists with that ID
SELECT 'Checking if profile exists...' as step;
SELECT * FROM user_profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au');

-- STEP 3: See ALL profiles (to check table structure)
SELECT 'Showing first 5 profiles to see structure...' as step;
SELECT * FROM user_profiles LIMIT 5;

-- STEP 4: Get exact table structure
SELECT 'Table structure:' as step;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- STEP 5: MANUAL FIX - Copy your ID from Step 1 and run this
-- Replace 'YOUR-ID-HERE' with the actual ID from step 1
/*
INSERT INTO user_profiles (id, role) 
VALUES ('YOUR-ID-HERE', 'Master');
*/

-- STEP 6: If Step 5 fails, try this minimal approach
-- Again, replace 'YOUR-ID-HERE' with actual ID
/*
INSERT INTO user_profiles (id) 
VALUES ('YOUR-ID-HERE');

UPDATE user_profiles 
SET role = 'Master' 
WHERE id = 'YOUR-ID-HERE';
*/

-- STEP 7: Alternative - Get ID and insert in one command
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'phill.m@carsi.com.au'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Try to insert with just ID and role
        BEGIN
            INSERT INTO user_profiles (id, role) 
            VALUES (v_user_id, 'Master');
            RAISE NOTICE '✅ SUCCESS: Profile created with Master role';
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Insert failed with error: %', SQLERRM;
                RAISE NOTICE 'Error detail: %', SQLSTATE;
        END;
    ELSE
        RAISE NOTICE '❌ No auth user found';
    END IF;
END $$;

-- STEP 8: Final check
SELECT 'FINAL STATUS:' as step;
SELECT 
    au.id,
    au.email,
    up.id as profile_id,
    up.role,
    CASE 
        WHEN up.id IS NOT NULL AND up.role = 'Master' THEN '✅ FIXED - TRY LOGGING IN NOW!'
        WHEN up.id IS NOT NULL THEN '⚠️ Profile exists but role is: ' || COALESCE(up.role, 'NULL')
        ELSE '❌ Still no profile'
    END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'phill.m@carsi.com.au';

-- ========================================
-- INSTRUCTIONS:
-- 1. Run this entire script
-- 2. Look at the error messages
-- 3. If automated insert fails, copy your ID from Step 1
-- 4. Uncomment and run Step 5 or 6 manually with your ID
-- ========================================
