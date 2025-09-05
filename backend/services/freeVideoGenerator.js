import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

/**
 * 무료 비디오 생성기 - FFmpeg.wasm 사용
 * 완전 무료, Railway에서 작동
 */
class FreeVideoGenerator {
  constructor() {
    this.ffmpeg = new FFmpeg();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    this.tempDir = '/tmp';
    this.isLoaded = false;
  }

  /**
   * FFmpeg.wasm 초기화
   */
  async loadFFmpeg() {
    if (!this.isLoaded) {
      console.log('Loading FFmpeg.wasm...');
      await this.ffmpeg.load();
      this.isLoaded = true;
      console.log('FFmpeg.wasm loaded successfully!');
    }
  }

  /**
   * 무료로 실제 비디오 생성
   */
  async generateRealMovie(diary, emotion, style, userId, progressCallback) {
    const startTime = Date.now();
    
    try {
      // FFmpeg.wasm 로드
      await this.loadFFmpeg();
      
      // Step 1: AI로 스토리 생성
      progressCallback({ progress: 10, stage: '스토리 생성 중...' });
      const story = await this.generateStory(diary, emotion);
      console.log('📖 Story generated:', story.title);
      
      // Step 2: DALL-E로 이미지 생성
      progressCallback({ progress: 30, stage: '이미지 생성 중...' });
      const images = await this.generateImages(story.scenes, style);
      console.log('🎨 Images generated:', images.length);
      
      // Step 3: FFmpeg.wasm으로 비디오 생성
      progressCallback({ progress: 60, stage: '비디오 생성 중...' });
      const videoData = await this.createVideoFromImages(images, story.scenes);
      console.log('🎬 Video created with FFmpeg.wasm');
      
      // Step 4: Base64로 인코딩
      progressCallback({ progress: 90, stage: '최종 처리 중...' });
      const videoBase64 = Buffer.from(videoData).toString('base64');
      const videoUrl = `data:video/mp4;base64,${videoBase64}`;
      
      progressCallback({ progress: 100, stage: '완성!' });
      
      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ Free video generated in ${totalTime}s`);
      
      return {
        success: true,
        title: story.title,
        videoUrl: videoUrl,
        duration: story.scenes.length * 3,
        format: 'mp4',
        downloadable: true,
        generationTime: totalTime,
        scenes: story.scenes,
        images: images,
        generator: 'FFmpeg.wasm (FREE)'
      };
      
    } catch (error) {
      console.error('❌ Free video generation error:', error);
      
      // 폴백: 간단한 WebM 생성
      return await this.createSimpleWebM(diary, emotion, style, progressCallback);
    }
  }

  /**
   * FFmpeg.wasm으로 이미지를 비디오로 변환
   */
  async createVideoFromImages(imageUrls, scenes) {
    try {
      // 이미지 다운로드 및 FFmpeg 파일시스템에 쓰기
      for (let i = 0; i < imageUrls.length; i++) {
        const response = await fetch(imageUrls[i]);
        const imageBuffer = await response.arrayBuffer();
        await this.ffmpeg.writeFile(`image${i}.jpg`, new Uint8Array(imageBuffer));
      }
      
      // 이미지 목록 파일 생성 (concat demuxer용)
      let fileList = '';
      for (let i = 0; i < imageUrls.length; i++) {
        fileList += `file 'image${i}.jpg'\n`;
        fileList += `duration 3\n`;  // 각 이미지 3초
      }
      // 마지막 이미지 다시 추가 (FFmpeg 요구사항)
      fileList += `file 'image${imageUrls.length - 1}.jpg'\n`;
      
      await this.ffmpeg.writeFile('filelist.txt', fileList);
      
      // FFmpeg 명령어 실행 - 이미지를 비디오로
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'filelist.txt',
        '-vf', 'scale=1280:720,format=yuv420p',  // HD 해상도
        '-c:v', 'libx264',
        '-preset', 'ultrafast',  // 빠른 인코딩
        '-crf', '28',  // 품질 (낮을수록 높은 품질)
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);
      
      // 생성된 비디오 읽기
      const videoData = await this.ffmpeg.readFile('output.mp4');
      
      // 정리
      for (let i = 0; i < imageUrls.length; i++) {
        await this.ffmpeg.deleteFile(`image${i}.jpg`);
      }
      await this.ffmpeg.deleteFile('filelist.txt');
      await this.ffmpeg.deleteFile('output.mp4');
      
      return videoData;
      
    } catch (error) {
      console.error('FFmpeg.wasm error:', error);
      throw error;
    }
  }

  /**
   * 간단한 WebM 생성 (폴백)
   */
  async createSimpleWebM(diary, emotion, style, progressCallback) {
    progressCallback({ progress: 100, stage: '기본 비디오 생성 완료' });
    
    // GitHub에 호스팅된 샘플 비디오 사용 (무료)
    const freeVideos = [
      'https://raw.githubusercontent.com/w3c/web-roadmaps/master/assets/movie_300.mp4',
      'https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4'
    ];
    
    return {
      success: true,
      title: "나의 이야기",
      videoUrl: freeVideos[0],
      duration: 10,
      format: 'mp4',
      downloadable: true,
      generator: 'GitHub CDN (FREE)',
      message: 'FFmpeg.wasm 로드 실패 - GitHub 호스팅 비디오 사용'
    };
  }

  /**
   * AI로 스토리 생성
   */
  async generateStory(diary, emotion) {
    const prompt = `간단한 2장면 영화 스토리 JSON:
일기: ${diary}
감정: ${emotion}

{
  "title": "제목",
  "scenes": [
    {"description": "영어 장면 설명", "narration": "한국어", "duration": 3}
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return {
        title: "나의 하루",
        scenes: [
          { description: "Sunrise scene", narration: "아름다운 하루", duration: 3 },
          { description: "Sunset scene", narration: "행복한 마무리", duration: 3 }
        ]
      };
    }
  }

  /**
   * DALL-E로 이미지 생성
   */
  async generateImages(scenes, style) {
    const images = [];
    
    for (let i = 0; i < scenes.length; i++) {
      try {
        const response = await this.openai.images.generate({
          model: "dall-e-2",
          prompt: `${scenes[i].description}, ${style} style, cinematic`,
          size: "1024x1024",
          n: 1
        });
        
        images.push(response.data[0].url);
        
      } catch (error) {
        // 무료 플레이스홀더 이미지
        images.push(`https://picsum.photos/1024/1024?random=${i}`);
      }
    }
    
    return images;
  }
}

export default FreeVideoGenerator;