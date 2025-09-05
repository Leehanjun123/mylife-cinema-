import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import crypto from 'crypto';

const execAsync = promisify(exec);

class FastVideoGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.tempDir = '/tmp/movies';
    this.cacheDir = '/tmp/cache';
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.log('Directories already exist');
    }
  }

  // 🚀 초고속 스토리 생성 (스트리밍)
  async generateStoryFast(diary, emotion, style) {
    const prompt = `영화 스토리 생성. 매우 간단하게.
일기: ${diary}
감정: ${emotion}

JSON 형식 (2장면만):
{
  "title": "제목",
  "scenes": [
    {"description": "scene description in English", "narration": "한국어 나레이션"}
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 300
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      // Fallback
      return {
        title: diary.substring(0, 20) + "...",
        scenes: [
          {
            description: `A ${emotion} scene with ${style} style`,
            narration: diary.substring(0, 50)
          },
          {
            description: `Ending scene, ${emotion} mood`,
            narration: "그리고 하루가 저물었다."
          }
        ]
      };
    }
  }

  // 🚀 병렬 이미지 생성 (초고속)
  async generateImagesParallel(scenes, style) {
    const styleMap = {
      'realistic': 'photorealistic, cinematic',
      'animation': 'pixar animation style',
      'watercolor': 'watercolor painting',
      'anime': 'anime style, studio ghibli'
    };

    const stylePrompt = styleMap[style] || 'artistic';

    // 모든 이미지를 동시에 생성
    const imagePromises = scenes.map(async (scene, index) => {
      const cacheKey = crypto.createHash('md5').update(scene.description).digest('hex');
      const cachePath = path.join(this.cacheDir, `${cacheKey}.jpg`);

      // 캐시 확인
      try {
        await fs.access(cachePath);
        console.log(`Cache hit for scene ${index + 1}`);
        return cachePath;
      } catch {
        // 캐시 미스 - 생성
      }

      try {
        if (process.env.OPENAI_API_KEY) {
          // DALL-E 2 사용 (더 빠름)
          const response = await this.openai.images.generate({
            model: "dall-e-2",
            prompt: `${scene.description}, ${stylePrompt}`,
            size: "512x512",  // 중간 사이즈로 속도 최적화
            n: 1
          });

          // 이미지 다운로드 및 저장
          const imageUrl = response.data[0].url;
          const imageResponse = await fetch(imageUrl);
          const buffer = await imageResponse.buffer();
          
          // Sharp로 최적화 (JPEG 압축)
          await sharp(buffer)
            .jpeg({ quality: 85 })
            .resize(1280, 720, { fit: 'cover' })
            .toFile(cachePath);

          return cachePath;
        }
      } catch (error) {
        console.error(`Image generation failed for scene ${index + 1}:`, error.message);
      }

      // Fallback: 단색 이미지 생성
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
      const color = colors[index % colors.length];
      
      await sharp({
        create: {
          width: 1280,
          height: 720,
          channels: 3,
          background: color
        }
      })
      .jpeg({ quality: 85 })
      .toFile(cachePath);

      return cachePath;
    });

    return await Promise.all(imagePromises);
  }

  // 🚀 실제 비디오 생성 (FFmpeg)
  async createRealVideo(images, scenes, outputPath) {
    return new Promise(async (resolve, reject) => {
      try {
        const movieId = crypto.randomBytes(8).toString('hex');
        const outputFile = path.join(this.tempDir, `movie_${movieId}.mp4`);

        // 이미지 파일 리스트 생성
        const listFile = path.join(this.tempDir, `list_${movieId}.txt`);
        const fileContent = images.map((img, i) => 
          `file '${img}'\nduration 3`  // 각 이미지 3초
        ).join('\n') + `\nfile '${images[images.length - 1]}'`;  // 마지막 이미지 반복

        await fs.writeFile(listFile, fileContent);

        // FFmpeg 명령어 (초고속 인코딩)
        const ffmpegCommand = `ffmpeg -y \
          -f concat -safe 0 -i ${listFile} \
          -c:v libx264 \
          -preset ultrafast \
          -crf 23 \
          -pix_fmt yuv420p \
          -movflags +faststart \
          -t ${images.length * 3} \
          ${outputFile}`;

        console.log('Executing FFmpeg:', ffmpegCommand);
        
        await execAsync(ffmpegCommand);

        // 파일 읽기
        const videoBuffer = await fs.readFile(outputFile);
        const base64Video = videoBuffer.toString('base64');
        const dataUri = `data:video/mp4;base64,${base64Video}`;

        // 임시 파일 정리
        await fs.unlink(listFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});

        resolve({
          videoUrl: dataUri,  // Base64로 직접 전송
          duration: images.length * 3,
          size: videoBuffer.length
        });

      } catch (error) {
        console.error('FFmpeg error:', error);
        // Don't hide errors - let them bubble up
        reject(new Error(`FFmpeg video generation failed: ${error.message}`));
      }
    });
  }

  // 🚀 스트리밍 TTS (Web Speech API용 데이터 준비)
  async prepareTTS(scenes) {
    // 클라이언트에서 Web Speech API 사용하도록 데이터만 준비
    return scenes.map((scene, index) => ({
      id: index,
      text: scene.narration,
      lang: 'ko-KR',
      rate: 1.0,
      pitch: 1.0
    }));
  }

  // 🚀 메인 파이프라인 (병렬 처리)
  async generateMovieFast(diary, emotion, style, length, userId, progressCallback) {
    const startTime = Date.now();

    try {
      // Step 1: 스토리 생성 시작
      progressCallback({ progress: 10, stage: '스토리 생성 중...', elapsed: 0 });
      const storyPromise = this.generateStoryFast(diary, emotion, style);

      // Step 2: 스토리 완성 대기 (최대 3초)
      const story = await Promise.race([
        storyPromise,
        new Promise((resolve) => setTimeout(() => resolve({
          title: "나의 하루",
          scenes: [
            { description: "Daily life scene", narration: diary.substring(0, 100) },
            { description: "Reflection scene", narration: "오늘도 의미있는 하루였다." }
          ]
        }), 3000))
      ]);

      progressCallback({ 
        progress: 30, 
        stage: '이미지 생성 중...', 
        elapsed: (Date.now() - startTime) / 1000,
        storyReady: true,
        story: story
      });

      // Step 3: 병렬 이미지 생성
      const imagesPromise = this.generateImagesParallel(story.scenes, style);
      const ttsPromise = this.prepareTTS(story.scenes);

      // 병렬 실행
      const [images, ttsData] = await Promise.all([
        imagesPromise,
        ttsPromise
      ]);

      progressCallback({ 
        progress: 70, 
        stage: '비디오 편집 중...', 
        elapsed: (Date.now() - startTime) / 1000,
        imagesReady: true,
        images: images.length
      });

      // Step 4: 비디오 생성
      const video = await this.createRealVideo(images, story.scenes, `movie_${userId}_${Date.now()}.mp4`);

      progressCallback({ 
        progress: 100, 
        stage: '완성!', 
        elapsed: (Date.now() - startTime) / 1000
      });

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ 영화 생성 완료: ${totalTime}초`);

      return {
        title: story.title,
        genre: emotion,
        scenes: story.scenes.map((scene, i) => ({
          ...scene,
          imageUrl: images[i] ? `file://${images[i]}` : null,
          tts: ttsData[i]
        })),
        videoUrl: video.videoUrl,
        duration: video.duration,
        generationTime: totalTime,
        cached: false
      };

    } catch (error) {
      console.error('Fast generation error:', error);
      throw error;
    }
  }
}

export default FastVideoGenerator;