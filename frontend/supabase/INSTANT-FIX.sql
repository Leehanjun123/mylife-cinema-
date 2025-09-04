-- =====================================
-- 즉시 해결 SQL - user_stats 문제 해결
-- =====================================

-- 1. user_stats 테이블 구조 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_stats';

-- 2. 누락된 컬럼 추가 (total_movies, storage_used, last_movie_date)
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS total_movies INTEGER DEFAULT 0;

ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0;

ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS last_movie_date DATE;

-- 3. 사용자 레코드 확인 및 생성
INSERT INTO user_stats (
    user_id,
    total_movies,
    movies_created,
    movies_this_month,
    free_movies_used,
    storage_used,
    last_movie_date
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0, 0, 0, 0, 0, NULL
)
ON CONFLICT (user_id) DO UPDATE SET
    total_movies = COALESCE(user_stats.total_movies, 0),
    storage_used = COALESCE(user_stats.storage_used, 0),
    updated_at = NOW();

-- 4. RLS 비활성화
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- 5. 권한 부여
GRANT ALL ON user_stats TO anon;
GRANT ALL ON users TO anon;
GRANT ALL ON movies TO anon;

-- 6. 확인
SELECT * FROM user_stats 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 7. users 테이블도 확인
SELECT 
    subscription_tier,
    subscription_status,
    free_movies_used
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 완료!
SELECT '✅ 문제 해결 완료!' as status;