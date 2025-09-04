# Stripe Webhook 영구 설정 가이드

## 1. Stripe Dashboard 설정

### Stripe Webhook 등록하기:
1. [Stripe Dashboard](https://dashboard.stripe.com) 로그인
2. **Developers → Webhooks** 메뉴 이동
3. **Add endpoint** 클릭
4. 다음 정보 입력:
   - **Endpoint URL**: `https://www.lifecinema.site/api/webhooks/stripe`
   - **Events to send**: 
     - `checkout.session.completed` ✅
     - `customer.subscription.created` ✅
     - `customer.subscription.updated` ✅
     - `customer.subscription.deleted` ✅
     - `invoice.payment_succeeded` ✅
5. **Add endpoint** 클릭

### Webhook Secret 복사:
1. 생성된 Webhook 클릭
2. **Signing secret** 섹션에서 **Reveal** 클릭
3. `whsec_xxxxx` 형태의 키 복사

## 2. Railway 환경변수 설정

### Railway Dashboard:
1. [Railway Dashboard](https://railway.app) 로그인
2. **mylife-cinema** 프로젝트 선택
3. **Variables** 탭 클릭
4. 다음 환경변수 추가:
```
STRIPE_WEBHOOK_SECRET=whsec_복사한시크릿키
```
5. **Deploy** 클릭하여 재배포

## 3. 테스트 방법

### Stripe CLI로 테스트 (선택사항):
```bash
# Stripe CLI 설치
brew install stripe/stripe-cli/stripe

# 로그인
stripe login

# Webhook 테스트
stripe trigger checkout.session.completed
```

### 실제 결제 테스트:
1. 테스트 카드 사용: `4242 4242 4242 4242`
2. 만료일: 미래 날짜 (예: 12/25)
3. CVC: 아무 3자리 숫자
4. 우편번호: 아무 5자리 숫자

## 4. 확인 방법

### Railway 로그 확인:
```bash
railway logs -n 100
```

다음과 같은 로그가 보이면 성공:
- `🎯 Stripe Webhook 호출됨`
- `✅ Webhook 서명 검증 성공`
- `💳 Checkout 완료 처리`
- `🎉 구독 생성 완료`

### Supabase에서 확인:
```sql
SELECT * FROM users WHERE email = '당신의이메일';
```
- `subscription_tier`가 'creator' 또는 'pro'로 변경됨
- `subscription_status`가 'active'로 변경됨

## 자주 발생하는 문제

### 1. Webhook이 작동하지 않는 경우:
- Railway 환경변수 확인
- Stripe Dashboard에서 Webhook 상태 확인 (Failed attempts 확인)
- HTTPS 필수 (http는 작동 안 함)

### 2. 403/401 에러:
- Webhook Secret이 올바른지 확인
- Railway와 Stripe의 Secret이 일치하는지 확인

### 3. 여전히 무료 플랜인 경우:
- Webhook 로그 확인
- Supabase RLS 정책 확인
- 테이블 권한 확인

## 완료!

이제 결제 시스템이 완전히 자동화됩니다:
1. 사용자 결제 → 
2. Stripe가 Webhook 호출 → 
3. 자동으로 DB 업데이트 → 
4. 즉시 프리미엄 기능 사용 가능