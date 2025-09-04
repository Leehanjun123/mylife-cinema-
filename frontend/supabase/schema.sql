-- MyLife Cinema Database Schema
-- 이 파일을 Supabase SQL 편집기에서 실행해주세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
-- This will be enabled on individual tables

-- ================================
-- USERS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'pro')),
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new user registration
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================
-- USER STATS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_movies INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    movies_created INTEGER DEFAULT 0, -- Total movies created by user
    storage_used BIGINT DEFAULT 0, -- In bytes
    streak_days INTEGER DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can only access their own stats
CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- USER SUBSCRIPTIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
    plan_name VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_subscriptions table
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own subscription data
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- MOVIES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- The diary content
    emotion VARCHAR(50), -- joy, sadness, love, anger, anxiety, peace, thoughtful, tired
    genre VARCHAR(100), -- Movie genre
    style VARCHAR(100), -- Visual style
    music VARCHAR(100), -- Music style
    length INTEGER DEFAULT 60, -- Video length in seconds
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    video_url TEXT, -- URL to generated video
    thumbnail_url TEXT, -- URL to video thumbnail
    scenes JSONB, -- Generated scenes data
    is_public BOOLEAN DEFAULT false, -- Whether the movie is public in community
    likes INTEGER DEFAULT 0, -- Number of likes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on movies table
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Users can access their own movies
CREATE POLICY "Users can view their own movies" ON movies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies" ON movies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies" ON movies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies" ON movies
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view public movies
CREATE POLICY "Anyone can view public movies" ON movies
    FOR SELECT USING (is_public = true);

-- ================================
-- MOVIE LIKES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS movie_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, user_id) -- Prevent duplicate likes
);

-- Enable RLS on movie_likes table
ALTER TABLE movie_likes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own likes
CREATE POLICY "Users can view all likes" ON movie_likes
    FOR SELECT USING (true); -- Anyone can see likes for public movies

CREATE POLICY "Users can insert their own likes" ON movie_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON movie_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_is_public ON movies(is_public);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_likes ON movies(likes DESC);

CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON movie_likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON movie_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- ================================
-- FUNCTIONS FOR AUTOMATIC STATS UPDATE
-- ================================

-- Function to update user stats when a movie is created
CREATE OR REPLACE FUNCTION update_user_stats_on_movie_create()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user stats
    INSERT INTO user_stats (
        user_id, 
        total_movies, 
        movies_this_month, 
        movies_created,
        last_movie_date,
        updated_at
    )
    VALUES (
        NEW.user_id,
        1,
        1,
        1,
        CURRENT_DATE,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_movies = user_stats.total_movies + 1,
        movies_this_month = CASE 
            WHEN DATE_TRUNC('month', user_stats.updated_at) = DATE_TRUNC('month', NOW()) 
            THEN user_stats.movies_this_month + 1 
            ELSE 1 
        END,
        movies_created = user_stats.movies_created + 1,
        last_movie_date = CURRENT_DATE,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update movie likes count
CREATE OR REPLACE FUNCTION update_movie_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE movies SET likes = likes + 1 WHERE id = NEW.movie_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE movies SET likes = likes - 1 WHERE id = OLD.movie_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS
-- ================================

-- Trigger to update user stats when movie is created
CREATE TRIGGER trigger_update_user_stats_on_movie_create
    AFTER INSERT ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_movie_create();

-- Trigger to update movie likes count
CREATE TRIGGER trigger_update_movie_likes_count
    AFTER INSERT OR DELETE ON movie_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_movie_likes_count();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- INITIAL DATA (OPTIONAL)
-- ================================

-- You can add any initial data here if needed
-- For example, creating admin users, default settings, etc.

-- ================================
-- PERMISSIONS
-- ================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON movies TO anon; -- Only for public movies (handled by RLS)
GRANT SELECT ON movie_likes TO anon; -- Only for public movies (handled by RLS)

-- ================================
-- COMPLETION MESSAGE
-- ================================
-- Schema creation completed successfully!
-- Make sure to also run the fix-subscription.sql file if you have existing users.