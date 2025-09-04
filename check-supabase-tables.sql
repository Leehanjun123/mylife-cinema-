-- Check if users table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Check users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Check if user_stats table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_stats';

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';