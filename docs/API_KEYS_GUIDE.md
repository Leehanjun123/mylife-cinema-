# 🔑 **MyLife Cinema API Keys Setup Guide**

## 🎯 **필수 API 키 목록**

### **1. 🤖 OpenAI (필수 - 핵심)**
**용도**: 일기 분석, 스토리 생성, 시나리오 작성
**가격**: $20/월부터
**획득 방법**:
1. [OpenAI Platform](https://platform.openai.com) 가입
2. API 키 생성: Dashboard → API Keys → Create new secret key
3. 형태: `sk-1234567890abcdef...`

```bash
# 환경변수 설정
OPENAI_API_KEY=sk-your_actual_key_here
```

---

### **2. 🎬 Runway ML (필수 - 비디오 생성)**
**용도**: 주요 AI 비디오 생성 서비스
**가격**: $15/월부터 (525 크레딧)
**획득 방법**:
1. [Runway ML](https://runwayml.com) 가입
2. 구독 플랜 선택 (Gen-3 Alpha 필요)
3. API 키 생성: Settings → API Keys
4. 형태: `rw-1234567890abcdef...`

```bash
# 환경변수 설정  
RUNWAY_API_KEY=rw-your_actual_key_here
```

---

### **3. 🎤 ElevenLabs (필수 - 음성 합성)**
**용도**: AI 음성 합성, 내레이션 생성
**가격**: $11/월부터 (30,000 문자)
**획득 방법**:
1. [ElevenLabs](https://elevenlabs.io) 가입
2. 구독 플랜 선택
3. API 키 확인: Profile → API Keys
4. 형태: `sk_1234567890abcdef...`

```bash
# 환경변수 설정
ELEVENLABS_API_KEY=sk_your_actual_key_here
```

---

### **4. 🗄️ AWS S3 (필수 - 파일 저장)**
**용도**: 생성된 비디오 파일 저장 및 배포
**가격**: 사용량 기반 (월 $5 정도)
**획득 방법**:
1. [AWS Console](https://aws.amazon.com/console) 가입
2. IAM → Users → Create User
3. S3FullAccess 권한 부여
4. Access Key 생성

```bash
# S3 버킷 생성
aws s3 mb s3://mylife-cinema-videos

# 환경변수 설정
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
S3_BUCKET=mylife-cinema-videos
AWS_REGION=us-east-1
```

---

### **5. 💳 Stripe (필수 - 결제)**
**용도**: 구독 결제, 사용량 기반 과금
**가격**: 거래당 2.9% + $0.30
**획득 방법**:
1. [Stripe](https://stripe.com) 가입
2. 개발자 → API 키
3. 테스트 키와 라이브 키 확인

```bash
# 환경변수 설정 (테스트 모드)
STRIPE_SECRET_KEY=sk_test_1234567890abcdef...
STRIPE_PUBLISHABLE_KEY=pk_test_1234567890abcdef...
```

---

## 🔧 **선택적 API 키들**

### **6. 🎥 Pika Labs (선택적 - 백업 비디오)**
**용도**: Runway ML 백업 서비스
**가격**: $10/월부터
**획득 방법**:
1. [Pika Labs](https://pika.art) 가입
2. API 액세스 요청

### **7. 🎵 Mubert (선택적 - 배경음악)**
**용도**: AI 배경음악 생성
**가격**: $14/월부터
**획득 방법**:
1. [Mubert](https://mubert.com) 가입
2. API for Business 플랜 선택

### **8. 🗃️ Supabase (선택적 - 호스팅 DB)**
**용도**: PostgreSQL 호스팅 (로컬 DB 대신)
**가격**: 무료부터
**획득 방법**:
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. Settings → API → URL과 anon key 복사

---

## 🚀 **빠른 설정 방법**

### **방법 1: 자동 설정 스크립트 사용**
```bash
cd mylife-cinema
./scripts/setup-keys.sh
```

### **방법 2: 수동 설정**
```bash
# .env 파일 생성
cp .env.example .env

# 에디터로 .env 파일 편집
nano .env

# 또는 VS Code로
code .env
```

---

## 💰 **예산 계획**

### **최소 필수 비용 (월)**
- OpenAI API: $20
- Runway ML: $15  
- ElevenLabs: $11
- AWS S3: $5
- **총: $51/월**

### **권장 풀 패키지 (월)**
- 위 필수 비용: $51
- Pika Labs: $10
- Mubert: $14
- Supabase Pro: $25
- **총: $100/월**

---

## ⚡ **설정 검증**

### **1. API 키 테스트 스크립트**
```bash
# OpenAI 테스트
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# ElevenLabs 테스트  
curl https://api.elevenlabs.io/v1/voices \
  -H "Accept: application/json" \
  -H "xi-api-key: $ELEVENLABS_API_KEY"

# AWS S3 테스트
aws s3 ls s3://$S3_BUCKET
```

### **2. 서비스 상태 확인**
```bash
# Docker 컨테이너 실행 후
docker-compose logs api

# API 헬스체크
curl http://localhost:8000/health
```

---

## 🔒 **보안 주의사항**

### **API 키 보안**
```bash
# .env 파일 권한 설정
chmod 600 .env

# Git에서 제외 (이미 .gitignore에 포함됨)
echo ".env" >> .gitignore

# 프로덕션에서는 환경변수 사용
export OPENAI_API_KEY="sk-real_key_here"
```

### **액세스 제한**
- AWS IAM: 최소 권한 원칙
- API 키 로테이션: 3개월마다
- 모니터링: 비정상적 사용량 체크

---

## 🆘 **문제 해결**

### **자주 발생하는 오류들**

**1. OpenAI API 할당량 초과**
```bash
# 오류: "You exceeded your current quota"
# 해결: OpenAI Dashboard에서 사용량 및 결제 정보 확인
```

**2. Runway ML 크레딧 부족**
```bash
# 오류: "Insufficient credits"
# 해결: Runway ML에서 추가 크레딧 구매
```

**3. S3 권한 오류**
```bash
# 오류: "AccessDenied"
# 해결: IAM 정책에서 S3 권한 확인
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::your-bucket/*"]
    }
  ]
}
```

---

## ✅ **설정 완료 체크리스트**

- [ ] ✅ OpenAI API 키 설정 및 테스트
- [ ] ✅ Runway ML 계정 및 API 키 설정
- [ ] ✅ ElevenLabs 구독 및 API 키 설정
- [ ] ✅ AWS S3 버킷 생성 및 액세스 키 설정
- [ ] ✅ Stripe 테스트 키 설정
- [ ] ✅ .env 파일 권한 설정 (600)
- [ ] ✅ Docker 컨테이너 실행 테스트
- [ ] ✅ API 헬스체크 확인
- [ ] ✅ 첫 번째 영화 생성 테스트

---

## 🎬 **설정 완료 후 첫 실행**

```bash
# 1. 모든 서비스 시작
docker-compose up -d

# 2. 로그 확인
docker-compose logs -f api

# 3. 브라우저에서 접속
open http://localhost:3000

# 4. 회원가입 후 첫 번째 일기 작성
# 5. 영화 생성 버튼 클릭
# 6. 실시간 진행상황 확인!
```

**🎉 모든 API 키가 설정되면 MyLife Cinema의 마법이 시작됩니다!** ✨