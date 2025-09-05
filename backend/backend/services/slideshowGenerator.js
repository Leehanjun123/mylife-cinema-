import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class SlideshowGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.outputDir = '/tmp/movies';
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.log('Directory exists');
    }
  }

  // 간단한 스토리 생성
  async generateSimpleStory(diary, emotion) {
    const prompt = `매우 간단한 2장면 영화.
일기: ${diary}
감정: ${emotion}

JSON:
{
  "title": "제목",
  "scenes": [
    {"image": "visual description for DALL-E", "text": "나레이션"}
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
          {
            image: `A ${emotion} daily life scene, warm colors`,
            text: diary.substring(0, 50)
          },
          {
            image: `Peaceful ending scene, ${emotion} mood`,
            text: "오늘도 의미있는 하루였습니다."
          }
        ]
      };
    }
  }

  // 안정적인 이미지 생성
  async generateSafeImages(scenes) {
    const images = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      try {
        if (process.env.OPENAI_API_KEY) {
          // DALL-E 2로 작은 이미지 생성
          const response = await this.openai.images.generate({
            model: "dall-e-2",
            prompt: scene.image + ", high quality, beautiful",
            size: "256x256",
            n: 1
          });

          const imageUrl = response.data[0].url;
          
          // 이미지 다운로드
          const imageResponse = await fetch(imageUrl);
          const buffer = await imageResponse.buffer();
          
          // JPEG으로 압축 (크기 감소)
          const optimized = await sharp(buffer)
            .resize(800, 600, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
          
          // Base64 인코딩
          const base64 = optimized.toString('base64');
          images.push({
            id: i,
            url: `data:image/jpeg;base64,${base64}`,
            text: scene.text
          });
        } else {
          // 그라디언트 이미지 생성 (폴백)
          const colors = [
            { r: 255, g: 107, b: 107 },
            { r: 78, g: 205, b: 196 },
            { r: 69, g: 183, b: 209 },
            { r: 150, g: 206, b: 180 }
          ];
          
          const color = colors[i % colors.length];
          
          const svg = `
            <svg width="800" height="600">
              <defs>
                <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(${color.r},${color.g},${color.b});stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(${color.r/2},${color.g/2},${color.b/2});stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="800" height="600" fill="url(#grad${i})" />
              <text x="400" y="300" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
                Scene ${i + 1}
              </text>
            </svg>
          `;
          
          const buffer = await sharp(Buffer.from(svg))
            .jpeg({ quality: 80 })
            .toBuffer();
          
          const base64 = buffer.toString('base64');
          images.push({
            id: i,
            url: `data:image/jpeg;base64,${base64}`,
            text: scene.text
          });
        }
      } catch (error) {
        console.error(`Image generation failed for scene ${i}:`, error.message);
        
        // 에러 시 단순 색상 이미지
        const errorImage = await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: 100, g: 100, b: 100 }
          }
        })
        .jpeg({ quality: 70 })
        .toBuffer();
        
        images.push({
          id: i,
          url: `data:image/jpeg;base64,${errorImage.toString('base64')}`,
          text: scene.text
        });
      }
    }
    
    return images;
  }

  // HTML5 비디오 대신 슬라이드쇼 데이터
  async createSlideshow(images, title) {
    return {
      type: 'slideshow',
      title: title,
      slides: images.map((img, i) => ({
        id: i,
        image: img.url,
        text: img.text,
        duration: 3000,  // 3초
        transition: 'fade'
      })),
      totalDuration: images.length * 3,
      format: 'web-slideshow',
      autoplay: true
    };
  }

  // 메인 파이프라인
  async generateMovie(diary, emotion, style, userId, progressCallback) {
    const startTime = Date.now();

    try {
      // 1. 스토리 생성 (2초)
      progressCallback({ progress: 20, stage: '스토리 생성 중...' });
      const story = await this.generateSimpleStory(diary, emotion);

      // 2. 이미지 생성 (5초)
      progressCallback({ progress: 50, stage: '이미지 생성 중...' });
      const images = await this.generateSafeImages(story.scenes);

      // 3. 슬라이드쇼 생성 (1초)
      progressCallback({ progress: 80, stage: '영화 편집 중...' });
      const slideshow = await this.createSlideshow(images, story.title);

      // 4. 완성
      progressCallback({ progress: 100, stage: '완성!' });

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ 슬라이드쇼 생성 완료: ${totalTime}초`);

      return {
        success: true,
        title: story.title,
        type: 'slideshow',
        data: slideshow,
        generationTime: totalTime,
        
        // 하위 호환성
        videoUrl: null,
        scenes: story.scenes,
        images: images
      };

    } catch (error) {
      console.error('Slideshow generation error:', error);
      
      // 폴백: 정적 이미지
      return {
        success: true,
        title: '나의 이야기',
        type: 'static',
        data: {
          image: 'data:image/svg+xml;base64,' + Buffer.from(`
            <svg width="800" height="600">
              <rect width="800" height="600" fill="#667eea"/>
              <text x="400" y="300" font-family="Arial" font-size="32" fill="white" text-anchor="middle">
                ${diary.substring(0, 30)}...
              </text>
            </svg>
          `).toString('base64')
        },
        generationTime: 1
      };
    }
  }
}

export default SlideshowGenerator;