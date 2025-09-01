# Node.js 20 이미지 사용 (alpine 대신 일반 버전)
FROM node:20

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사
COPY package.json ./

# npm 캐시 정리 및 의존성 설치
RUN npm cache clean --force && \
    npm install --production --legacy-peer-deps

# 앱 소스 복사
COPY . .

# 포트 설정
EXPOSE 8000

# 앱 실행
CMD ["node", "start-server.js"]