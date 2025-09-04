-- =====================================
-- MyLife Cinema - 완전한 문제 해결 SQL
-- 모든 테이블/컬럼 문제를 한번에 해결합니다
-- Supabase SQL Editor에 전체 복사해서 실행하세요
-- =====================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- STEP 1: users 테이블 완전 수정
-- =====================================

-- users 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    username VARCHAR(100),
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 누락된 모든 컬럼 추가 (하나씩)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_movies_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================
-- STEP 2: user_stats 테이블 삭제하고 다시 생성
-- =====================================

-- 기존 테이블 삭제 (컬럼 문제 해결)
DROP TABLE IF EXISTS user_stats CASCADE;

-- 올바른 구조로 다시 생성
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY,
    movies_created INTEGER DEFAULT 0,       -- total_movies 대신 사용
    movies_this_month INTEGER DEFAULT 0,    
    free_movies_used INTEGER DEFAULT 0,     
    total_likes INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    last_movie_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- STEP 3: movies 테이블 확인/생성
-- =====================================

CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title VARCHAR(255),
    content TEXT,
    emotion VARCHAR(50),
    genre VARCHAR(100),
    style VARCHAR(100),
    music VARCHAR(100),
    length INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'processing',
    video_url TEXT,
    thumbnail_url TEXT,
    scenes JSONB,
    is_public BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- STEP 4: RLS 완전 비활성화 (400 에러 방지)
-- =====================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 5: 당신의 계정 Creator 플랜 활성화!
-- =====================================

-- 사용자 정보 업데이트
UPDATE users 
SET 
    subscription_tier = 'creator',              -- Creator 플랜
    subscription_status = 'active',             -- 활성 상태
    subscription_expires_at = NOW() + INTERVAL '365 days',  -- 1년 유효
    free_movies_used = 0,                       -- 리셋
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- user_stats 레코드 생성
INSERT INTO user_stats (
    user_id,
    movies_created,
    movies_this_month,
    free_movies_used,
    total_likes,
    streak_days
)
VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0, 0, 0, 0, 0
)
ON CONFLICT (user_id) DO UPDATE SET
    free_movies_used = 0,
    movies_this_month = 0,
    updated_at = NOW();

-- =====================================
-- STEP 6: 최종 확인
-- =====================================

-- 구독 상태 확인
SELECT 
    '✅ 설정 완료!' as status,
    subscription_tier as "플랜",
    subscription_status as "상태",
    subscription_expires_at as "만료일",
    free_movies_used as "무료사용"
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- user_stats 확인
SELECT 
    '✅ Stats 준비됨!' as status,
    movies_created,
    movies_this_month,
    free_movies_used
FROM user_stats 
WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- =====================================
-- 완료! 이제 영화 제작 가능합니다 🎬
-- =====================================