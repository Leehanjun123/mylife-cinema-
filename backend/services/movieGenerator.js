import OpenAI from 'openai';
import Replicate from 'replicate';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class MovieGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN || ''
    });
  }

  // 1. 일기에서 스토리 생성
  async generateStory(diary, emotion, style) {
    try {
      const prompt = `
당신은 감성적인 영화 시나리오 작가입니다.
사용자의 일기를 바탕으로 ${emotion} 감정의 짧은 영화 스토리를 만들어주세요.

일기 내용: "${diary}"
감정: ${emotion}
스타일: ${style}

다음 형식으로 4개의 장면을 만들어주세요:
1. 각 장면은 15초 분량
2. 시각적 묘사와 나레이션 포함
3. 감정이 잘 드러나도록 작성

JSON 형식으로 응답하세요:
{
  "title": "영화 제목",
  "genre": "장르",
  "scenes": [
    {
      "sceneNumber": 1,
      "visualDescription": "장면의 시각적 묘사 (영어)",
      "narration": "나레이션 텍스트 (한국어)",
      "emotion": "장면의 주요 감정",
      "duration": 15
    }
  ]
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1500
      });

      const story = JSON.parse(completion.choices[0].message.content);
      console.log('Generated story:', story);
      return story;
    } catch (error) {
      console.error('Story generation error:', error);
      // Fallback story
      return {
        title: diary.substring(0, 30) + "...",
        genre: emotion,
        scenes: [
          {
            sceneNumber: 1,
            visualDescription: "A peaceful scene with soft lighting",
            narration: "오늘의 이야기가 시작됩니다.",
            emotion: emotion,
            duration: 15
          },
          {
            sceneNumber: 2,
            visualDescription: "The main moment of the day",
            narration: diary.substring(0, 100),
            emotion: emotion,
            duration: 15
          },
          {
            sceneNumber: 3,
            visualDescription: "Reflection and contemplation",
            narration: "이런 순간들이 우리의 삶을 만들어갑니다.",
            emotion: emotion,
            duration: 15
          },
          {
            sceneNumber: 4,
            visualDescription: "Peaceful ending scene",
            narration: "오늘도 특별한 하루였습니다.",
            emotion: emotion,
            duration: 15
          }
        ]
      };
    }
  }

  // 2. 장면별 이미지 생성
  async generateImages(scenes, style) {
    const images = [];
    
    for (const scene of scenes) {
      try {
        // Style mapping
        const stylePrompts = {
          'realistic': 'photorealistic, 8k, high quality',
          'animation': 'pixar style animation, 3d render',
          'watercolor': 'watercolor painting, artistic',
          'oil': 'oil painting, classical art style',
          'sketch': 'pencil sketch, black and white drawing',
          'anime': 'anime style, studio ghibli'
        };

        const styleModifier = stylePrompts[style] || stylePrompts['realistic'];
        const prompt = `${scene.visualDescription}, ${styleModifier}, cinematic lighting, beautiful composition`;

        console.log(`Generating image for scene ${scene.sceneNumber}: ${prompt}`);

        // Option 1: OpenAI DALL-E (if API key available)
        if (process.env.OPENAI_API_KEY) {
          try {
            const response = await this.openai.images.generate({
              model: "dall-e-3",
              prompt: prompt,
              size: "1792x1024",
              quality: "standard",
              n: 1,
            });
            
            images.push({
              sceneNumber: scene.sceneNumber,
              url: response.data[0].url,
              prompt: prompt
            });
            continue;
          } catch (error) {
            console.log('DALL-E failed, trying Replicate...');
          }
        }

        // Option 2: Replicate (Stable Diffusion)
        if (process.env.REPLICATE_API_TOKEN) {
          try {
            const output = await this.replicate.run(
              "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
              {
                input: {
                  prompt: prompt,
                  width: 1024,
                  height: 576,
                  num_outputs: 1
                }
              }
            );
            
            images.push({
              sceneNumber: scene.sceneNumber,
              url: output[0],
              prompt: prompt
            });
            continue;
          } catch (error) {
            console.log('Replicate failed, using placeholder...');
          }
        }

        // Fallback: Use placeholder
        images.push({
          sceneNumber: scene.sceneNumber,
          url: '/movie-placeholder.jpg',
          prompt: prompt
        });

      } catch (error) {
        console.error(`Image generation error for scene ${scene.sceneNumber}:`, error);
        images.push({
          sceneNumber: scene.sceneNumber,
          url: '/movie-placeholder.jpg',
          prompt: scene.visualDescription
        });
      }
    }

    return images;
  }

  // 3. 나레이션 음성 생성
  async generateNarration(scenes) {
    const audioFiles = [];
    
    for (const scene of scenes) {
      try {
        // Simple TTS using Web Speech API (frontend will handle)
        // For backend, we'll prepare the data structure
        audioFiles.push({
          sceneNumber: scene.sceneNumber,
          text: scene.narration,
          duration: scene.duration
        });
      } catch (error) {
        console.error(`Narration generation error for scene ${scene.sceneNumber}:`, error);
      }
    }

    return audioFiles;
  }

  // 4. 비디오 합성 (간단한 버전)
  async createVideo(images, narrations, outputPath) {
    try {
      // For now, return a placeholder video URL
      // Real implementation would use FFmpeg to combine images and audio
      console.log('Video synthesis would happen here with:', {
        imageCount: images.length,
        narrationCount: narrations.length,
        outputPath
      });

      // In production, you would:
      // 1. Download images
      // 2. Generate audio files
      // 3. Use FFmpeg to create video
      // 4. Upload to cloud storage
      // 5. Return the video URL

      return {
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 60,
        size: '1920x1080'
      };
    } catch (error) {
      console.error('Video creation error:', error);
      throw error;
    }
  }

  // Main generation pipeline
  async generateMovie(diary, emotion, style, length, userId, progressCallback) {
    try {
      // Step 1: Generate story
      progressCallback({ progress: 20, stage: '스토리 생성 중...' });
      const story = await this.generateStory(diary, emotion, style);

      // Step 2: Generate images
      progressCallback({ progress: 40, stage: '이미지 생성 중...' });
      const images = await this.generateImages(story.scenes, style);

      // Step 3: Generate narration
      progressCallback({ progress: 60, stage: '나레이션 생성 중...' });
      const narrations = await this.generateNarration(story.scenes);

      // Step 4: Create video
      progressCallback({ progress: 80, stage: '영상 편집 중...' });
      const video = await this.createVideo(images, narrations, `movie_${userId}_${Date.now()}.mp4`);

      // Step 5: Complete
      progressCallback({ progress: 100, stage: '완성!' });

      return {
        title: story.title,
        genre: story.genre,
        scenes: story.scenes.map((scene, index) => ({
          ...scene,
          imageUrl: images[index]?.url,
          narration: narrations[index]?.text
        })),
        videoUrl: video.videoUrl,
        duration: video.duration,
        images: images,
        narrations: narrations
      };
    } catch (error) {
      console.error('Movie generation pipeline error:', error);
      throw error;
    }
  }
}

export default MovieGenerator;