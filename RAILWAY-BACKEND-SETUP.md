# Railway Backend 서비스 추가 가이드

## 현재 상황
- **mylife-cinema-backend-production**: Frontend 실행 중 ❌
- **Backend 코드**: /backend 폴더에 있음 ✅
- **Frontend**: 별도로 잘 돌아감 ✅

## 해결 방법

### Railway Dashboard에서:

1. **https://railway.app/dashboard 접속**

2. **현재 프로젝트에서 새 서비스 추가**:
   - 프로젝트 안으로 들어가기
   - "+ New" 버튼 클릭
   - "GitHub Repo" 선택
   - 같은 저장소 (mylife-cinema-) 선택

3. **Service Settings 설정 (가장 중요!)**:
   - Settings 탭 클릭
   - "Service" 섹션에서:
     - **Service Name**: mylife-cinema-backend (변경)
     - **Root Directory**: `backend` (꼭 입력!)
   - Save Changes

4. **Environment Variables 추가**:
   - Variables 탭 클릭
   - "Raw Editor" 클릭
   - 다음 복사/붙여넣기:
   ```
   PORT=8000
   NODE_ENV=production
   FRONTEND_URL=https://www.lifecinema.site
   ```

5. **Deploy 확인**:
   - Deploy 탭에서 로그 확인
   - "Backend server running on port 8000" 메시지 확인
   - 생성된 URL 복사 (예: https://mylife-cinema-backend.up.railway.app)

6. **Frontend 환경변수 업데이트**:
   - Vercel Dashboard 접속
   - Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` 값을 새 Backend URL로 변경

## 또는 기존 서비스 수정

현재 잘못 배포된 서비스를 수정하려면:

1. **Railway Dashboard → 현재 서비스**
2. **Settings → Service**
3. **Root Directory**: `backend` 입력
4. **Save Changes**
5. **Redeploy** 클릭

## 확인 방법

```bash
# Backend health check
curl https://your-backend-url.up.railway.app/
# 응답: {"status":"ok","service":"MyLife Cinema Backend"}

# API endpoint test  
curl https://your-backend-url.up.railway.app/api
# 응답: {"status":"ok","endpoints":{"movies":"/api/movies"}}
```

## 주의사항
- Root Directory 설정이 핵심!
- backend 폴더를 지정하지 않으면 계속 frontend가 배포됨