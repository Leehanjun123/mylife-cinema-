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

class RailwayVideoGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.tempDir = '/tmp/movies';
    this.cacheDir = '/tmp/cache';
    this.initDirectories();
    
    // Configure ffmpeg for Railway
    this.setupFFmpeg();
  }

  setupFFmpeg() {
    // Railway has ffmpeg in PATH, but let's be explicit
    try {
      ffmpeg.setFfmpegPath('ffmpeg');
      ffmpeg.setFfprobePath('ffprobe');
    } catch (error) {
      console.log('Using system FFmpeg');
    }
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.log('Directories already exist');
    }
  }

  // Generate simple story
  async generateStory(diary, emotion) {
    const prompt = `Create a simple 2-scene movie story from this diary:
"${diary}"
Emotion: ${emotion}

Return JSON format:
{
  "title": "Short movie title",
  "scenes": [
    {"description": "Scene 1 visual description", "narration": "Korean narration"},
    {"description": "Scene 2 visual description", "narration": "Korean narration"}
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 400
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Story generation failed:', error);
      // Fallback
      return {
        title: "나의 하루",
        scenes: [
          {
            description: "A peaceful daily scene",
            narration: diary.substring(0, 50) + "..."
          },
          {
            description: "Evening reflection scene", 
            narration: "그리고 오늘도 의미있는 하루였다."
          }
        ]
      };
    }
  }

  // Generate images with fallbacks
  async generateImages(scenes, style) {
    const styleMap = {
      'realistic': 'photorealistic, cinematic, high quality',
      'animation': 'pixar animation style, 3d rendered',
      'watercolor': 'watercolor painting, artistic',
      'anime': 'anime style, studio ghibli inspired'
    };

    const stylePrompt = styleMap[style] || 'artistic, cinematic';

    const imagePromises = scenes.map(async (scene, index) => {
      const cacheKey = crypto.createHash('md5').update(scene.description).digest('hex');
      const cachePath = path.join(this.cacheDir, `${cacheKey}.jpg`);

      // Check cache first
      try {
        await fs.access(cachePath);
        console.log(`Using cached image for scene ${index + 1}`);
        return cachePath;
      } catch {
        // Generate new image
      }

      try {
        if (process.env.OPENAI_API_KEY) {
          const response = await this.openai.images.generate({
            model: "dall-e-2",
            prompt: `${scene.description}, ${stylePrompt}, 16:9 aspect ratio`,
            size: "1024x1024",
            n: 1
          });

          const imageUrl = response.data[0].url;
          const imageResponse = await fetch(imageUrl);
          const buffer = await imageResponse.buffer();
          
          // Optimize and resize
          await sharp(buffer)
            .jpeg({ quality: 90 })
            .resize(1280, 720, { fit: 'cover' })
            .toFile(cachePath);

          return cachePath;
        }
      } catch (error) {
        console.error(`DALL-E failed for scene ${index + 1}:`, error.message);
      }

      // Fallback: Create colored background with text
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#845EC2'];
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

  // Create actual MP4 video using fluent-ffmpeg
  async createVideo(images, scenes, title) {
    return new Promise((resolve, reject) => {
      const movieId = crypto.randomBytes(8).toString('hex');
      const outputFile = path.join(this.tempDir, `video_${movieId}.mp4`);

      console.log(`Creating video with ${images.length} images`);
      console.log(`Output file: ${outputFile}`);

      // Build ffmpeg command
      let command = ffmpeg();

      // Add input images with duration
      images.forEach((imagePath, index) => {
        command = command.input(imagePath).inputOptions([
          '-loop', '1',
          '-t', '3' // 3 seconds per image
        ]);
      });

      // Configure video output
      command
        .complexFilter([
          // Create slideshow with crossfade transitions
          ...images.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v${i}]`),
          // Concatenate all scaled videos
          `${images.map((_, i) => `[v${i}]`).join('')}concat=n=${images.length}:v=1[outv]`
        ])
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-r', '30' // 30 fps
        ])
        .output(outputFile)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${Math.round(progress.percent)}% done`);
        })
        .on('end', async () => {
          try {
            console.log('Video generation completed');
            
            // Read the video file
            const videoBuffer = await fs.readFile(outputFile);
            const base64Video = videoBuffer.toString('base64');
            const dataUri = `data:video/mp4;base64,${base64Video}`;

            // Clean up
            await fs.unlink(outputFile).catch(() => {});

            resolve({
              videoUrl: dataUri,
              duration: images.length * 3,
              size: videoBuffer.length,
              format: 'mp4'
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('FFmpeg error:', error);
          reject(new Error(`Video generation failed: ${error.message}`));
        })
        .run();
    });
  }

  // Main generation pipeline
  async generateMovie(diary, emotion, style, userId, progressCallback) {
    const startTime = Date.now();

    try {
      // Step 1: Generate story
      progressCallback({ progress: 20, stage: '스토리 생성 중...', elapsed: 0 });
      const story = await this.generateStory(diary, emotion);

      // Step 2: Generate images
      progressCallback({ 
        progress: 40, 
        stage: '이미지 생성 중...', 
        elapsed: (Date.now() - startTime) / 1000,
        story: story
      });
      const images = await this.generateImages(story.scenes, style);

      // Step 3: Create video
      progressCallback({ 
        progress: 70, 
        stage: '비디오 편집 중...', 
        elapsed: (Date.now() - startTime) / 1000,
        imagesReady: true
      });
      const video = await this.createVideo(images, story.scenes, story.title);

      // Complete
      progressCallback({ 
        progress: 100, 
        stage: '완성!', 
        elapsed: (Date.now() - startTime) / 1000
      });

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ Movie generated successfully in ${totalTime}s`);

      return {
        success: true,
        title: story.title,
        genre: emotion,
        scenes: story.scenes.map((scene, i) => ({
          ...scene,
          imageUrl: `file://${images[i]}`
        })),
        videoUrl: video.videoUrl,
        duration: video.duration,
        generationTime: totalTime,
        format: video.format
      };

    } catch (error) {
      console.error('Movie generation failed:', error);
      throw error;
    }
  }
}

export default RailwayVideoGenerator;