-- MyLife Cinema Database Fix Script
-- Execute this in Supabase SQL Editor

-- 1. Add missing columns to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processing',
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
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

-- 3. Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
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

-- 4. Create movie_likes table
CREATE TABLE IF NOT EXISTS movie_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, user_id)
);

-- 5. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
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

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_movies_is_public ON movies(is_public);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON movie_likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON movie_likes(user_id);

-- 7. Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for movies
CREATE POLICY "Users can view public movies" ON movies
FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own movies" ON movies
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies" ON movies
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies" ON movies
FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS policies for users
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- 10. Create RLS policies for user_stats
CREATE POLICY "Users can view own stats" ON user_stats
FOR ALL USING (auth.uid() = user_id);

-- 11. Create RLS policies for movie_likes
CREATE POLICY "Anyone can view likes" ON movie_likes
FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON movie_likes
FOR ALL USING (auth.uid() = user_id);

-- 12. Create RLS policies for user_subscriptions  
CREATE POLICY "Users can view own subscription" ON user_subscriptions
FOR SELECT USING (auth.uid() = user_id);