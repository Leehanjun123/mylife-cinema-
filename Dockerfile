# Node.js 20 이미지 사용
FROM node:20

# 작업 디렉토리 설정
WORKDIR /app

# package.json만 복사 (package-lock.json 제외)
COPY package.json ./

# 의존성 설치 (npm install 사용)
RUN npm install --production

# 앱 소스 복사
COPY . .

# 포트 설정
EXPOSE 8000

# Railway가 자동으로 PORT 환경변수 설정
ENV PORT=8000

# 앱 실행
CMD ["node", "start-server.js"]