#!/usr/bin/env node

// 무료 비디오 생성 테스트 스크립트
import dotenv from 'dotenv';

dotenv.config();

async function testFreeVideoServices() {
  console.log('🎬 무료 비디오 생성 서비스 테스트');
  console.log('==================================');

  // 1. Hugging Face 테스트 (완전 무료)
  console.log('\n1. 🤗 Hugging Face 테스트...');
  try {
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer hf_test', // 실제로는 무료 토큰 필요
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: "A beautiful sunset over the ocean, cinematic"
      })
    });

    if (hfResponse.ok) {
      console.log('✅ Hugging Face API 연결 가능');
      console.log('📝 무료 계정으로 월 1,000회 요청 가능');
    } else {
      console.log('⚠️ Hugging Face 토큰 필요 (무료 가입)');
    }
  } catch (error) {
    console.log('⚠️ Hugging Face API 테스트 건너뜀');
  }

  // 2. 로컬 텍스트 비디오 생성 테스트
  console.log('\n2. 📝 로컬 텍스트 비디오 생성 테스트...');
  try {
    // FFmpeg 설치 확인
    const { execSync } = await import('child_process');
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      console.log('✅ FFmpeg 설치됨 - 텍스트 비디오 생성 가능');
      console.log('💡 완전 무료로 텍스트 기반 비디오 제작 가능');
    } catch {
      console.log('❌ FFmpeg 미설치 - 설치 필요');
      console.log('💡 설치 명령: brew install ffmpeg (Mac)');
    }
  } catch (error) {
    console.log('⚠️ FFmpeg 테스트 실패');
  }

  // 3. Canvas 기능 테스트
  console.log('\n3. 🎨 Canvas 그래픽 생성 테스트...');
  try {
    await import('canvas');
    console.log('✅ Canvas 모듈 사용 가능');
    console.log('💡 자동으로 텍스트 + 그래픽 비디오 생성 가능');
  } catch {
    console.log('❌ Canvas 모듈 미설치');
    console.log('💡 설치 명령: npm install canvas');
  }

  // 4. 무료 대안 서비스들 정보
  console.log('\n4. 🆓 추천 무료 대안 서비스들:');
  
  const freeServices = [
    {
      name: 'Hugging Face Stable Video',
      cost: '완전 무료',
      limit: '월 1,000회',
      quality: '중간',
      setup: '무료 계정만 필요'
    },
    {
      name: 'Luma Dream Machine',
      cost: '무료 티어',
      limit: '월 30개 비디오',
      quality: '높음',
      setup: '무료 가입 후 사용'
    },
    {
      name: '로컬 텍스트 비디오',
      cost: '완전 무료',
      limit: '무제한',
      quality: '기본',
      setup: 'FFmpeg + Canvas 설치'
    },
    {
      name: 'Artflow.ai',
      cost: '무료 플랜',
      limit: '월 20개',
      quality: '중간',
      setup: '무료 회원가입'
    }
  ];

  freeServices.forEach((service, index) => {
    console.log(`\n   ${index + 1}. ${service.name}`);
    console.log(`      💰 비용: ${service.cost}`);
    console.log(`      📊 제한: ${service.limit}`);
    console.log(`      ⭐ 품질: ${service.quality}`);
    console.log(`      🔧 설정: ${service.setup}`);
  });

  // 5. 권장 전략
  console.log('\n🎯 MyLife Cinema 무료 전략 권장사항:');
  console.log('=============================================');
  console.log('1. 🆓 초기 개발: 로컬 텍스트 비디오로 시작');
  console.log('2. 🤗 베타 테스트: Hugging Face로 AI 비디오 추가');
  console.log('3. 🚀 정식 서비스: 무료 + 유료 하이브리드');
  
  console.log('\n💡 구현 우선순위:');
  console.log('   1순위: 텍스트 비디오 (즉시 구현 가능)');
  console.log('   2순위: Hugging Face 연동 (무료 토큰 발급)');
  console.log('   3순위: 필요시 유료 서비스 추가');

  console.log('\n📋 다음 단계:');
  console.log('   □ FFmpeg 설치');
  console.log('   □ Canvas 모듈 설치');
  console.log('   □ Hugging Face 무료 계정 생성');
  console.log('   □ 무료 비디오 생성 테스트');

  return true;
}

// 스크립트 실행
testFreeVideoServices().then(() => {
  console.log('\n🎉 무료 비디오 생성 환경 분석 완료!');
}).catch(error => {
  console.error('❌ 테스트 실패:', error);
});