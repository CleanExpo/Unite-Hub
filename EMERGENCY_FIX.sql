-- EMERGENCY FIX - MINIMAL APPROACH

-- Just update your role to Master
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au'
);

-- Check if it worked
SELECT 
    au.email,
    up.role,
    CASE 
        WHEN up.role = 'Master' THEN '✅ YOU CAN NOW LOGIN!'
        ELSE '❌ FAILED - Role is: ' || COALESCE(up.role, 'NULL')
    END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'phill.m@carsi.com.au';
