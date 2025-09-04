const https = require('https');

// Railway API를 통한 배포
const deployToRailway = async () => {
  const token = process.env.RAILWAY_TOKEN;
  
  if (!token) {
    console.error('RAILWAY_TOKEN 환경변수가 필요합니다.');
    console.log('사용법: RAILWAY_TOKEN=your_token node deploy-railway.js');
    process.exit(1);
  }

  const data = JSON.stringify({
    query: `
      mutation {
        projectCreate(
          input: {
            name: "mylife-cinema-frontend"
            plugins: []
            services: [{
              name: "frontend"
              source: {
                github: {
                  repo: "Leehanjun123/mylife-cinema-"
                  branch: "main"
                  rootDirectory: "/frontend"
                }
              }
              variables: {
                NEXT_PUBLIC_API_URL: "https://api.lifecinema.site"
                NEXT_PUBLIC_SUPABASE_URL: "https://hsvdyccqsrkdswkkvftf.supabase.co"
                NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8"
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_51RmannQ6Lbm6gVDg29O2uDl8WYMiudqtafKhCrxbq9SXSBIjK2rNZd2hPxIglywl1sWEjsjYJK9l1ZvMmDZMZE4r00nd1q3S10"
              }
            }]
          }
        ) {
          id
          name
        }
      }
    `
  });

  const options = {
    hostname: 'backboard.railway.app',
    port: 443,
    path: '/graphql/v2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      
      res.on('data', chunk => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Railway 응답:', body);
        resolve(JSON.parse(body));
      });
    });

    req.on('error', error => {
      console.error('배포 실패:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

console.log('Railway에 프론트엔드 배포 시작...');
deployToRailway()
  .then(result => {
    console.log('배포 완료!', result);
  })
  .catch(error => {
    console.error('배포 실패:', error);
  });