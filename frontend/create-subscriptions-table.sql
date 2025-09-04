-- user_subscriptions 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. user_subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    plan_name TEXT NOT NULL DEFAULT 'free',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- 3. RLS 비활성화 (접근 문제 방지)
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. 현재 사용자의 구독 레코드 생성 (Creator 플랜)
-- 먼저 기존 레코드가 있는지 확인
DELETE FROM user_subscriptions WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 새 레코드 삽입
INSERT INTO user_subscriptions (
    user_id,
    status,
    plan_name,
    current_period_start,
    current_period_end
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    'active',
    'creator',
    NOW(),
    NOW() + INTERVAL '30 days'
);

-- 5. 사용자 테이블도 Creator로 업데이트
UPDATE users 
SET 
    subscription_tier = 'creator',
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 6. 확인
SELECT 
    u.email,
    u.subscription_tier,
    u.subscription_status,
    us.plan_name,
    us.status as sub_status,
    us.current_period_end
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.id = 'c84dae12-f851-4215-a3fc-420b2b93e447';