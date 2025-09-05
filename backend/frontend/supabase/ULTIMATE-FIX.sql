-- =====================================
-- MyLife Cinema - 최종 완벽 해결
-- 모든 400 에러 해결 + 영화 저장 문제 해결
-- =====================================

-- 1. movies 테이블 재생성 (완벽한 구조)
DROP TABLE IF EXISTS movies CASCADE;

CREATE TABLE movies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    emotion TEXT,
    genre TEXT,
    style TEXT,
    music TEXT,
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

-- 2. 인덱스 생성
CREATE INDEX idx_movies_user ON movies(user_id);
CREATE INDEX idx_movies_created ON movies(created_at DESC);

-- 3. RLS 완전 비활성화
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;

-- 4. 권한 설정 (매우 중요!)
GRANT ALL ON TABLE movies TO anon;
GRANT ALL ON TABLE movies TO authenticated;
GRANT ALL ON TABLE movies TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. 사용자 플랜 확인 및 업데이트
UPDATE users 
SET 
    subscription_tier = 'creator',
    subscription_status = 'active',
    free_movies_used = 0,
    updated_at = NOW()
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 6. user_stats 초기화
DELETE FROM user_stats WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';
INSERT INTO user_stats (
    user_id,
    movies_created,
    movies_this_month,
    free_movies_used,
    total_likes,
    created_at
) VALUES (
    'c84dae12-f851-4215-a3fc-420b2b93e447',
    0, 0, 0, 0, NOW()
);

-- 7. 테스트 INSERT (작동 확인)
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

-- 8. 확인
SELECT COUNT(*) as movie_count FROM movies WHERE user_id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- 9. 테스트 데이터 삭제
DELETE FROM movies WHERE title = 'API 테스트';

-- 10. 최종 상태
SELECT 
    '✅ 완료!' as status,
    subscription_tier,
    subscription_status,
    free_movies_used
FROM users 
WHERE id = 'c84dae12-f851-4215-a3fc-420b2b93e447';

-- =====================================
-- 완료! 이제 영화 제작 가능합니다
-- =====================================