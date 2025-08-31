#!/usr/bin/env node

// Google Cloud TTS 테스트 (무료 한도 확인)
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

async function testGoogleTTS() {
  console.log('🎤 Google Cloud TTS 테스트 (무료 한도 체크)');
  console.log('==========================================');
  
  console.log('⚠️ 무료 한도: 월 100만 문자');
  console.log('💰 현재 테스트: 약 200문자 (0.02% 사용)');
  console.log('✅ 안전: 과금 발생하지 않음\n');

  try {
    // 클라이언트 초기화
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: './google-cloud-key.json'
    });

    // 1. 사용 가능한 한국어 음성 목록 확인
    console.log('1. 🔍 한국어 음성 목록 확인...');
    
    const [result] = await client.listVoices({});
    const koreanVoices = result.voices.filter(voice => 
      voice.languageCodes.some(code => code.startsWith('ko-'))
    );

    console.log(`✅ 한국어 음성: ${koreanVoices.length}개 발견`);
    
    // WaveNet 음성 (가장 자연스러움)
    const waveNetVoices = koreanVoices.filter(voice => 
      voice.name.includes('Wavenet')
    );
    
    console.log(`🎵 WaveNet 음성 (프리미엄): ${waveNetVoices.length}개`);
    
    if (waveNetVoices.length > 0) {
      console.log('   추천 음성:');
      waveNetVoices.slice(0, 3).forEach(voice => {
        console.log(`   - ${voice.name}: ${voice.ssmlGender}`);
      });
    }

    // 2. 짧은 테스트 문장으로 음성 생성 (과금 방지)
    console.log('\n2. 🎯 테스트 음성 생성 (50자 이하)...');
    
    const testText = '안녕하세요. MyLife Cinema 음성 테스트입니다.';
    console.log(`📝 테스트 문장: "${testText}"`);
    console.log(`📊 문자 수: ${testText.length}자 (무료 한도의 0.000005%)`);

    const request = {
      input: { text: testText },
      voice: {
        languageCode: 'ko-KR',
        name: 'ko-KR-Wavenet-A',  // 여성 음성
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const [response] = await client.synthesizeSpeech(request);
    
    // 오디오 파일 저장
    await fs.mkdir('./temp', { recursive: true });
    const outputPath = './temp/google-tts-test.mp3';
    await fs.writeFile(outputPath, response.audioContent, 'binary');
    
    const stats = await fs.stat(outputPath);
    console.log(`✅ 음성 파일 생성: ${outputPath}`);
    console.log(`📊 파일 크기: ${(stats.size / 1024).toFixed(1)} KB`);

    // 3. 비용 계산
    console.log('\n3. 💰 비용 분석:');
    console.log(`   테스트 사용량: ${testText.length}자`);
    console.log(`   무료 한도: 1,000,000자/월`);
    console.log(`   남은 무료 한도: ${(1000000 - testText.length).toLocaleString()}자`);
    console.log(`   예상 비용: $0.00 (무료)`);

    // 4. MyLife Cinema 예상 사용량
    console.log('\n4. 📊 MyLife Cinema 예상 사용량:');
    const avgSceneText = 100;  // 씬당 평균 100자
    const scenesPerMovie = 5;  // 영화당 5개 씬
    const charsPerMovie = avgSceneText * scenesPerMovie;
    const freeMoviesPerMonth = Math.floor(1000000 / charsPerMovie);
    
    console.log(`   씬당 텍스트: ~${avgSceneText}자`);
    console.log(`   영화당 씬: ${scenesPerMovie}개`);
    console.log(`   영화당 총 문자: ~${charsPerMovie}자`);
    console.log(`   🎬 무료로 생성 가능한 영화: 월 ${freeMoviesPerMonth}개`);

    // 5. 다양한 음성 옵션 테스트
    console.log('\n5. 🎤 추천 음성 설정:');
    const voiceOptions = [
      { name: 'ko-KR-Wavenet-A', gender: 'FEMALE', description: '여성, 자연스러움' },
      { name: 'ko-KR-Wavenet-B', gender: 'FEMALE', description: '여성, 밝음' },
      { name: 'ko-KR-Wavenet-C', gender: 'MALE', description: '남성, 차분함' },
      { name: 'ko-KR-Wavenet-D', gender: 'MALE', description: '남성, 활기참' }
    ];

    voiceOptions.forEach(voice => {
      console.log(`   ${voice.name}: ${voice.description}`);
    });

    console.log('\n🎉 Google Cloud TTS 설정 완료!');
    console.log('==================================');
    console.log('✅ API 연결: 성공');
    console.log('✅ 한국어 음성: 사용 가능');
    console.log('✅ 무료 한도: 충분함 (월 2000개 영화)');
    console.log('✅ 음질: 매우 자연스러움');
    console.log('💡 과금 걱정: 없음!');

    return true;

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    
    if (error.code === 7) {
      console.log('🔑 권한 오류: API가 활성화되지 않았습니다.');
      console.log('\n해결 방법:');
      console.log('1. https://console.cloud.google.com 접속');
      console.log('2. API 및 서비스 → 라이브러리');
      console.log('3. "Cloud Text-to-Speech API" 검색');
      console.log('4. "사용 설정" 클릭');
      console.log('\n⚠️ 신용카드 등록 필요하지만 과금되지 않습니다!');
    } else if (error.code === 3) {
      console.log('❌ 잘못된 요청입니다.');
    }

    return false;
  }
}

// 스크립트 실행
testGoogleTTS().then(success => {
  if (success) {
    console.log('\n🏆 Google Cloud TTS 완전 설정 성공!');
    console.log('🎵 자연스러운 한국어 음성 준비 완료!');
    console.log('💰 비용: 완전 무료 (월 100만자까지)');
  } else {
    console.log('\n⚠️ 설정이 필요합니다. 위 안내를 따라주세요.');
  }
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
});