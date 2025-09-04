-- MyLife Cinema - 안전한 테이블 설정 (중복 체크 포함)
-- 이미 존재하는 테이블/정책은 건너뛰고 필요한 것만 생성

-- =====================================
-- 1. 먼저 현재 상태 확인
-- =====================================

-- 존재하는 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_stats', 'movies', 'user_subscriptions', 'movie_likes');

-- =====================================
-- 2. 누락된 컬럼 추가 (users 테이블)
-- =====================================

-- free_movies_used 컬럼이 없을 경우 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='free_movies_used') THEN
        ALTER TABLE users ADD COLUMN free_movies_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================
-- 3. user_stats 테이블에 누락된 컬럼 추가
-- =====================================

-- free_movies_used 컬럼 추가 (user_stats)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_stats' AND column_name='free_movies_used') THEN
        ALTER TABLE user_stats ADD COLUMN free_movies_used INTEGER DEFAULT 0;
    END IF;
    
    -- total_likes 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_stats' AND column_name='total_likes') THEN
        ALTER TABLE user_stats ADD COLUMN total_likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================
-- 4. RLS 정책 안전하게 생성 (중복 체크)
-- =====================================

-- Users 테이블 정책
DO $$ 
BEGIN
    -- Users can view their own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view their own data'
    ) THEN
        CREATE POLICY "Users can view their own data" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;
    
    -- Users can update their own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can update their own data'
    ) THEN
        CREATE POLICY "Users can update their own data" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    -- Users can insert their own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can insert their own data'
    ) THEN
        CREATE POLICY "Users can insert their own data" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Movies 테이블 정책 (이미 존재하는 것은 건너뜀)
DO $$ 
BEGIN
    -- Users can view their own movies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'movies' 
        AND policyname = 'Users can view their own movies'
    ) THEN
        CREATE POLICY "Users can view their own movies" ON movies
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- 나머지 정책들도 동일한 방식으로...
END $$;

-- =====================================
-- 5. 특정 사용자 구독 상태 즉시 수정
-- =====================================

-- 사용자 확인
SELECT id, email, subscription_tier, subscription_status 
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 구독 상태 업데이트 (Creator 플랜)
UPDATE users 
SET 
    subscription_tier = 'creator',
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '30 days',
    free_movies_used = 0,  -- 리셋
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447'
AND subscription_tier = 'free';  -- 무료일 경우에만 업데이트

-- user_stats 초기화 또는 생성
INSERT INTO user_stats (
    user_id,
    total_movies,
    movies_this_month,
    movies_created,
    free_movies_used,
    total_likes,
    storage_used,
    streak_days,
    created_at,
    updated_at
)
VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0, 0, 0, 0, 0, 0, 0, NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    free_movies_used = 0,  -- 무료 사용 횟수 리셋
    movies_this_month = 0,  -- 이번달 제작 횟수 리셋  
    updated_at = NOW();

-- =====================================
-- 6. 결과 확인
-- =====================================

-- 업데이트된 사용자 정보 확인
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    u.subscription_status,
    u.free_movies_used as user_free_movies,
    us.free_movies_used as stats_free_movies,
    us.movies_this_month,
    us.total_movies
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE u.id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- =====================================
-- 7. 디버깅: RLS 임시 비활성화 (필요시)
-- =====================================

-- 만약 여전히 400 에러가 발생한다면 RLS 임시 비활성화
-- 주의: 테스트 후 반드시 다시 활성화!

-- 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- 테스트 완료 후 다시 활성화
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE movies ENABLE ROW LEVEL SECURITY;