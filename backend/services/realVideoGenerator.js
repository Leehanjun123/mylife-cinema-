import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * REAL Video Generator - 진짜 동영상 생성
 * FFmpeg를 사용해서 실제 MP4 파일 생성
 */
class RealVideoGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.tempDir = '/tmp/movies';
    this.outputDir = '/tmp/outputs';
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.log('Directories initialized');
    }
  }

  /**
   * 진짜 동영상 생성 - 이미지를 MP4로 변환
   */
  async generateRealMovie(diary, emotion, style, userId, progressCallback) {
    const startTime = Date.now();
    const movieId = `movie_${Date.now()}`;
    
    try {
      // Step 1: AI로 스토리 생성
      progressCallback({ progress: 10, stage: '스토리 생성 중...' });
      const story = await this.generateStory(diary, emotion);
      console.log('📖 Story generated:', story.title);
      
      // Step 2: DALL-E로 이미지 생성
      progressCallback({ progress: 30, stage: '이미지 생성 중...' });
      const imagePaths = await this.generateAndSaveImages(story.scenes, style, movieId);
      console.log('🎨 Images generated:', imagePaths.length);
      
      // Step 3: 이미지를 동영상으로 변환 (FFmpeg)
      progressCallback({ progress: 70, stage: '영상 편집 중...' });
      const videoPath = await this.createVideoFromImages(imagePaths, movieId);
      console.log('🎬 Video created:', videoPath);
      
      // Step 4: Base64로 인코딩해서 전송
      progressCallback({ progress: 90, stage: '최종 처리 중...' });
      const videoBase64 = await this.encodeVideoToBase64(videoPath);
      
      progressCallback({ progress: 100, stage: '완성!' });
      
      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ Real video generated in ${totalTime}s`);
      
      // Clean up temp files
      await this.cleanup(movieId);
      
      return {
        success: true,
        title: story.title,
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        duration: story.scenes.length * 3,
        format: 'mp4',
        downloadable: true,
        generationTime: totalTime,
        scenes: story.scenes
      };
      
    } catch (error) {
      console.error('❌ Real video generation error:', error);
      
      // 에러 시 슬라이드쇼로 폴백
      return await this.generateSlideshow(diary, emotion, style, progressCallback);
    }
  }

  /**
   * AI로 스토리 생성
   */
  async generateStory(diary, emotion) {
    const prompt = `한국어 영화를 만들어주세요.
일기: ${diary}
감정: ${emotion}

3개 장면의 영화 스토리를 JSON으로:
{
  "title": "영화 제목",
  "scenes": [
    {
      "description": "장면 설명 (영어로, DALL-E용)",
      "narration": "한국어 내레이션",
      "duration": 3
    }
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Story generation failed:', error);
      // 기본 스토리 반환
      return {
        title: "나의 하루",
        scenes: [
          {
            description: "A peaceful morning sunrise over mountains",
            narration: "새로운 하루가 시작되었습니다.",
            duration: 3
          },
          {
            description: "A person writing in diary at cozy cafe",
            narration: diary || "오늘은 특별한 하루였습니다.",
            duration: 3
          },
          {
            description: "Beautiful sunset with hopeful sky",
            narration: "내일은 더 좋은 날이 될 거예요.",
            duration: 3
          }
        ]
      };
    }
  }

  /**
   * DALL-E로 이미지 생성 후 저장
   */
  async generateAndSaveImages(scenes, style, movieId) {
    const imagePaths = [];
    
    for (let i = 0; i < scenes.length; i++) {
      try {
        // DALL-E 이미지 생성
        const response = await this.openai.images.generate({
          model: "dall-e-2",
          prompt: `${scenes[i].description}, ${style} style, cinematic, high quality`,
          size: "1024x1024",
          n: 1
        });
        
        const imageUrl = response.data[0].url;
        
        // 이미지 다운로드 및 저장
        const imagePath = path.join(this.tempDir, `${movieId}_scene_${i}.jpg`);
        await this.downloadImage(imageUrl, imagePath);
        imagePaths.push(imagePath);
        
        console.log(`Image ${i + 1} saved:`, imagePath);
        
      } catch (error) {
        console.error(`Image generation failed for scene ${i}:`, error);
        
        // 실패 시 기본 이미지 생성
        const placeholderPath = await this.createPlaceholderImage(i, movieId, scenes[i].narration);
        imagePaths.push(placeholderPath);
      }
    }
    
    return imagePaths;
  }

  /**
   * 이미지 다운로드
   */
  async downloadImage(url, filepath) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    await fs.writeFile(filepath, buffer);
  }

  /**
   * FFmpeg로 이미지를 동영상으로 변환
   */
  async createVideoFromImages(imagePaths, movieId) {
    const outputPath = path.join(this.outputDir, `${movieId}.mp4`);
    
    // 이미지 목록 파일 생성
    const listPath = path.join(this.tempDir, `${movieId}_list.txt`);
    const listContent = imagePaths.map((img, i) => 
      `file '${img}'\nduration 3`
    ).join('\n');
    await fs.writeFile(listPath, listContent);
    
    // FFmpeg 명령어 실행
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${listPath}" \
      -vf "scale=1280:720,format=yuv420p" \
      -c:v libx264 -preset faster -crf 23 \
      -movflags +faststart \
      -y "${outputPath}" 2>&1`;
    
    try {
      console.log('Running FFmpeg...');
      const { stdout, stderr } = await execAsync(ffmpegCmd);
      console.log('FFmpeg output:', stdout);
      
      // 파일 크기 확인
      const stats = await fs.stat(outputPath);
      console.log(`Video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return outputPath;
    } catch (error) {
      console.error('FFmpeg error:', error);
      throw error;
    }
  }

  /**
   * 비디오를 Base64로 인코딩
   */
  async encodeVideoToBase64(videoPath) {
    try {
      const videoBuffer = await fs.readFile(videoPath);
      return videoBuffer.toString('base64');
    } catch (error) {
      console.error('Video encoding error:', error);
      throw error;
    }
  }

  /**
   * 기본 이미지 생성 (DALL-E 실패 시)
   */
  async createPlaceholderImage(index, movieId, text) {
    const colors = ['#667eea', '#f56565', '#48bb78'];
    const color = colors[index % colors.length];
    
    // SVG로 간단한 이미지 생성
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="${color}"/>
        <text x="512" y="512" font-size="48" fill="white" text-anchor="middle">
          Scene ${index + 1}
        </text>
        <text x="512" y="580" font-size="32" fill="white" text-anchor="middle">
          ${text ? text.substring(0, 30) : 'MyLife Cinema'}
        </text>
      </svg>
    `;
    
    const imagePath = path.join(this.tempDir, `${movieId}_placeholder_${index}.svg`);
    await fs.writeFile(imagePath, svg);
    
    // SVG를 JPG로 변환
    const jpgPath = path.join(this.tempDir, `${movieId}_placeholder_${index}.jpg`);
    try {
      await execAsync(`convert "${imagePath}" "${jpgPath}"`);
      return jpgPath;
    } catch (error) {
      // ImageMagick이 없으면 SVG 그대로 사용
      return imagePath;
    }
  }

  /**
   * 슬라이드쇼 폴백 (비디오 생성 실패 시)
   */
  async generateSlideshow(diary, emotion, style, progressCallback) {
    progressCallback({ progress: 100, stage: '슬라이드쇼 생성 완료' });
    
    // 간단한 슬라이드쇼 데이터 반환
    return {
      success: true,
      title: "나의 이야기",
      type: 'slideshow',
      slides: [
        {
          image: 'data:image/svg+xml;base64,' + Buffer.from(`
            <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
              <rect width="1280" height="720" fill="#667eea"/>
              <text x="640" y="360" font-size="60" fill="white" text-anchor="middle">
                ${diary ? diary.substring(0, 50) : 'MyLife Cinema'}
              </text>
            </svg>
          `).toString('base64'),
          duration: 3
        }
      ],
      duration: 9,
      format: 'slideshow',
      message: 'FFmpeg가 없어서 슬라이드쇼로 생성되었습니다.'
    };
  }

  /**
   * 임시 파일 정리
   */
  async cleanup(movieId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const movieFiles = files.filter(f => f.includes(movieId));
      
      for (const file of movieFiles) {
        await fs.unlink(path.join(this.tempDir, file));
      }
      
      console.log('Cleaned up temp files for:', movieId);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default RealVideoGenerator;