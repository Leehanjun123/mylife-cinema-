-- MyLife Cinema Database Fix Script (SAFE VERSION)
-- This version checks for existing objects before creating them

-- 1. Add missing columns to movies table (only if they don't exist)
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processing';

ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Check and create users table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50),
            email VARCHAR(255) UNIQUE,
            avatar_url VARCHAR(500),
            subscription_tier VARCHAR(20) DEFAULT 'free',
            stripe_customer_id VARCHAR(255),
            subscription_expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 3. Check and create user_stats table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stats') THEN
        CREATE TABLE user_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            movies_created INTEGER DEFAULT 0,
            movies_this_month INTEGER DEFAULT 0,
            streak_days INTEGER DEFAULT 0,
            total_likes INTEGER DEFAULT 0,
            free_movies_used INTEGER DEFAULT 0,
            last_movie_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
    END IF;
END $$;

-- 4. Check and create movie_likes table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'movie_likes') THEN
        CREATE TABLE movie_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(movie_id, user_id)
        );
    END IF;
END $$;

-- 5. Check and create user_subscriptions table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_subscriptions') THEN
        CREATE TABLE user_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            stripe_subscription_id VARCHAR(255),
            status VARCHAR(50),
            current_period_start TIMESTAMP WITH TIME ZONE,
            current_period_end TIMESTAMP WITH TIME ZONE,
            plan_name VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 6. Add indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_movies_is_public ON movies(is_public);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON movie_likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON movie_likes(user_id);

-- 7. Enable Row Level Security (safe to run multiple times)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies and recreate them for movies
DROP POLICY IF EXISTS "Users can view public movies" ON movies;
DROP POLICY IF EXISTS "Users can create own movies" ON movies;
DROP POLICY IF EXISTS "Users can update own movies" ON movies;
DROP POLICY IF EXISTS "Users can delete own movies" ON movies;

CREATE POLICY "Users can view public movies" ON movies
FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own movies" ON movies
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies" ON movies
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies" ON movies
FOR DELETE USING (auth.uid() = user_id);

-- 9. Drop and recreate policies for users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- 10. Drop and recreate policies for user_stats
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;

CREATE POLICY "Users can view own stats" ON user_stats
FOR ALL USING (auth.uid() = user_id);

-- 11. Drop and recreate policies for movie_likes
DROP POLICY IF EXISTS "Anyone can view likes" ON movie_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON movie_likes;

CREATE POLICY "Anyone can view likes" ON movie_likes
FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON movie_likes
FOR ALL USING (auth.uid() = user_id);

-- 12. Drop and recreate policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;

CREATE POLICY "Users can view own subscription" ON user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- 13. Verify the schema is correct
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'movies'
ORDER BY 
    ordinal_position;