-- MyLife Cinema 데이터베이스 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. movies 테이블
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- TEXT로 변경 (테스트용)
  title TEXT NOT NULL,
  diary_content TEXT NOT NULL,
  analysis_data JSONB,
  status TEXT DEFAULT 'processing',
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. scenes 테이블
CREATE TABLE IF NOT EXISTS scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) NOT NULL,
  scene_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  visual_prompt TEXT,
  image_url TEXT,
  video_url TEXT,
  duration INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_movie_id ON scenes(movie_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (모든 사용자가 읽기/쓰기 가능 - 테스트용)
CREATE POLICY "Allow all access to movies" ON movies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to scenes" ON scenes
  FOR ALL USING (true) WITH CHECK (true);