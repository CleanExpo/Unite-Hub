-- Check if user profile exists for the logged-in user
SELECT * FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check if we can select from user_profiles at all
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check the schema of user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
