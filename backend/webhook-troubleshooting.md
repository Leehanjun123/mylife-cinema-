# Webhook 트러블슈팅 가이드

## 자주 발생하는 문제와 해결법

### 1. "Invalid signature" 에러
**원인:** Webhook Secret 불일치
**해결:**
- Stripe Dashboard에서 Secret 다시 복사
- Railway 환경변수 업데이트
- 재배포

### 2. 404 Not Found
**원인:** Webhook URL 잘못됨
**해결:**
- URL 확인: `https://www.lifecinema.site/api/webhooks/stripe`
- HTTPS 필수 (http X)
- www 포함 여부 확인

### 3. 500 Internal Server Error
**원인:** 서버 에러
**해결:**
```bash
# Railway 로그 확인
railway logs -n 200
```
- Supabase 연결 확인
- 환경변수 확인

### 4. Webhook은 성공하는데 DB 업데이트 안됨
**원인:** metadata 누락
**해결:**
```javascript
// create-checkout-session에서 metadata 확인
metadata: {
    userId: user.id,
    priceId: plan.priceId
}
```

### 5. Test mode vs Live mode 혼동
**원인:** 키 불일치
**해결:**
- Test mode: `sk_test_`, `pk_test_`, `whsec_`
- Live mode: `sk_live_`, `pk_live_`, `whsec_`
- 모드 일치시키기

## Railway 환경변수 체크리스트

✅ 필수 환경변수:
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 디버깅 명령어

```bash
# Railway 로그 실시간 확인
railway logs -f

# Webhook 관련 로그만 보기
railway logs -n 100 | grep Webhook

# 에러만 보기
railway logs -n 100 | grep -E "(error|Error|ERROR)"
```

## 수동 테스트 스크립트

```bash
# cURL로 직접 테스트
curl -X POST https://www.lifecinema.site/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "metadata": {
          "userId": "c84dae12-f851-4215-a3fc-420b2b93e447",
          "priceId": "price_creator_monthly"
        }
      }
    }
  }'
```