import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';

class HybridGenerator {
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

  // GPT-4o-mini for ultra-fast story (500ms)
  async generateStoryTurbo(diary, emotion) {
    const prompt = `2-scene movie. Diary: ${diary}. Emotion: ${emotion}
Output JSON only:
{"title":"title","scenes":[{"visual":"scene description","text":"narration"}]}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 150,
        temperature: 0.5
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return {
        title: "My Story",
        scenes: [
          { visual: `${emotion} scene`, text: diary.substring(0, 50) },
          { visual: "ending scene", text: "The end." }
        ]
      };
    }
  }

  // Parallel image generation with quality optimization
  async generateOptimizedImages(scenes, style) {
    const promises = scenes.map(async (scene, idx) => {
      try {
        // Generate with DALL-E 2 (faster than DALL-E 3)
        const response = await this.openai.images.generate({
          model: "dall-e-2",
          prompt: `${scene.visual}, ${style} style, high quality`,
          size: "512x512",
          n: 1
        });

        const imageUrl = response.data[0].url;
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.buffer();
        
        // Optimize for web delivery
        const optimized = await sharp(buffer)
          .resize(1920, 1080, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 90,
            progressive: true,
            optimiseScans: true
          })
          .toBuffer();
        
        return {
          buffer: optimized,
          base64: `data:image/jpeg;base64,${optimized.toString('base64')}`,
          size: optimized.length
        };
      } catch (error) {
        // Gradient fallback
        const svg = `
          <svg width="1920" height="1080">
            <defs>
              <linearGradient id="grad${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#grad${idx})" />
            <text x="960" y="540" font-family="Arial" font-size="72" fill="white" text-anchor="middle">
              ${scene.text.substring(0, 30)}...
            </text>
          </svg>
        `;
        
        const buffer = await sharp(Buffer.from(svg))
          .jpeg({ quality: 85 })
          .toBuffer();
        
        return {
          buffer: buffer,
          base64: `data:image/jpeg;base64,${buffer.toString('base64')}`,
          size: buffer.length
        };
      }
    });

    return Promise.all(promises);
  }

  // Generate video manifest for streaming playback
  async createVideoManifest(images, scenes, title) {
    const movieId = crypto.randomBytes(8).toString('hex');
    
    // Save images as individual files
    const imageUrls = await Promise.all(images.map(async (img, idx) => {
      const filename = `${movieId}_frame_${idx}.jpg`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, img.buffer);
      
      // Return relative URL for serving
      return `/movies/${filename}`;
    }));

    // Create HLS-style manifest
    const manifest = {
      version: "1.0",
      type: "slideshow",
      title: title,
      duration: scenes.length * 4, // 4 seconds per scene
      frames: scenes.map((scene, idx) => ({
        url: imageUrls[idx],
        dataUri: images[idx].base64, // Include base64 for immediate display
        text: scene.text,
        startTime: idx * 4,
        endTime: (idx + 1) * 4,
        transition: {
          type: "crossfade",
          duration: 0.5
        }
      })),
      audio: {
        type: "tts",
        texts: scenes.map(s => s.text),
        voice: "ko-KR",
        engine: "browser" // Use browser's Web Speech API
      },
      metadata: {
        movieId: movieId,
        created: new Date().toISOString(),
        totalSize: images.reduce((sum, img) => sum + img.size, 0)
      }
    };

    return manifest;
  }

  // Main pipeline with academic optimizations
  async generateMovie(diary, emotion, style, userId, progressCallback) {
    const startTime = Date.now();

    try {
      // Phase 1: Story (target: 1s)
      progressCallback({ progress: 10, stage: '스토리 생성 중...' });
      const storyStart = Date.now();
      const story = await this.generateStoryTurbo(diary, emotion);
      console.log(`Story: ${Date.now() - storyStart}ms`);

      // Phase 2: Images (target: 15s with parallel processing)
      progressCallback({ progress: 30, stage: '이미지 생성 중...' });
      const imageStart = Date.now();
      const images = await this.generateOptimizedImages(story.scenes, style);
      console.log(`Images: ${Date.now() - imageStart}ms`);

      // Phase 3: Manifest creation (target: 100ms)
      progressCallback({ progress: 80, stage: '영화 편집 중...' });
      const manifestStart = Date.now();
      const manifest = await this.createVideoManifest(images, story.scenes, story.title);
      console.log(`Manifest: ${Date.now() - manifestStart}ms`);

      // Complete
      progressCallback({ progress: 100, stage: '완성!' });
      
      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ Total generation time: ${totalTime}s`);

      return {
        success: true,
        title: story.title,
        type: 'hybrid-slideshow',
        manifest: manifest,
        
        // For compatibility
        videoUrl: null,
        frames: manifest.frames,
        duration: manifest.duration,
        generationTime: totalTime,
        
        // Statistics
        stats: {
          storyTime: (Date.now() - storyStart) / 1000,
          imageTime: (Date.now() - imageStart) / 1000,
          totalSize: manifest.metadata.totalSize,
          quality: 'HD (1920x1080)'
        }
      };

    } catch (error) {
      console.error('Hybrid generation error:', error);
      throw error;
    }
  }
}

export default HybridGenerator;