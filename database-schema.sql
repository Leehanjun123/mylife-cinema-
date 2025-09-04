-- MyLife Cinema Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'pro')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table
CREATE TABLE public.user_stats (
    user_id UUID REFERENCES public.users(id) PRIMARY KEY,
    movies_created INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    free_movies_used INTEGER DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE public.movies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- original diary content
    emotion VARCHAR(50) NOT NULL,
    genre VARCHAR(50),
    style VARCHAR(50) DEFAULT 'realistic',
    music VARCHAR(50) DEFAULT 'emotional',
    length VARCHAR(20) DEFAULT 'short', -- short or full
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    video_url TEXT,
    thumbnail_url TEXT,
    scenes JSONB, -- array of scene objects
    metadata JSONB, -- additional AI generation metadata
    is_public BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie likes table (for social features)
CREATE TABLE public.movie_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, user_id)
);

-- Movie comments table
CREATE TABLE public.movie_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie shares table (for tracking viral content)
CREATE TABLE public.movie_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- instagram, youtube, tiktok, etc.
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    price_monthly INTEGER NOT NULL, -- in cents
    movies_per_month INTEGER, -- null means unlimited
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie generation queue (for background processing)
CREATE TABLE public.movie_generation_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE public.user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_movies_user_id ON public.movies(user_id);
CREATE INDEX idx_movies_status ON public.movies(status);
CREATE INDEX idx_movies_created_at ON public.movies(created_at);
CREATE INDEX idx_movies_likes ON public.movies(likes);
CREATE INDEX idx_movies_public ON public.movies(is_public) WHERE is_public = true;
CREATE INDEX idx_movie_likes_movie_id ON public.movie_likes(movie_id);
CREATE INDEX idx_movie_likes_user_id ON public.movie_likes(user_id);
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_comments_updated_at BEFORE UPDATE ON public.movie_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update movie likes count
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

CREATE TRIGGER movie_likes_count_trigger
    AFTER INSERT OR DELETE ON public.movie_likes
    FOR EACH ROW EXECUTE FUNCTION update_movie_likes_count();

-- Function to update user stats when movie is created
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

CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_movie_create();

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can read/update their own stats
CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own movies
CREATE POLICY "Users can manage own movies" ON public.movies
    FOR ALL USING (auth.uid() = user_id);

-- Anyone can read public movies
CREATE POLICY "Anyone can view public movies" ON public.movies
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Users can like any public movie
CREATE POLICY "Users can like public movies" ON public.movie_likes
    FOR ALL USING (auth.uid() = user_id);

-- Users can comment on public movies
CREATE POLICY "Users can comment on public movies" ON public.movie_comments
    FOR ALL USING (auth.uid() = user_id);

-- Users can share movies
CREATE POLICY "Users can share movies" ON public.movie_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, movies_per_month, features) VALUES
('free', 0, 3, '{"quality": "720p", "watermark": true, "styles": ["realistic", "animation"], "priority": "normal"}'),
('creator', 990, 10, '{"quality": "1080p", "watermark": false, "styles": ["all"], "voice_cloning": true, "priority": "high"}'),
('pro', 1990, null, '{"quality": "4k", "watermark": false, "styles": ["all"], "voice_cloning": true, "custom_branding": true, "api_access": true, "priority": "highest"}');

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id);
    
    INSERT INTO public.user_activity (user_id, activity_type, metadata)
    VALUES (NEW.id, 'user_signup', '{"source": "direct"}'::jsonb);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user can create movie (for freemium limits)
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
    
    -- Pro and creator tiers have unlimited movies
    IF user_tier IN ('creator', 'pro') THEN
        RETURN TRUE;
    END IF;
    
    -- Free tier limited to 3 movies
    RETURN movies_used < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment free movie usage
CREATE OR REPLACE FUNCTION public.increment_free_movie_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only count for free tier users
    IF (SELECT subscription_tier FROM public.users WHERE id = NEW.user_id) = 'free' THEN
        UPDATE public.user_stats
        SET free_movies_used = free_movies_used + 1
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_free_usage_trigger
    AFTER INSERT ON public.movies
    FOR EACH ROW EXECUTE FUNCTION increment_free_movie_usage();

-- Comments
COMMENT ON TABLE public.users IS 'Extended user profiles';
COMMENT ON TABLE public.user_stats IS 'User statistics and usage tracking';
COMMENT ON TABLE public.movies IS 'User-generated movies';
COMMENT ON TABLE public.movie_likes IS 'Movie likes for social features';
COMMENT ON TABLE public.movie_comments IS 'Comments on public movies';
COMMENT ON TABLE public.movie_shares IS 'Social media sharing tracking';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription history';
COMMENT ON TABLE public.movie_generation_queue IS 'Background processing queue';
COMMENT ON TABLE public.user_activity IS 'User activity tracking for analytics';