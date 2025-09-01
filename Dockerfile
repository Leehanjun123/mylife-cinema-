# Node.js 20 LTS 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 앱 소스 복사
COPY . .

# 포트 설정
EXPOSE 8000

# 앱 실행
CMD ["node", "start-server.js"]