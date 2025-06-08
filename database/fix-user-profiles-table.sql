-- ================================================
-- FIX EXISTING USER_PROFILES TABLE
-- ================================================

-- 1. Check if user_profiles table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. If the table exists but doesn't have 'role' column, add it:
DO $$
BEGIN
    -- Check if 'role' column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'role'
    ) THEN
        -- Add the role column
        ALTER TABLE user_profiles 
        ADD COLUMN role VARCHAR(50) DEFAULT 'User' 
        CHECK (role IN ('Master', 'Admin', 'Manager', 'User'));
        
        RAISE NOTICE 'Added role column to user_profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
    
    -- Check if other missing columns need to be added
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Added phone column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN department VARCHAR(100);
        RAISE NOTICE 'Added department column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'job_title'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN job_title VARCHAR(100);
        RAISE NOTICE 'Added job_title column';
    END IF;
END $$;

-- 3. Show the updated table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 4. Now you can update your role
-- First check your users
SELECT 
    au.id,
    au.email,
    up.role,
    up.is_active
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id;

-- 5. If you don't have a profile yet, create one:
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);

-- 6. Finally, update your role to Master
-- Replace 'your-email@example.com' with your actual email
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
