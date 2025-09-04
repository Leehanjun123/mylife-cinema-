# MyLife Cinema 배포 가이드

## 🚀 배포 완료 시스템 개요

MyLife Cinema는 완전한 AI 영화 제작 플랫폼으로 다음 시스템이 구축되어 있습니다:

### 완료된 기능들
- ✅ **전체 시스템 아키텍처**: Next.js 15 + FastAPI + Supabase
- ✅ **Google AdSense 통합**: 광고 수익 시스템
- ✅ **Stripe 결제 시스템**: 구독 기반 요금제
- ✅ **AI 영화 생성 파이프라인**: OpenAI GPT-4 + Replicate
- ✅ **백엔드 API 서버**: FastAPI 완전 구현
- ✅ **SEO 최적화**: 메타데이터, 사이트맵, 로봇.txt
- ✅ **커뮤니티 기능**: 영화 공유 및 좋아요 시스템
- ✅ **법적 문서**: 이용약관 및 개인정보처리방침

## 📋 배포 전 준비사항

### 1. 환경 변수 설정

#### Frontend (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AdSense
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-your-adsense-id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

#### Backend (.env)
```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Replicate
REPLICATE_API_TOKEN=r8_your-replicate-token

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Configuration
ENVIRONMENT=production
CORS_ORIGINS=https://lifecinema.site,https://www.lifecinema.site
```

### 2. Supabase 데이터베이스 설정

```sql
-- database-simple.sql 파일을 Supabase SQL Editor에서 실행
-- RLS 정책 및 테이블 구조가 자동으로 설정됩니다
```

### 3. Stripe 설정

1. Stripe 대시보드에서 제품 및 가격 생성:
   - Creator 플랜: 월간/연간 가격
   - Pro 플랜: 월간/연간 가격

2. 웹훅 엔드포인트 설정:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - 이벤트: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

### 4. Google AdSense 승인
1. Google AdSense에 사이트 등록
2. 승인 후 광고 단위 생성
3. 환경변수에 Publisher ID 설정

## 🌐 배포 단계

### 1. Backend 배포 (Railway)

```bash
cd backend

# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인 및 프로젝트 생성
railway login
railway init

# 환경 변수 설정 (Railway 대시보드에서)
railway variables set OPENAI_API_KEY=sk-...
railway variables set REPLICATE_API_TOKEN=r8_...
railway variables set SUPABASE_URL=https://...
# ... 기타 환경변수들

# 배포
railway up
```

### 2. Frontend 배포 (Vercel)

```bash
cd frontend

# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod

# 환경 변수 설정 (Vercel 대시보드에서)
# 모든 NEXT_PUBLIC_ 변수들 설정
```

### 3. 도메인 설정

1. **DNS 설정**:
   - A 레코드: lifecinema.site → Vercel IP
   - CNAME: www.lifecinema.site → lifecinema.site

2. **SSL 인증서**:
   - Vercel에서 자동 처리됨

## 🔧 운영 모니터링

### 1. 로그 모니터링
```bash
# Backend 로그 확인
railway logs

# Frontend 로그 확인 (Vercel 대시보드)
```

### 2. 데이터베이스 모니터링
- Supabase 대시보드에서 쿼리 성능 확인
- Row Level Security 정책 점검

### 3. 결제 시스템 모니터링
- Stripe 대시보드에서 결제 상태 확인
- 웹훅 실패 시 재처리

### 4. 광고 수익 모니터링
- Google AdSense 대시보드에서 수익 확인
- 광고 단위별 성능 분석

## 📊 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP/AVIF 포맷 자동 변환
- 적응형 이미지 크기 제공

### 2. 캐싱 전략
- Static assets: 1년 캐싱
- API 응답: 적절한 Cache-Control 헤더
- CDN 활용 (Vercel Edge Network)

### 3. 코드 분할
- 페이지별 동적 임포트
- 패키지 최적화 (`optimizePackageImports`)

## 🛡️ 보안 설정

### 1. 헤더 보안
```typescript
// next.config.ts에 이미 설정됨
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. 환경 변수 보안
- Production 키만 사용
- 민감한 정보는 서버 사이드에서만 접근

### 3. Rate Limiting
- API 엔드포인트별 요청 제한
- Supabase RLS로 데이터 접근 제한

## 📈 분석 및 추적

### 1. Google Analytics 4
- 사용자 행동 분석
- 영화 생성 완료율 추적
- 구독 전환율 모니터링

### 2. 커스텀 이벤트 추적
```typescript
trackMovieCreation(genre, duration)
trackSignup(method)
trackSubscription(tier, price)
```

## 🚨 장애 대응

### 1. 백엔드 서비스 다운
- Railway 서비스 상태 확인
- 로그 분석 및 재시작
- 필요시 백업 서버 활성화

### 2. 데이터베이스 이슈
- Supabase 상태 페이지 확인
- 쿼리 최적화
- 연결 풀 설정 조정

### 3. 결제 시스템 오류
- Stripe 상태 페이지 확인
- 웹훅 재처리
- 고객 지원 대응

## 📞 고객 지원

### 연락처
- 일반 문의: support@lifecinema.site
- 개인정보 문의: privacy@lifecinema.site
- 기술 지원: tech@lifecinema.site

### 지원 시간
- 평일 09:00-18:00 (KST)
- 긴급 상황 시 24/7 대응

---

🎬 **MyLife Cinema는 이제 완전한 AI 영화 제작 플랫폼으로 운영 준비가 완료되었습니다!**

실제 API 키만 설정하면 바로 서비스 시작 가능합니다.