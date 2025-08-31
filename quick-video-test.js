#!/usr/bin/env node

// 즉시 테스트 가능한 무료 비디오 생성
import fs from 'fs/promises';
import { execSync } from 'child_process';

async function createQuickVideo() {
  console.log('🎬 무료 비디오 생성 즉시 테스트!');
  console.log('================================');

  try {
    // 1. 간단한 비디오 생성 (FFmpeg만 사용)
    console.log('\n1. 🎨 기본 비디오 생성 중...');
    
    const videoPath = './test-movie.mp4';
    const prompt = "오늘 친구와 카페에서 만나서 즐거운 대화를 나눴다";

    // FFmpeg로 텍스트 비디오 생성
    const ffmpegCommand = `
      ffmpeg -f lavfi -i color=c=navy:s=1920x1080:d=5 \
      -vf "drawtext=text='🎬 MyLife Cinema\\n\\n${prompt}\\n\\nAI가 곧 이런 일기를\\n멋진 영화로 만들어줄 거예요!':fontsize=42:fontcolor=gold:x=(w-text_w)/2:y=(h-text_h)/2" \
      -c:v libx264 -preset ultrafast -y ${videoPath}
    `.replace(/\s+/g, ' ').trim();

    console.log('⏳ 비디오 생성 중... (5초 소요)');
    execSync(ffmpegCommand, { stdio: 'pipe' });
    console.log('✅ 비디오 생성 완료!');
    console.log(`📁 생성된 파일: ${videoPath}`);

    // 파일 크기 확인
    const stats = await fs.stat(videoPath);
    console.log(`📊 파일 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. 브라우저에서 열기
    console.log('\n2. 🎥 비디오 재생 테스트...');
    console.log('📱 생성된 비디오를 확인해보세요!');
    
    // Mac에서 비디오 열기
    try {
      execSync(`open ${videoPath}`, { stdio: 'ignore' });
      console.log('✅ 기본 비디오 플레이어에서 열림');
    } catch {
      console.log('💡 수동으로 파일을 열어서 확인해주세요:', videoPath);
    }

    console.log('\n🎉 무료 비디오 생성 테스트 성공!');
    console.log('==================================');
    console.log('✅ FFmpeg 기반 비디오 생성 작동함');
    console.log('✅ MyLife Cinema에서 바로 사용 가능');
    console.log('✅ 완전 무료, 무제한 생성 가능');
    
    console.log('\n🚀 다음 단계:');
    console.log('1. Canvas 모듈 설치로 더 예쁜 그래픽 추가');
    console.log('2. Hugging Face 연동으로 AI 비디오 추가');
    console.log('3. 여러 씬을 연결해서 완전한 영화 제작');

    return true;

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    if (error.message.includes('ffmpeg')) {
      console.log('\n💡 FFmpeg 설치가 필요합니다:');
      console.log('   Mac: brew install ffmpeg');
      console.log('   Windows: https://ffmpeg.org/download.html');
      console.log('   Linux: sudo apt install ffmpeg');
    }

    return false;
  }
}

// 실행
createQuickVideo();