-- =====================================
-- NUCLEAR OPTION - 완전 초기화
-- 모든 것을 삭제하고 다시 만듭니다
-- =====================================

-- 1. 기존 테이블 모두 삭제
DROP TABLE IF EXISTS movie_likes CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. users 테이블 생성
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    free_movies_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. movies 테이블 생성 (간단한 구조)
CREATE TABLE movies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT,
    content TEXT,
    emotion TEXT,
    style TEXT,
    music TEXT,
    genre TEXT,
    length INTEGER DEFAULT 60,
    status TEXT DEFAULT 'processing',
    video_url TEXT,
    thumbnail_url TEXT,
    scenes JSONB,
    is_public BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. user_stats 테이블 생성
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY,
    movies_created INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    free_movies_used INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS 완전 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;

-- 6. 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 7. 사용자 데이터 삽입
INSERT INTO users (
    id,
    email,
    username,
    subscription_tier,
    subscription_status,
    subscription_expires_at,
    free_movies_used
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    'hjun040608@gmail.com',
    'hjun',
    'creator',
    'active',
    NOW() + INTERVAL '1 year',
    0
) ON CONFLICT (id) DO UPDATE SET
    subscription_tier = 'creator',
    subscription_status = 'active',
    free_movies_used = 0;

-- 8. user_stats 데이터 삽입
INSERT INTO user_stats (
    user_id,
    free_movies_used,
    movies_this_month
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0,
    0
) ON CONFLICT (user_id) DO UPDATE SET
    free_movies_used = 0;

-- 9. API 테스트용 영화 삽입
INSERT INTO movies (
    user_id,
    title,
    content,
    emotion,
    style,
    music,
    status
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    'API 테스트',
    '테스트 내용',
    'joy',
    'realistic',
    'emotional',
    'completed'
);

-- 10. 최종 확인
SELECT 
    'CHECK 1: User' as check_type,
    subscription_tier,
    subscription_status,
    free_movies_used
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

SELECT 
    'CHECK 2: Movies' as check_type,
    COUNT(*) as total_movies
FROM movies 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

SELECT 
    'CHECK 3: Permissions' as check_type,
    has_table_privilege('anon', 'movies', 'INSERT') as can_insert,
    has_table_privilege('anon', 'movies', 'SELECT') as can_select;

-- =====================================
-- 실행 완료!
-- =====================================