-- MyLife Cinema Database Update Script
-- Run this instead of the full schema if tables already exist

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check and add missing columns to existing tables

-- Update users table if missing columns
DO $$ 
BEGIN 
    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='subscription_tier') THEN
        ALTER TABLE public.users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
        ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check 
            CHECK (subscription_tier IN ('free', 'creator', 'pro'));
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='subscription_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create user_stats table if not exists
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    movies_created INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    free_movies_used INTEGER DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update movies table with missing columns
DO $$ 
BEGIN 
    -- Add missing columns to movies table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='user_id') THEN
        ALTER TABLE public.movies ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='emotion') THEN
        ALTER TABLE public.movies ADD COLUMN emotion VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='style') THEN
        ALTER TABLE public.movies ADD COLUMN style VARCHAR(50) DEFAULT 'realistic';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='music') THEN
        ALTER TABLE public.movies ADD COLUMN music VARCHAR(50) DEFAULT 'emotional';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='length') THEN
        ALTER TABLE public.movies ADD COLUMN length VARCHAR(20) DEFAULT 'short';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='is_public') THEN
        ALTER TABLE public.movies ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='likes') THEN
        ALTER TABLE public.movies ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='views') THEN
        ALTER TABLE public.movies ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='scenes') THEN
        ALTER TABLE public.movies ADD COLUMN scenes JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='metadata') THEN
        ALTER TABLE public.movies ADD COLUMN metadata JSONB;
    END IF;
    
    -- Rename columns if they have different names
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='movies' AND column_name='videoUrl') THEN
        ALTER TABLE public.movies RENAME COLUMN "videoUrl" TO video_url;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='movies' AND column_name='thumbnailUrl') THEN
        ALTER TABLE public.movies RENAME COLUMN "thumbnailUrl" TO thumbnail_url;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='movies' AND column_name='createdAt') THEN
        ALTER TABLE public.movies RENAME COLUMN "createdAt" TO created_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='movies' AND column_name='updatedAt') THEN
        ALTER TABLE public.movies RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movies' AND column_name='updated_at') THEN
        ALTER TABLE public.movies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create other supporting tables
CREATE TABLE IF NOT EXISTS public.movie_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.movie_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movie_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    price_monthly INTEGER NOT NULL,
    movies_per_month INTEGER,
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (status IN ('active', 'canceled', 'past_due', 'paused'))
);

CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON public.movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON public.movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON public.movies(created_at);
CREATE INDEX IF NOT EXISTS idx_movies_likes ON public.movies(likes);
CREATE INDEX IF NOT EXISTS idx_movies_public ON public.movies(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON public.movie_likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON public.movie_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_movies_updated_at ON public.movies;
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create or replace movie likes count function
CREATE OR REPLACE FUNCTION update_movie_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.movies 
        SET likes = likes + 1 
        WHERE id = NEW.movie_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.movies 
        SET likes = likes - 1 
        WHERE id = OLD.movie_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS movie_likes_count_trigger ON public.movie_likes;
CREATE TRIGGER movie_likes_count_trigger
    AFTER INSERT OR DELETE ON public.movie_likes
    FOR EACH ROW EXECUTE FUNCTION update_movie_likes_count();

-- User stats update function
CREATE OR REPLACE FUNCTION update_user_stats_on_movie_create()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, movies_created, movies_this_month, last_movie_date)
    VALUES (NEW.user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        movies_created = user_stats.movies_created + 1,
        movies_this_month = CASE 
            WHEN DATE_TRUNC('month', user_stats.last_movie_date) = DATE_TRUNC('month', CURRENT_DATE)
            THEN user_stats.movies_this_month + 1
            ELSE 1
        END,
        last_movie_date = CURRENT_DATE,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.movies;
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_movie_create();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own movies" ON public.movies;
CREATE POLICY "Users can manage own movies" ON public.movies
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view public movies" ON public.movies;
CREATE POLICY "Anyone can view public movies" ON public.movies
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like public movies" ON public.movie_likes;
CREATE POLICY "Users can like public movies" ON public.movie_likes
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

-- Insert default subscription plans if they don't exist
INSERT INTO public.subscription_plans (name, price_monthly, movies_per_month, features) 
VALUES 
('free', 0, 3, '{"quality": "720p", "watermark": true, "styles": ["realistic", "animation"], "priority": "normal"}'),
('creator', 990, 10, '{"quality": "1080p", "watermark": false, "styles": ["all"], "voice_cloning": true, "priority": "high"}'),
('pro', 1990, null, '{"quality": "4k", "watermark": false, "styles": ["all"], "voice_cloning": true, "custom_branding": true, "api_access": true, "priority": "highest"}')
ON CONFLICT (name) DO NOTHING;

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET 
        email = NEW.email,
        username = COALESCE(NEW.raw_user_meta_data->>'username', public.users.username);
    
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_activity (user_id, activity_type, metadata)
    VALUES (NEW.id, 'user_signup', '{"source": "direct"}'::jsonb);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Utility functions
CREATE OR REPLACE FUNCTION public.can_create_movie(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR(20);
    movies_used INTEGER;
BEGIN
    SELECT u.subscription_tier, COALESCE(us.free_movies_used, 0)
    INTO user_tier, movies_used
    FROM public.users u
    LEFT JOIN public.user_stats us ON u.id = us.user_id
    WHERE u.id = user_id;
    
    IF user_tier IN ('creator', 'pro') THEN
        RETURN TRUE;
    END IF;
    
    RETURN movies_used < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_free_movie_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT subscription_tier FROM public.users WHERE id = NEW.user_id) = 'free' THEN
        UPDATE public.user_stats
        SET free_movies_used = free_movies_used + 1
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_free_usage_trigger ON public.movies;
CREATE TRIGGER increment_free_usage_trigger
    AFTER INSERT ON public.movies
    FOR EACH ROW EXECUTE FUNCTION increment_free_movie_usage();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'MyLife Cinema database update completed successfully!';
END $$;