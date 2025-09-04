# 환경 변수 설정 가이드

결제 시스템이 올바르게 작동하기 위해 필요한 환경 변수들을 설정하는 가이드입니다.

## 🚨 현재 문제점

`.env.local` 파일에서 다음 환경 변수가 누락되어 있습니다:
- `STRIPE_WEBHOOK_SECRET` - Stripe 웹훅 검증에 필요
- Supabase Service Role Key (선택사항, 서버사이드 작업용)

## 📝 필요한 환경 변수

### .env.local 파일에 추가해야 할 내용:

```bash
# 현재 설정된 변수들
NEXT_PUBLIC_SUPABASE_URL=https://hsvdyccqsrkdswkkvftf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8

# API URL (Backend)
NEXT_PUBLIC_API_URL=https://mylife-cinema-backend-production.up.railway.app/api

# Stripe 설정
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RmannQ6Lbm6gVDg29O2uDl8WYMiudqtafKhCrxbq9SXSBIjK2rNZd2hPxIglywl1sWEjsjYJK9l1ZvMmDZMZE4r00nd1q3S10
STRIPE_SECRET_KEY=sk_test_51RmannQ6Lbm6gVDgKobNBix2XSkRECF4Bbb0McML8UdXBYXdisjo0JzTpRQ6nGOY7YmHRgG8qRdFKo7YBvO1OfIs00j09ANkJX

# ⚠️ 추가 필요: Stripe 웹훅 시크릿
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 선택사항: Supabase Service Role (서버사이드 작업용)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🔧 Stripe 웹훅 설정

### 1. Stripe 대시보드에서 웹훅 엔드포인트 설정

1. [Stripe 대시보드](https://dashboard.stripe.com) 로그인
2. **Developers** > **Webhooks** 메뉴로 이동
3. **Add endpoint** 클릭
4. 엔드포인트 URL 입력:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
   또는
   ```
   https://your-vercel-app.vercel.app/api/webhooks/stripe
   ```

### 2. 필요한 이벤트 선택

다음 이벤트들을 선택하세요:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. 웹훅 시크릿 복사

1. 웹훅 생성 후, **Signing secret** 복사
2. `.env.local` 파일의 `STRIPE_WEBHOOK_SECRET`에 추가

## 🔍 웹훅 동작 확인

### 1. 웹훅 로그 확인
Stripe 대시보드에서 웹훅 요청과 응답을 확인할 수 있습니다.

### 2. 로컬 테스트 (개발용)
```bash
# Stripe CLI 설치 후
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 테스트 이벤트 전송
stripe trigger checkout.session.completed
```

## 🛠️ 문제 해결

### 웹훅이 작동하지 않는 경우

1. **URL 확인**: 엔드포인트 URL이 올바른지 확인
2. **HTTPS 필요**: 웹훅은 HTTPS 엔드포인트만 지원
3. **방화벽**: 서버가 Stripe IP에서의 요청을 허용하는지 확인
4. **응답 코드**: 웹훅 핸들러가 200 상태 코드를 반환하는지 확인

### 서명 검증 실패

```typescript
// webhook handler에서 오류가 발생하는 경우
console.log('Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...');
console.log('Request Signature:', signature?.substring(0, 20) + '...');
```

### 사용자 구독 상태 확인

```sql
-- Supabase에서 사용자 구독 상태 확인
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    u.subscription_status,
    u.stripe_customer_id,
    u.stripe_subscription_id,
    us.status as subscription_record_status
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.stripe_customer_id IS NOT NULL;
```

## 📊 모니터링

### 1. 웹훅 성공률 모니터링
정기적으로 Stripe 대시보드에서 웹훅 성공률을 확인하세요.

### 2. 사용자 구독 상태 모니터링
```sql
-- 결제했지만 여전히 무료 플랜인 사용자 확인
SELECT COUNT(*) as problematic_users
FROM users 
WHERE stripe_customer_id IS NOT NULL 
AND subscription_tier = 'free';
```

### 3. 로그 모니터링
애플리케이션 로그에서 웹훅 처리 과정을 모니터링하세요.

## 🚀 배포 시 체크리스트

- [ ] 모든 환경 변수가 프로덕션 환경에 설정됨
- [ ] Stripe 웹훅 엔드포인트가 프로덕션 URL로 설정됨
- [ ] 웹훅 시크릿이 올바르게 설정됨
- [ ] HTTPS 인증서가 유효함
- [ ] 데이터베이스 스키마가 최신 상태임
- [ ] RLS 정책이 올바르게 적용됨

## 🆘 응급 복구

구독 상태가 동기화되지 않는 경우, `fix-subscription.sql`의 수동 업데이트 쿼리를 사용하여 임시 복구할 수 있습니다.

```sql
-- 응급 복구 쿼리 예시
UPDATE users 
SET 
    subscription_tier = 'creator',
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE stripe_customer_id = 'cus_stripe_customer_id';
```