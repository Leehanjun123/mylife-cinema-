#!/usr/bin/env node

// 브라우저 TTS 음성 서비스 테스트
import freeVoiceService from './src/services/freeVoiceService.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testBrowserTTS() {
  console.log('🎤 브라우저 TTS 음성 서비스 테스트');
  console.log('=================================');

  try {
    // 1. TTS 지원 정보 확인
    console.log('\n1. 🔍 TTS 지원 정보 확인...');
    
    const supportInfo = await freeVoiceService.checkTTSSupport();
    
    console.log('✅ 브라우저 지원 현황:');
    Object.entries(supportInfo.browserSupport).forEach(([browser, info]) => {
      console.log(`   ${browser}: ${info.supported ? '✅' : '❌'} (품질: ${info.quality})`);
    });

    console.log('\n💡 특징:');
    Object.entries(supportInfo.features).forEach(([feature, value]) => {
      console.log(`   ${feature}: ${value}`);
    });

    // 2. 테스트 영화 데이터 생성
    console.log('\n2. 🎬 테스트 영화 데이터 생성...');
    
    const testMovieData = {
      title: '친구와의 소중한 시간',
      scenes: [
        {
          sceneNumber: 1,
          description: '홍대 카페에서 친구 민지와 만났습니다. 처음엔 어색했지만 점점 편해졌어요.',
          duration: 4
        },
        {
          sceneNumber: 2,
          description: '민지가 새 직장 이야기를 해줄 때 정말 행복해 보였습니다.',
          duration: 4
        },
        {
          sceneNumber: 3,
          description: '함께 파스타를 먹으며 진솔한 대화를 나눴습니다.',
          duration: 4
        }
      ]
    };

    console.log(`✅ 테스트 영화: "${testMovieData.title}" (${testMovieData.scenes.length}개 씬)`);

    // 3. 씬별 나레이션 텍스트 생성
    console.log('\n3. 📝 나레이션 텍스트 생성...');
    
    for (const scene of testMovieData.scenes) {
      const sceneWithTotal = { ...scene, totalScenes: testMovieData.scenes.length };
      const narration = await freeVoiceService.generateNarrationText(sceneWithTotal, 'korean');
      
      console.log(`\n   씬 ${scene.sceneNumber}:`);
      console.log(`   📖 "${narration.text}"`);
      console.log(`   ⏱️ 예상 길이: ${narration.duration}초`);
      console.log(`   🔧 설정: ${narration.config.lang}, 속도: ${narration.config.rate}`);
    }

    // 4. 전체 영화 나레이션 스크립트 생성
    console.log('\n4. 🎭 전체 영화 나레이션 생성...');
    
    const fullNarration = await freeVoiceService.generateMovieNarration(testMovieData, 'korean');
    
    console.log(`✅ 전체 나레이션 생성 완료`);
    console.log(`📊 총 ${fullNarration.scripts.length}개 스크립트`);
    console.log(`⏱️ 총 예상 길이: ${fullNarration.totalDuration}초`);
    console.log(`🗣️ 언어: ${fullNarration.language}`);

    // 5. 프론트엔드용 TTS 설정 생성
    console.log('\n5. 💻 프론트엔드 TTS 설정 생성...');
    
    const frontendConfig = await freeVoiceService.getTTSConfigForFrontend(testMovieData, {
      language: 'korean'
    });

    console.log('✅ 프론트엔드 설정 생성 완료');
    console.log(`🎚️ TTS 설정: 속도 ${frontendConfig.speechSynthesis.rate}, 음높이 ${frontendConfig.speechSynthesis.pitch}`);
    console.log(`💬 언어: ${frontendConfig.speechSynthesis.lang}`);
    
    // 6. HTML 테스트 파일 생성
    console.log('\n6. 📄 HTML 테스트 파일 생성...');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyLife Cinema - TTS 테스트</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .scene { background: #2d3748; padding: 20px; margin: 10px 0; border-radius: 8px; }
        button { background: #4299e1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #3182ce; }
        button:disabled { background: #666; cursor: not-allowed; }
        .controls { text-align: center; margin: 20px 0; }
        .script-text { background: #1a202c; padding: 15px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 MyLife Cinema - TTS 음성 테스트</h1>
        <p>브라우저 내장 TTS를 사용한 무료 음성 나레이션 테스트입니다.</p>
        
        <div class="controls">
            <button onclick="playAllScenes()">🎭 전체 재생</button>
            <button onclick="stopSpeech()">⏹️ 정지</button>
            <button onclick="testVoices()">🎤 음성 목록</button>
        </div>

        <div id="scenes">
            ${frontendConfig.narrationScripts.map(script => `
                <div class="scene">
                    <h3>씬 ${script.sceneNumber}</h3>
                    <div class="script-text">"${script.text}"</div>
                    <button onclick="playScene(${script.sceneNumber}, '${script.text.replace(/'/g, "\\'")}')">
                        🔊 씬 ${script.sceneNumber} 재생
                    </button>
                    <small>예상 길이: ${script.duration}초</small>
                </div>
            `).join('')}
        </div>

        <div id="voice-list" style="margin-top: 20px;"></div>
    </div>

    <script>
        // TTS 설정
        const ttsConfig = ${JSON.stringify(frontendConfig.speechSynthesis, null, 2)};
        
        let currentUtterance = null;
        let synth = window.speechSynthesis;

        // 개별 씬 재생
        function playScene(sceneNumber, text) {
            stopSpeech();
            
            currentUtterance = new SpeechSynthesisUtterance(text);
            currentUtterance.rate = ttsConfig.rate;
            currentUtterance.pitch = ttsConfig.pitch;
            currentUtterance.volume = ttsConfig.volume;
            currentUtterance.lang = ttsConfig.lang;
            
            currentUtterance.onstart = () => {
                console.log('씬 ' + sceneNumber + ' 재생 시작');
            };
            
            currentUtterance.onend = () => {
                console.log('씬 ' + sceneNumber + ' 재생 완료');
            };
            
            synth.speak(currentUtterance);
        }

        // 전체 씬 순차 재생
        async function playAllScenes() {
            const scripts = ${JSON.stringify(frontendConfig.narrationScripts)};
            stopSpeech();
            
            for (let i = 0; i < scripts.length; i++) {
                await new Promise((resolve) => {
                    const utterance = new SpeechSynthesisUtterance(scripts[i].text);
                    utterance.rate = ttsConfig.rate;
                    utterance.pitch = ttsConfig.pitch;
                    utterance.volume = ttsConfig.volume;
                    utterance.lang = ttsConfig.lang;
                    
                    utterance.onend = resolve;
                    synth.speak(utterance);
                });
                
                // 씬 간 1초 대기
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 음성 정지
        function stopSpeech() {
            if (synth.speaking) {
                synth.cancel();
            }
        }

        // 사용 가능한 음성 목록 확인
        function testVoices() {
            const voices = synth.getVoices();
            const voiceList = document.getElementById('voice-list');
            
            const koreanVoices = voices.filter(voice => voice.lang.includes('ko'));
            const englishVoices = voices.filter(voice => voice.lang.includes('en-US'));
            
            voiceList.innerHTML = \`
                <h3>🎤 사용 가능한 음성</h3>
                <h4>한국어 음성 (\${koreanVoices.length}개)</h4>
                <ul>\${koreanVoices.map(voice => \`<li>\${voice.name} (\${voice.lang})</li>\`).join('')}</ul>
                <h4>영어 음성 (\${englishVoices.length}개)</h4>
                <ul>\${englishVoices.map(voice => \`<li>\${voice.name} (\${voice.lang})</li>\`).join('')}</ul>
                <p>총 \${voices.length}개 음성 사용 가능</p>
            \`;
        }

        // 페이지 로드시 음성 목록 로드
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = testVoices;
        }

        // 초기 음성 목록 로드
        setTimeout(testVoices, 100);
    </script>
</body>
</html>
    `;

    await fs.writeFile('./test-tts.html', htmlContent);
    console.log('✅ HTML 테스트 파일 생성: test-tts.html');

    // 7. 결과 요약
    console.log('\n🎉 브라우저 TTS 설정 완료!');
    console.log('===============================');
    console.log('✅ 나레이션 스크립트: 생성됨');
    console.log('✅ TTS 설정: 최적화됨');
    console.log('✅ 프론트엔드 연동: 준비됨');
    console.log('✅ HTML 테스트: 파일 생성됨');
    
    console.log('\n💡 테스트 방법:');
    console.log('1. test-tts.html 파일을 브라우저에서 열기');
    console.log('2. "전체 재생" 또는 개별 씬 재생 버튼 클릭');
    console.log('3. 음성이 나오는지 확인');

    console.log('\n🚀 MyLife Cinema 음성 나레이션 준비 완료!');
    console.log('💰 비용: 완전 무료');
    console.log('🎤 품질: 높음 (브라우저별 상이)');
    console.log('🌍 언어: 한국어, 영어, 일본어 등 지원');

    return true;

  } catch (error) {
    console.error('❌ TTS 테스트 실패:', error.message);
    return false;
  }
}

// 스크립트 실행
testBrowserTTS().then(success => {
  if (success) {
    console.log('\n🏆 브라우저 TTS 설정 완료!');
    console.log('🎵 MyLife Cinema 음성 나레이션 시스템 준비됨!');
  } else {
    console.log('\n⚠️ TTS 설정에서 문제가 발생했습니다.');
  }
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
});