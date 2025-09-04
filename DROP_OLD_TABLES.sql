-- WARNING: This will delete all data from the old Supabase project
-- Run this in the OLD Supabase project (haxxfzxgxdgfljgyhbzc) if needed

-- Drop all tables and related objects
DROP TABLE IF EXISTS public.movie_comments CASCADE;
DROP TABLE IF EXISTS public.movie_likes CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.movies CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop triggers (if they still exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;