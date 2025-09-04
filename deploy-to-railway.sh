#!/bin/bash

PROJECT_ID="34414c6e-9ab3-4c9f-9b28-fd7d4d248205"
GITHUB_REPO="Leehanjun123/mylife-cinema-"

echo "Railway 프로젝트에 연결 중..."
echo "프로젝트 ID: $PROJECT_ID"

# Frontend 서비스 배포 설정
cat > railway-config.json <<EOF
{
  "projectId": "$PROJECT_ID",
  "services": [
    {
      "name": "frontend",
      "source": {
        "github": {
          "repo": "$GITHUB_REPO",
          "branch": "main", 
          "rootDirectory": "/frontend"
        }
      },
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm start",
      "envVars": {
        "NEXT_PUBLIC_API_URL": "https://api.lifecinema.site",
        "NEXT_PUBLIC_SUPABASE_URL": "https://hsvdyccqsrkdswkkvftf.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_51RmannQ6Lbm6gVDg29O2uDl8WYMiudqtafKhCrxbq9SXSBIjK2rNZd2hPxIglywl1sWEjsjYJK9l1ZvMmDZMZE4r00nd1q3S10"
      }
    }
  ]
}
EOF

echo "설정 완료. Railway Dashboard에서 확인하세요."
echo "https://railway.app/project/$PROJECT_ID"