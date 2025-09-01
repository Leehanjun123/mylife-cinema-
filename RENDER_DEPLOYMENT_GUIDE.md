# 🚀 MyLife Cinema - Render 배포 가이드

## 📋 배포 단계

### 1. 새 Web Service 생성
- Render 대시보드에서 "New+" → "Web Service" 선택
- GitHub repository 연결: `Leehanjun123/mylife-cinema-`
- Name: `mylife-cinema-backend`
- Environment: `Node`
- Region: `Oregon (US West)` (무료 티어)
- Branch: `main`

### 2. Build & Deploy 설정
```yaml
Build Command: npm install
Start Command: node start-server.js
```

### 3. 환경 변수 설정 (Environment Variables)
다음 환경 변수들을 Render 대시보드에서 설정해주세요:

```
NODE_ENV=production
PORT=10000

# Database
SUPABASE_URL=[당신의 Supabase URL]
SUPABASE_ANON_KEY=[당신의 Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[당신의 Supabase Service Role Key]

# AI Services  
OPENAI_API_KEY=[당신의 OpenAI API Key]
HUGGINGFACE_API_TOKEN=[당신의 HuggingFace Token]

# Payment
STRIPE_SECRET_KEY=[당신의 Stripe Secret Key]
STRIPE_PUBLISHABLE_KEY=[당신의 Stripe Publishable Key]

# Google Cloud TTS (JSON을 한 줄로)
GOOGLE_CLOUD_KEY_JSON={"type":"service_account","project_id":"[your-project]",...}

# CORS
FRONTEND_URL=https://[your-vercel-app].vercel.app
```

### 4. 배포 확인
- 배포 완료 후 `https://[your-app-name].onrender.com/health` 접속
- API 응답 확인: `{"status":"ok","services":{"openai":true,...}}`

## 🔗 다음 단계
1. ✅ GitHub 업로드 완료
2. 🚀 **현재: Render 백엔드 배포**
3. 📱 Vercel 프론트엔드 배포

백엔드 배포 URL을 받으면 프론트엔드 설정에서 API_URL을 업데이트하겠습니다!