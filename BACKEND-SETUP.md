# Backend 영구 해결 가이드

## 현재 상황
- Frontend: Vercel에 배포 중 (정상)
- Backend: Railway에 잘못 배포됨 (frontend가 배포됨)

## 해결 방법

### Option 1: Railway에 Backend 별도 배포 (추천)

1. **Railway Dashboard 접속**
   - https://railway.app 로그인

2. **새 서비스 생성**
   - "New Service" 클릭
   - "Deploy from GitHub repo" 선택
   - Repository: `mylife-cinema-` 선택

3. **중요! Root Directory 설정**
   - Settings 탭 → Service Settings
   - Root Directory: `backend` 입력
   - Save 클릭

4. **환경변수 설정**
   ```
   PORT=8000
   NODE_ENV=production
   FRONTEND_URL=https://www.lifecinema.site
   ```

5. **배포 확인**
   - Deploy 탭에서 로그 확인
   - 생성된 URL 복사 (예: https://mylife-cinema-backend.up.railway.app)

6. **Frontend 환경변수 업데이트**
   ```bash
   # .env.production
   NEXT_PUBLIC_API_URL=https://mylife-cinema-backend.up.railway.app/api
   ```

### Option 2: Render.com 사용 (무료)

1. **Render 계정 생성**
   - https://render.com 가입

2. **Web Service 생성**
   - "New Web Service" 클릭
   - GitHub 연결
   - Repository 선택

3. **설정**
   - Name: mylife-cinema-backend
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start

4. **환경변수 추가**
   ```
   PORT=8000
   FRONTEND_URL=https://www.lifecinema.site
   ```

5. **배포 후 URL 복사**
   - 예: https://mylife-cinema-backend.onrender.com

### Option 3: Fly.io 사용

```bash
# Backend 폴더에서
cd backend

# Fly.io CLI 설치
curl -L https://fly.io/install.sh | sh

# 로그인
fly auth login

# 앱 생성
fly launch --name mylife-cinema-backend

# 환경변수 설정
fly secrets set FRONTEND_URL=https://www.lifecinema.site

# 배포
fly deploy
```

## Frontend 코드 수정

배포 완료 후 frontend 코드 복구:

```typescript
// src/app/create-movie/page.tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.com'
const response = await fetch(`${apiUrl}/movies/create`, {
  // ...
})
```

## 확인 사항

1. **CORS 테스트**
   ```bash
   curl -X OPTIONS https://your-backend.com/api/movies/create \
     -H "Origin: https://www.lifecinema.site" \
     -H "Access-Control-Request-Method: POST" -v
   ```

2. **Health Check**
   ```bash
   curl https://your-backend.com/
   # 응답: {"status":"ok","service":"MyLife Cinema Backend"}
   ```

## 중요!
- Backend는 별도 서비스로 배포해야 함
- Frontend와 같은 서비스에 배포하면 안됨
- Root Directory 설정이 핵심