import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class FreeVoiceService {
  constructor() {
    this.tempDir = process.env.TEMP_DIR || './temp';
  }

  /**
   * 브라우저 TTS를 위한 음성 설정 생성
   */
  getBrowserTTSConfig(language = 'ko-KR') {
    return {
      // 한국어 음성 설정
      korean: {
        lang: 'ko-KR',
        voice: 'ko-KR-Standard-A',
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8
      },
      // 영어 음성 설정
      english: {
        lang: 'en-US',
        voice: 'en-US-Standard-C',
        rate: 0.9,
        pitch: 1.1,
        volume: 0.8
      },
      // 일본어 음성 설정 (선택사항)
      japanese: {
        lang: 'ja-JP',
        voice: 'ja-JP-Standard-A',
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8
      }
    };
  }

  /**
   * 씬별 나레이션 텍스트 생성
   */
  async generateNarrationText(sceneData, language = 'korean') {
    try {
      logger.info(`Generating narration for scene ${sceneData.sceneNumber}`);

      const narrationTemplates = {
        korean: {
          opening: "오늘의 이야기가 시작됩니다.",
          scene: (description) => `${description}`,
          transition: "그리고 이어지는 순간...",
          ending: "소중한 하루의 기억이 영화가 되었습니다."
        },
        english: {
          opening: "Today's story begins.",
          scene: (description) => `${description}`,
          transition: "And then...",
          ending: "Your precious memories have become a movie."
        }
      };

      const template = narrationTemplates[language] || narrationTemplates.korean;
      
      let narrationText = '';
      
      if (sceneData.sceneNumber === 1) {
        narrationText += template.opening + ' ';
      }
      
      narrationText += template.scene(sceneData.description);
      
      if (sceneData.sceneNumber < sceneData.totalScenes) {
        narrationText += ' ' + template.transition;
      } else {
        narrationText += ' ' + template.ending;
      }

      return {
        text: narrationText.trim(),
        config: this.getBrowserTTSConfig(language)[language] || this.getBrowserTTSConfig().korean,
        duration: Math.ceil(narrationText.length / 10) // 대략적인 음성 길이 (초)
      };

    } catch (error) {
      logger.error('Narration text generation error:', error);
      throw error;
    }
  }

  /**
   * 영화 전체 나레이션 스크립트 생성
   */
  async generateMovieNarration(movieData, language = 'korean') {
    try {
      logger.info(`Generating movie narration for ${movieData.scenes.length} scenes`);

      const narrationScripts = [];
      
      for (let i = 0; i < movieData.scenes.length; i++) {
        const scene = movieData.scenes[i];
        const sceneWithTotal = {
          ...scene,
          totalScenes: movieData.scenes.length
        };

        const narration = await this.generateNarrationText(sceneWithTotal, language);
        
        narrationScripts.push({
          sceneNumber: scene.sceneNumber,
          ...narration,
          startTime: i * 4, // 각 씬이 4초라고 가정
          endTime: (i + 1) * 4
        });
      }

      return {
        scripts: narrationScripts,
        totalDuration: narrationScripts.reduce((sum, script) => sum + script.duration, 0),
        language: language,
        movieTitle: movieData.title || '나의 영화'
      };

    } catch (error) {
      logger.error('Movie narration generation error:', error);
      throw error;
    }
  }

  /**
   * 프론트엔드용 TTS 설정 및 스크립트 제공
   */
  async getTTSConfigForFrontend(movieData, options = {}) {
    try {
      const language = options.language || 'korean';
      const narration = await this.generateMovieNarration(movieData, language);

      // 프론트엔드에서 사용할 TTS 설정
      const frontendConfig = {
        // 기본 TTS 설정
        speechSynthesis: {
          rate: narration.scripts[0]?.config.rate || 1.0,
          pitch: narration.scripts[0]?.config.pitch || 1.0,
          volume: narration.scripts[0]?.config.volume || 0.8,
          lang: narration.scripts[0]?.config.lang || 'ko-KR'
        },

        // 씬별 나레이션 스크립트
        narrationScripts: narration.scripts.map(script => ({
          sceneNumber: script.sceneNumber,
          text: script.text,
          startTime: script.startTime,
          duration: script.duration,
          config: script.config
        })),

        // 사용 방법 가이드
        usage: {
          javascript: `
// 브라우저에서 사용 방법
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance(script.text);
utterance.rate = ${narration.scripts[0]?.config.rate || 1.0};
utterance.pitch = ${narration.scripts[0]?.config.pitch || 1.0};
utterance.volume = ${narration.scripts[0]?.config.volume || 0.8};
utterance.lang = '${narration.scripts[0]?.config.lang || 'ko-KR'}';
synth.speak(utterance);
          `.trim()
        },

        // 대체 음성 옵션
        alternatives: this.getBrowserTTSConfig(),
        
        // 메타데이터
        metadata: {
          totalScenes: narration.scripts.length,
          totalDuration: narration.totalDuration,
          language: language,
          service: 'browser-tts',
          cost: 0
        }
      };

      logger.info(`Frontend TTS config generated for ${frontendConfig.narrationScripts.length} scenes`);
      return frontendConfig;

    } catch (error) {
      logger.error('Frontend TTS config generation error:', error);
      throw error;
    }
  }

  /**
   * 음성 품질 및 언어 지원 확인
   */
  async checkTTSSupport() {
    // 이 함수는 주로 프론트엔드에서 실행되지만, 
    // 백엔드에서는 지원 정보만 제공
    return {
      browserSupport: {
        chrome: { supported: true, quality: 'excellent', languages: ['ko-KR', 'en-US', 'ja-JP'] },
        safari: { supported: true, quality: 'good', languages: ['ko-KR', 'en-US'] },
        firefox: { supported: true, quality: 'good', languages: ['ko-KR', 'en-US'] },
        edge: { supported: true, quality: 'excellent', languages: ['ko-KR', 'en-US', 'ja-JP'] }
      },
      
      recommendedSettings: {
        korean: { rate: 1.0, pitch: 1.0, volume: 0.8 },
        english: { rate: 0.9, pitch: 1.1, volume: 0.8 },
        japanese: { rate: 1.0, pitch: 1.0, volume: 0.8 }
      },

      features: {
        cost: '완전 무료',
        quality: '높음',
        languages: '50+ 언어 지원',
        realtime: '즉시 재생',
        offline: '인터넷 연결 필요없음'
      },

      limitations: {
        maxLength: '약 32,000자 (브라우저별 상이)',
        voices: '시스템 음성 사용',
        customization: '제한적',
        recording: '직접 녹음 불가 (실시간만 가능)'
      }
    };
  }
}

export default new FreeVoiceService();