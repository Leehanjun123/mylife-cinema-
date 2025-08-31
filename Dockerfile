# Node.js 20 Alpine 이미지 사용 (경량화)
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (프로덕션 전용)
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# temp, output, uploads 디렉토리 생성
RUN mkdir -p temp output uploads

# 포트 노출
EXPOSE 8000

# 애플리케이션 시작
CMD ["npm", "start"]