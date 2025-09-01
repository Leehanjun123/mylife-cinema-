# 🌐 MyLife Cinema - Vercel 프론트엔드 배포 가이드

## 📋 배포 단계

### 1. 새 프로젝트 생성
- Vercel 대시보드에서 "New Project" 선택
- GitHub repository 연결: `Leehanjun123/mylife-cinema-`
- Framework Preset: `Next.js` (자동 감지됨)
- Root Directory: `frontend`

### 2. Build & Output 설정
```yaml
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### 3. 환경 변수 설정
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[your-render-app].onrender.com
```

### 4. 도메인 설정 (선택사항)
- 기본 도메인: `https://[project-name].vercel.app`
- 커스텀 도메인 추가 가능

## 🔄 배포 순서

### 1단계: Render 백엔드 배포 먼저
```
https://[your-backend].onrender.com
```

### 2단계: Vercel 프론트엔드 배포
- 위 백엔드 URL을 `NEXT_PUBLIC_API_URL`로 설정
- CORS 설정이 프론트엔드 도메인을 허용하는지 확인

## 🧪 테스트
1. `https://[frontend].vercel.app` 접속
2. 일기 입력 및 영화 생성 테스트
3. 모든 AI 기능 작동 확인

## 🎯 최종 시스템 구조
```
Frontend (Vercel) ←→ Backend (Render) ←→ AI Services
     ↓                    ↓
User Interface      Database + APIs
```

준비 완료! 🚀