# 🎬 AI 영화 생성 설정 가이드

## 필요한 API 키

### 1. OpenAI API (필수)
- **용도**: 스토리 생성, 이미지 생성 (DALL-E 3)
- **가격**: 
  - GPT-4o-mini: $0.15 / 1M tokens
  - DALL-E 3: $0.04 / image (standard quality)
- **설정 방법**:
  1. https://platform.openai.com 접속
  2. API Keys 메뉴에서 새 키 생성
  3. Railway 환경변수에 추가: `OPENAI_API_KEY=sk-...`

### 2. Replicate API (선택 - Stable Diffusion)
- **용도**: 대체 이미지 생성
- **가격**: $0.0011 / 초
- **설정 방법**:
  1. https://replicate.com 가입
  2. API tokens에서 키 생성
  3. Railway 환경변수에 추가: `REPLICATE_API_TOKEN=r8_...`

## Railway 환경변수 설정

1. Railway Dashboard → Backend 서비스
2. Variables 탭
3. 다음 변수 추가:

```bash
# 필수
OPENAI_API_KEY=sk-your-openai-key-here

# 선택 (대체 이미지 생성)
REPLICATE_API_TOKEN=r8-your-replicate-token-here

# 이미 설정됨
PORT=8000
FRONTEND_URL=https://www.lifecinema.site
NODE_ENV=production
```

## 영화 생성 프로세스

### 현재 구현된 기능:
1. ✅ 일기 → AI 스토리 생성 (GPT-4)
2. ✅ 스토리 → 4개 장면 생성
3. ✅ 장면별 이미지 프롬프트 생성
4. ⚠️ 이미지 생성 (API 키 필요)
5. ⚠️ 음성 나레이션 (추가 구현 필요)
6. ⚠️ 비디오 합성 (FFmpeg 설정 필요)

### 테스트 방법:
1. OpenAI API 키만 설정
2. 영화 생성 시도
3. 콘솔에서 생성된 스토리 확인
4. 이미지는 placeholder 사용 (API 키 없을 때)

## 예상 비용 (영화 1편당)
- 스토리 생성: ~$0.01
- 이미지 4장: $0.16 (DALL-E) 또는 $0.004 (Stable Diffusion)
- **총 비용**: 약 $0.17 ~ $0.20

## 다음 단계 구현 (선택사항)

### 1. 실제 비디오 생성
```javascript
// FFmpeg 설치 필요
// Railway에서는 nixpacks.toml 설정 필요
[phases.setup]
aptPkgs = ["ffmpeg"]
```

### 2. 음성 나레이션 (TTS)
- Google Cloud TTS
- ElevenLabs API
- Edge TTS (무료)

### 3. 클라우드 스토리지
- Supabase Storage
- AWS S3
- Cloudinary

## 문제 해결

### API 키 없을 때:
- 샘플 비디오 사용 (Big Buck Bunny)
- 스토리는 생성되지만 이미지는 placeholder

### 에러 발생 시:
- Railway 로그 확인
- Backend console.log 확인
- API 키 유효성 확인

## 무료 대안

### 이미지 생성:
- Stable Diffusion Web UI (로컬)
- Hugging Face Spaces

### TTS:
- Edge TTS (무료)
- Google Translate TTS (제한적)

### 비디오 편집:
- FFmpeg (무료)
- MoviePy (Python)