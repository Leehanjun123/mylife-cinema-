# MyLife Cinema - Supabase 데이터베이스 설정

결제 완료 후 무료 플랜으로 유지되는 문제를 해결하기 위한 Supabase 데이터베이스 설정 가이드입니다.

## 🚨 문제 상황
- 사용자가 Stripe를 통해 결제를 완료했지만 여전히 무료 플랜으로 표시됨
- Supabase REST API에서 400 에러 발생
- users, user_stats, movies 테이블 접근 실패
- 특정 사용자 ID: `c84dae12-f851-4215-a3fc-420b2b93e447`

## 📁 파일 구성

### 1. `schema.sql`
- 전체 데이터베이스 스키마 생성
- 필요한 모든 테이블 생성 (CREATE TABLE IF NOT EXISTS 사용)
- RLS (Row Level Security) 정책 설정
- 인덱스 및 트리거 생성
- 권한 설정

### 2. `fix-subscription.sql`
- 기존 사용자 구독 상태 수정
- 문제 진단 쿼리
- 특정 사용자 구독 정보 업데이트
- 응급 처치 방법

## 🛠️ 설정 방법

### Step 1: 스키마 생성
1. Supabase 대시보드 > SQL Editor 접속
2. `schema.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블, RLS 정책, 트리거가 생성되었는지 확인

### Step 2: 문제 해결
1. `fix-subscription.sql` 파일 열기
2. 사용자 ID를 실제 문제가 있는 사용자 ID로 수정
3. 구독 정보를 실제 Stripe 결제 정보에 맞게 수정
4. 쿼리를 순서대로 실행

### Step 3: 검증
다음 쿼리로 문제가 해결되었는지 확인:
```sql
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    subscription_expires_at
FROM users 
WHERE id = 'YOUR_USER_ID';
```

## 🗃️ 테이블 구조

### Users 테이블
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- username (VARCHAR)
- subscription_tier ('free', 'creator', 'pro')
- subscription_status ('active', 'inactive', 'canceled', 'past_due')
- subscription_expires_at (TIMESTAMP)
- stripe_customer_id (VARCHAR)
- stripe_subscription_id (VARCHAR)
```

### User Stats 테이블
```sql
- user_id (UUID, FK)
- total_movies (INTEGER)
- movies_this_month (INTEGER)
- movies_created (INTEGER)
- storage_used (BIGINT)
- streak_days (INTEGER)
```

### Movies 테이블
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- title (VARCHAR)
- content (TEXT)
- status ('processing', 'completed', 'failed')
- is_public (BOOLEAN)
```

### User Subscriptions 테이블
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- stripe_subscription_id (VARCHAR)
- status (VARCHAR)
- plan_name (VARCHAR)
- current_period_start/end (TIMESTAMP)
```

## 🔒 보안 설정 (RLS)

모든 테이블에 Row Level Security가 적용되어 있습니다:

- **Users**: 사용자는 자신의 데이터만 조회/수정 가능
- **Movies**: 사용자는 자신의 영화만 관리 가능, 공개 영화는 모든 사용자가 조회 가능
- **User Stats**: 사용자는 자신의 통계만 조회/수정 가능
- **Movie Likes**: 사용자는 자신의 좋아요만 관리 가능

## 🚨 문제 해결

### 400 에러가 계속 발생하는 경우

1. **RLS 정책 확인**:
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

2. **테이블 권한 확인**:
```sql
SELECT table_name, privilege_type, grantee 
FROM information_schema.table_privileges 
WHERE table_schema = 'public';
```

3. **임시 RLS 비활성화** (주의: 보안 위험):
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- 문제 해결 후 다시 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 구독 상태가 업데이트되지 않는 경우

1. Stripe 웹훅이 올바르게 설정되어 있는지 확인
2. 웹훅 엔드포인트 URL이 올바른지 확인
3. Stripe 대시보드에서 웹훅 로그 확인
4. 수동으로 사용자 구독 상태 업데이트:

```sql
UPDATE users 
SET 
    subscription_tier = 'creator', -- 또는 'pro'
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE id = 'YOUR_USER_ID';
```

## 🔧 유지보수

### 정기 점검 쿼리

```sql
-- 구독 만료 예정 사용자 확인
SELECT id, email, subscription_tier, subscription_expires_at
FROM users 
WHERE subscription_expires_at < NOW() + INTERVAL '7 days'
AND subscription_status = 'active';

-- 월별 통계 리셋 (매월 1일 실행)
UPDATE user_stats SET movies_this_month = 0;
```

## 📞 지원

문제가 계속 발생하는 경우:
1. Supabase 로그 확인
2. 브라우저 개발자 도구에서 네트워크 에러 확인
3. 환경변수 설정 확인 (.env 파일)
4. Stripe 웹훅 로그 확인

---

**중요**: 프로덕션 환경에서는 모든 쿼리를 실행하기 전에 데이터베이스 백업을 수행하세요.