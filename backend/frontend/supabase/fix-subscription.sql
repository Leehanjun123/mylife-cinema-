-- MyLife Cinema - Fix Subscription Issues
-- 결제 완료 후 무료 플랜으로 유지되는 문제 해결을 위한 SQL

-- ================================
-- 1. 특정 사용자 구독 상태 확인
-- ================================

-- 문제가 있는 사용자 조회 (userId: c84dae12-f851-4215-a3fc-420b2b93e447)
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    subscription_expires_at,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- ================================
-- 2. 사용자 구독 상태 수정 (수동 업데이트)
-- ================================

-- 결제가 완료되었지만 여전히 무료 플랜인 사용자를 위한 업데이트
-- 실제 상황에 맞게 subscription_tier와 subscription_expires_at을 수정해주세요

-- Creator 플랜으로 업데이트하는 경우:
UPDATE users 
SET 
    subscription_tier = 'creator',
    subscription_status = 'active',
    subscription_expires_at = '2024-10-04 23:59:59+00',  -- 1개월 후로 설정
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- Pro 플랜으로 업데이트하는 경우 (필요시 위 쿼리 대신 실행):
-- UPDATE users 
-- SET 
--     subscription_tier = 'pro',
--     subscription_status = 'active',
--     subscription_expires_at = '2024-10-04 23:59:59+00',  -- 1개월 후로 설정
--     updated_at = NOW()
-- WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- ================================
-- 3. 사용자 통계 초기화/수정
-- ================================

-- 사용자 통계 테이블에 데이터가 없는 경우 초기 데이터 삽입
INSERT INTO user_stats (
    user_id,
    total_movies,
    movies_this_month,
    movies_created,
    storage_used,
    streak_days,
    last_movie_date,
    created_at,
    updated_at
)
VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0,
    0,
    0,
    0,
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- ================================
-- 4. 모든 사용자 상태 확인 (디버깅용)
-- ================================

-- 모든 사용자의 구독 상태 확인
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    u.subscription_status,
    u.subscription_expires_at,
    us.total_movies,
    us.movies_this_month,
    COUNT(m.id) as actual_movie_count
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN movies m ON u.id = m.user_id
GROUP BY u.id, u.email, u.subscription_tier, u.subscription_status, u.subscription_expires_at, us.total_movies, us.movies_this_month
ORDER BY u.created_at DESC;

-- ================================
-- 5. Stripe 연동 상태 확인
-- ================================

-- Stripe Customer ID가 있는 사용자들 확인
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    stripe_customer_id,
    stripe_subscription_id,
    created_at
FROM users 
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC;

-- ================================
-- 6. 구독 내역 테이블 확인/수정
-- ================================

-- 구독 내역이 있는지 확인
SELECT * FROM user_subscriptions 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 구독 내역이 없고 Stripe 정보가 있는 경우 수동 삽입
-- (실제 Stripe 구독 ID와 기간을 확인 후 입력해주세요)
-- INSERT INTO user_subscriptions (
--     user_id,
--     stripe_subscription_id,
--     status,
--     plan_name,
--     current_period_start,
--     current_period_end
-- )
-- VALUES (
--     'c84dae12-f851-4215-a3fc-420b2b93e447',
--     'sub_xxxxxxxxxx', -- 실제 Stripe 구독 ID
--     'active',
--     'creator', -- 또는 'pro'
--     NOW(),
--     NOW() + INTERVAL '1 month'
-- );

-- ================================
-- 7. 문제 진단 쿼리들
-- ================================

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_stats', 'movies', 'user_subscriptions');

-- 테이블 존재 여부 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_stats', 'movies', 'user_subscriptions', 'movie_likes');

-- 테이블 권한 확인
SELECT table_name, privilege_type, grantee 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_stats', 'movies', 'user_subscriptions');

-- ================================
-- 8. 응급 처치 - RLS 임시 비활성화 (주의!)
-- ================================

-- RLS를 임시로 비활성화하여 문제를 해결할 수 있지만,
-- 보안상 권장되지 않습니다. 데이터 확인 후 다시 활성화하세요.

-- 임시 RLS 비활성화 (주의: 보안 위험!)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;

-- 문제 해결 후 RLS 다시 활성화
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ================================
-- 9. 완료 확인
-- ================================

-- 최종 사용자 상태 확인
SELECT 
    'User Status Check' as check_type,
    id,
    email,
    subscription_tier,
    subscription_status,
    subscription_expires_at,
    stripe_customer_id IS NOT NULL as has_stripe_customer,
    stripe_subscription_id IS NOT NULL as has_stripe_subscription
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 사용자 통계 확인
SELECT 
    'User Stats Check' as check_type,
    user_id,
    total_movies,
    movies_this_month,
    movies_created,
    last_movie_date
FROM user_stats 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- ================================
-- 실행 순서:
-- 1. schema.sql을 먼저 실행하여 테이블과 RLS 정책 생성
-- 2. 이 파일의 쿼리들을 순서대로 실행하여 문제 진단 및 해결
-- 3. 특정 사용자 ID는 실제 상황에 맞게 수정
-- 4. Stripe 관련 정보는 실제 결제 정보와 일치하도록 수정
-- ================================