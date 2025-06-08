-- FIX ROLE CAPITALIZATION

-- Update your role to proper case
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = 'fad6dffa-afb6-4fa5-8111-331e62d38b76';

-- Verify it's fixed
SELECT 
    id,
    email,
    role,
    is_active,
    CASE 
        WHEN role = 'Master' THEN '✅ PERFECT - Try logging in now!'
        ELSE '❌ Role is: ' || role
    END as status
FROM user_profiles 
WHERE id = 'fad6dffa-afb6-4fa5-8111-331e62d38b76';
