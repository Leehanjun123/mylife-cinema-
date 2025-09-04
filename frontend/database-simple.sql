-- Simple Database Setup - No complex policies for now
-- This script focuses on just creating the necessary tables and columns

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to auth.users if possible
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'users_id_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not add foreign key to auth.users, continuing...';
END $$;

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY,
    movies_created INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    free_movies_used INTEGER DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add missing columns to existing movies table
DO $$ 
BEGIN 
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='user_id') THEN
        ALTER TABLE public.movies ADD COLUMN user_id UUID;
    END IF;
    
    -- Add other missing columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='emotion') THEN
        ALTER TABLE public.movies ADD COLUMN emotion VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='style') THEN
        ALTER TABLE public.movies ADD COLUMN style VARCHAR(50) DEFAULT 'realistic';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='music') THEN
        ALTER TABLE public.movies ADD COLUMN music VARCHAR(50) DEFAULT 'emotional';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='length') THEN
        ALTER TABLE public.movies ADD COLUMN length VARCHAR(20) DEFAULT 'short';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='is_public') THEN
        ALTER TABLE public.movies ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='likes') THEN
        ALTER TABLE public.movies ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='views') THEN
        ALTER TABLE public.movies ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='scenes') THEN
        ALTER TABLE public.movies ADD COLUMN scenes JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='video_url') THEN
        ALTER TABLE public.movies ADD COLUMN video_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name='movies' AND column_name='thumbnail_url') THEN
        ALTER TABLE public.movies ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Add foreign key constraint for movies.user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'movies_user_id_fkey') THEN
        ALTER TABLE public.movies ADD CONSTRAINT movies_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not add foreign key constraint for movies, continuing...';
END $$;

-- Create supporting tables
CREATE TABLE IF NOT EXISTS public.movie_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, user_id)
);

-- Simple function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET 
        email = NEW.email,
        username = COALESCE(NEW.raw_user_meta_data->>'username', public.users.username);
    
    -- Insert into user_stats
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user stats when movie is created
CREATE OR REPLACE FUNCTION public.update_user_stats_on_movie_create()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if user_id is not null
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
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
    
    -- Update free movies usage for free tier users
    UPDATE public.user_stats
    SET free_movies_used = free_movies_used + 1
    WHERE user_id = NEW.user_id 
      AND (SELECT subscription_tier FROM public.users WHERE id = NEW.user_id) = 'free';
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error updating user stats: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for movie creation
DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.movies;
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_movie_create();

-- Enable RLS but with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_likes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies without auth.uid() for now
-- We'll handle permissions in the application code
CREATE POLICY "allow_all_for_now" ON public.users FOR ALL USING (true);
CREATE POLICY "allow_all_for_now" ON public.user_stats FOR ALL USING (true);  
CREATE POLICY "allow_all_for_now" ON public.movies FOR ALL USING (true);
CREATE POLICY "allow_all_for_now" ON public.movie_likes FOR ALL USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Database setup completed successfully!' as result;