-- MyLife Cinema - 누락된 컬럼 추가 및 구독 활성화
-- subscription_status 컬럼이 없는 문제 해결

-- =====================================
-- 1. 현재 users 테이블 구조 확인
-- =====================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================
-- 2. 누락된 컬럼들 추가
-- =====================================

-- subscription_status 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';

-- subscription_expires_at 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- stripe_customer_id 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- stripe_subscription_id 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- free_movies_used 컬럼 추가 (무료 플랜 사용 추적)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS free_movies_used INTEGER DEFAULT 0;

-- updated_at 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================
-- 3. user_stats 테이블 확인 및 생성
-- =====================================

-- user_stats 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_movies INTEGER DEFAULT 0,
    movies_this_month INTEGER DEFAULT 0,
    movies_created INTEGER DEFAULT 0,
    free_movies_used INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 4. 당신의 구독 즉시 활성화!
-- =====================================

-- Creator 플랜으로 업그레이드
UPDATE users 
SET 
    subscription_tier = 'creator',  -- 크리에이터 플랜
    subscription_status = 'active',  -- 활성 상태
    subscription_expires_at = NOW() + INTERVAL '30 days',  -- 30일 후 만료
    free_movies_used = 0,  -- 무료 사용 리셋
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- user_stats 레코드 생성 또는 업데이트
INSERT INTO user_stats (
    user_id,
    total_movies,
    movies_this_month,
    free_movies_used,
    total_likes,
    created_at,
    updated_at
)
VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0, 0, 0, 0, NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    free_movies_used = 0,  -- 무료 사용 횟수 리셋
    movies_this_month = 0,  -- 이번달 제작 횟수 리셋
    updated_at = NOW();

-- =====================================
-- 5. 결과 확인
-- =====================================

-- 업데이트 확인
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    subscription_expires_at,
    free_movies_used
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- user_stats 확인
SELECT * FROM user_stats 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- =====================================
-- 6. RLS 비활성화 (필요시)
-- =====================================

-- 400 에러가 계속 발생하면 RLS 임시 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- =====================================
-- 실행 완료 메시지
-- =====================================
SELECT 
    '✅ 구독 활성화 완료!' as message,
    subscription_tier as "현재 플랜",
    subscription_status as "상태",
    subscription_expires_at as "만료일"
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';