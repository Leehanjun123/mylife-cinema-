-- 테스트: movies 테이블의 현재 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'movies'
ORDER BY 
    ordinal_position;

-- 테스트: movies 테이블에 필수 컬럼만 추가
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;