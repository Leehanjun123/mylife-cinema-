-- 구독 상태 확인 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 구독 정보 확인
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    stripe_customer_id,
    subscription_expires_at,
    created_at,
    updated_at
FROM users
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 2. 사용자 통계 확인
SELECT 
    user_id,
    movies_this_month,
    total_movies,
    storage_used,
    last_movie_date,
    updated_at
FROM user_stats
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 3. 구독 이력 확인
SELECT 
    *
FROM user_subscriptions
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447'
ORDER BY created_at DESC;

-- 4. 최근 생성된 영화 확인
SELECT 
    id,
    title,
    status,
    created_at
FROM movies
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447'
ORDER BY created_at DESC
LIMIT 5;

-- 5. 수동으로 Creator 플랜으로 업데이트 (필요시)
-- UPDATE users 
-- SET 
--     subscription_tier = 'creator',
--     subscription_status = 'active',
--     subscription_expires_at = (CURRENT_TIMESTAMP + INTERVAL '30 days'),
--     updated_at = NOW()
-- WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 6. 수동으로 Pro 플랜으로 업데이트 (필요시)
-- UPDATE users 
-- SET 
--     subscription_tier = 'pro',
--     subscription_status = 'active',
--     subscription_expires_at = (CURRENT_TIMESTAMP + INTERVAL '30 days'),
--     updated_at = NOW()
-- WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';