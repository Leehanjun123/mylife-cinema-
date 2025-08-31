import axios from 'axios';
import winston from 'winston';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class VideoService {
  constructor() {
    this.runwayApiKey = process.env.RUNWAY_API_KEY;
    this.pikaApiKey = process.env.PIKA_API_KEY;
    this.stableVideoApiKey = process.env.STABLE_VIDEO_API_KEY;
    
    this.tempDir = process.env.TEMP_DIR || './temp';
    this.outputDir = process.env.OUTPUT_DIR || './output';
    
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(`${this.tempDir}/scenes`, { recursive: true });
      await fs.mkdir(`${this.tempDir}/audio`, { recursive: true });
    } catch (error) {
      logger.error('Directory initialization error:', error);
    }
  }

  /**
   * Generate video for a complete movie
   */
  async generateMovie(movieData) {
    try {
      logger.info(`Starting movie generation: ${movieData.title}`);

      const { script, videoPrompts, audioScript, musicPrompts, movieId } = movieData;

      // Step 1: Generate individual scenes
      const sceneVideos = await this.generateScenes(videoPrompts, movieId);

      // Step 2: Generate audio elements
      const audioElements = await this.generateAudio(audioScript, movieId);

      // Step 3: Generate background music
      const musicTracks = await this.generateMusic(musicPrompts, movieId);

      // Step 4: Composite final movie
      const finalMovie = await this.compositeMovie({
        scenes: sceneVideos,
        audio: audioElements,
        music: musicTracks,
        script: script,
        movieId: movieId
      });

      logger.info(`Movie generation completed: ${finalMovie.path}`);
      return finalMovie;

    } catch (error) {
      logger.error('Movie generation error:', error);
      throw new Error('Failed to generate movie');
    }
  }

  /**
   * Generate individual scene videos
   */
  async generateScenes(videoPrompts, movieId) {
    logger.info(`Generating ${videoPrompts.length} scenes`);

    const sceneVideos = [];

    for (let i = 0; i < videoPrompts.length; i++) {
      const prompt = videoPrompts[i];
      
      try {
        logger.info(`Generating scene ${prompt.scene_number}`);

        // Use primary video generation service (Runway)
        let videoPath = await this.generateWithRunway(prompt, movieId);

        // Fallback to alternative services if needed
        if (!videoPath) {
          logger.warn(`Runway failed for scene ${prompt.scene_number}, trying Pika`);
          videoPath = await this.generateWithPika(prompt, movieId);
        }

        if (!videoPath) {
          logger.warn(`Pika failed for scene ${prompt.scene_number}, trying Stable Video`);
          videoPath = await this.generateWithStableVideo(prompt, movieId);
        }

        if (!videoPath) {
          throw new Error(`All video generation services failed for scene ${prompt.scene_number}`);
        }

        sceneVideos.push({
          scene_number: prompt.scene_number,
          path: videoPath,
          duration: prompt.duration,
          timestamp: prompt.timestamp
        });

        // Progress callback
        const progress = Math.round(((i + 1) / videoPrompts.length) * 50); // 50% of total progress
        await this.updateProgress(movieId, progress, `Generated scene ${i + 1}/${videoPrompts.length}`);

      } catch (error) {
        logger.error(`Scene ${prompt.scene_number} generation error:`, error);
        // Create a fallback placeholder video
        const placeholderPath = await this.createPlaceholderVideo(prompt, movieId);
        sceneVideos.push({
          scene_number: prompt.scene_number,
          path: placeholderPath,
          duration: prompt.duration,
          timestamp: prompt.timestamp
        });
      }
    }

    return sceneVideos;
  }

  /**
   * Generate video using Runway ML
   */
  async generateWithRunway(prompt, movieId) {
    try {
      const response = await axios.post('https://api.runwayml.com/v1/image_to_video', {
        text_prompt: prompt.prompt,
        duration: Math.min(prompt.duration, 10), // Runway max duration
        aspect_ratio: '16:9',
        motion_strength: 0.8,
        seed: Math.floor(Math.random() * 1000000)
      }, {
        headers: {
          'Authorization': `Bearer ${this.runwayApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = response.data.id;

      // Poll for completion
      let videoUrl = await this.pollRunwayTask(taskId);

      if (videoUrl) {
        const videoPath = await this.downloadVideo(videoUrl, `${movieId}_scene_${prompt.scene_number}_runway.mp4`);
        return videoPath;
      }

      return null;

    } catch (error) {
      logger.error('Runway generation error:', error);
      return null;
    }
  }

  /**
   * Generate video using Pika Labs
   */
  async generateWithPika(prompt, movieId) {
    try {
      // Pika Labs API implementation
      const response = await axios.post('https://api.pikalabs.ai/v1/generate', {
        prompt: prompt.prompt,
        duration: prompt.duration,
        style: 'realistic',
        aspect_ratio: '16:9'
      }, {
        headers: {
          'Authorization': `Bearer ${this.pikaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = response.data.task_id;
      const videoUrl = await this.pollPikaTask(taskId);

      if (videoUrl) {
        const videoPath = await this.downloadVideo(videoUrl, `${movieId}_scene_${prompt.scene_number}_pika.mp4`);
        return videoPath;
      }

      return null;

    } catch (error) {
      logger.error('Pika generation error:', error);
      return null;
    }
  }

  /**
   * Generate video using Stable Video Diffusion
   */
  async generateWithStableVideo(prompt, movieId) {
    try {
      // Stable Video Diffusion API implementation
      const response = await axios.post('https://api.stability.ai/v2beta/image-to-video', {
        image: await this.generateStillImage(prompt.prompt),
        cfg_scale: 1.8,
        motion_bucket_id: 127,
        seed: Math.floor(Math.random() * 1000000)
      }, {
        headers: {
          'Authorization': `Bearer ${this.stableVideoApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const generationId = response.data.id;
      const videoUrl = await this.pollStableVideoTask(generationId);

      if (videoUrl) {
        const videoPath = await this.downloadVideo(videoUrl, `${movieId}_scene_${prompt.scene_number}_stable.mp4`);
        return videoPath;
      }

      return null;

    } catch (error) {
      logger.error('Stable Video generation error:', error);
      return null;
    }
  }

  /**
   * Generate audio elements (narration, dialogue)
   */
  async generateAudio(audioScript, movieId) {
    logger.info('Generating audio elements');

    const audioElements = [];

    for (const element of audioScript) {
      try {
        const audioPath = await this.generateSpeech(element, movieId);
        
        audioElements.push({
          ...element,
          path: audioPath
        });

      } catch (error) {
        logger.error(`Audio generation error for element:`, error);
      }
    }

    return audioElements;
  }

  /**
   * Generate speech using OpenAI TTS
   */
  async generateSpeech(audioElement, movieId) {
    try {
      const response = await axios.post('https://api.openai.com/v1/audio/speech', {
        model: 'tts-1-hd',
        input: audioElement.text,
        voice: audioElement.voice || 'alloy',
        response_format: 'mp3'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      const audioPath = path.join(this.tempDir, 'audio', `${movieId}_${audioElement.type}_${audioElement.scene || 'global'}.mp3`);
      const writer = require('fs').createWriteStream(audioPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(audioPath));
        writer.on('error', reject);
      });

    } catch (error) {
      logger.error('Speech generation error:', error);
      throw error;
    }
  }

  /**
   * Generate background music
   */
  async generateMusic(musicPrompts, movieId) {
    logger.info('Generating background music');

    const musicTracks = [];

    try {
      // Use AI music generation service (e.g., Mubert, Suno)
      for (const [key, prompt] of Object.entries(musicPrompts)) {
        if (key === 'scenes') continue;

        const musicPath = await this.generateMusicTrack(prompt, `${key}_${movieId}`);
        musicTracks.push({
          type: key,
          path: musicPath,
          prompt: prompt
        });
      }

      // Generate scene-specific music
      if (musicPrompts.scenes) {
        for (const scene of musicPrompts.scenes) {
          const musicPath = await this.generateMusicTrack(scene.music, `scene_${scene.scene}_${movieId}`);
          musicTracks.push({
            type: 'scene',
            scene: scene.scene,
            path: musicPath,
            prompt: scene.music
          });
        }
      }

    } catch (error) {
      logger.error('Music generation error:', error);
    }

    return musicTracks;
  }

  /**
   * Generate individual music track
   */
  async generateMusicTrack(prompt, identifier) {
    try {
      // Using Mubert API as example
      const response = await axios.post('https://api-b2b.mubert.com/v2/RecordTrack', {
        method: 'RecordTrack',
        params: {
          pat: process.env.MUBERT_PAT,
          duration: 60, // Default duration
          tags: prompt,
          mode: 'track'
        }
      });

      if (response.data.status === 1) {
        const trackUrl = response.data.data.tasks[0].download_link;
        const musicPath = await this.downloadAudio(trackUrl, `${identifier}.wav`);
        return musicPath;
      }

      return null;

    } catch (error) {
      logger.error('Music track generation error:', error);
      return null;
    }
  }

  /**
   * Composite final movie from all elements
   */
  async compositeMovie({ scenes, audio, music, script, movieId }) {
    logger.info('Compositing final movie');

    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, `${movieId}_final.mp4`);
      
      let ffmpegCommand = ffmpeg();

      // Add video inputs (scenes in order)
      scenes
        .sort((a, b) => a.scene_number - b.scene_number)
        .forEach(scene => {
          ffmpegCommand = ffmpegCommand.input(scene.path);
        });

      // Add audio inputs
      audio.forEach(audioElement => {
        ffmpegCommand = ffmpegCommand.input(audioElement.path);
      });

      // Add music inputs
      music.forEach(musicTrack => {
        if (musicTrack.path) {
          ffmpegCommand = ffmpegCommand.input(musicTrack.path);
        }
      });

      // Complex filter for video concatenation and audio mixing
      let filterComplex = [];
      
      // Concatenate video scenes
      const videoInputs = scenes.map((_, i) => `[${i}:v]`).join('');
      filterComplex.push(`${videoInputs}concat=n=${scenes.length}:v=1:a=0[outv]`);

      // Mix audio elements
      const audioInputs = [];
      let inputIndex = scenes.length;
      
      audio.forEach((_, i) => {
        audioInputs.push(`[${inputIndex + i}:a]`);
      });

      music.forEach((_, i) => {
        audioInputs.push(`[${inputIndex + audio.length + i}:a]`);
      });

      if (audioInputs.length > 0) {
        filterComplex.push(`${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest[outa]`);
      }

      ffmpegCommand
        .complexFilter(filterComplex)
        .outputOptions(['-map [outv]'])
        
      if (audioInputs.length > 0) {
        ffmpegCommand.outputOptions(['-map [outa]']);
      }

      ffmpegCommand
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info('FFmpeg started:', commandLine);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          this.updateProgress(movieId, 75 + (percent * 0.25), `Rendering final movie: ${percent}%`);
        })
        .on('end', () => {
          logger.info('Movie composition completed');
          resolve({
            path: outputPath,
            duration: script.total_duration,
            title: script.title,
            fileSize: null // Will be calculated separately
          });
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Helper methods
  async pollRunwayTask(taskId) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`https://api.runwayml.com/v1/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.runwayApiKey}`
          }
        });

        if (response.data.status === 'SUCCEEDED') {
          return response.data.output?.[0];
        } else if (response.data.status === 'FAILED') {
          throw new Error('Runway task failed');
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;

      } catch (error) {
        logger.error('Runway polling error:', error);
        break;
      }
    }

    return null;
  }

  async downloadVideo(url, filename) {
    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      });

      const filePath = path.join(this.tempDir, 'scenes', filename);
      const writer = require('fs').createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });

    } catch (error) {
      logger.error('Video download error:', error);
      throw error;
    }
  }

  async createPlaceholderVideo(prompt, movieId) {
    // Create a simple colored video with text as fallback
    const outputPath = path.join(this.tempDir, 'scenes', `${movieId}_scene_${prompt.scene_number}_placeholder.mp4`);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=c=blue:s=1920x1080:d=${prompt.duration}`)
        .inputFormat('lavfi')
        .outputOptions([
          '-vf', `drawtext=text='Scene ${prompt.scene_number}\\nGenerating...':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          '-c:v libx264',
          '-t', prompt.duration.toString()
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async updateProgress(movieId, progress, message) {
    // Update progress in database and emit socket event
    try {
      const { db } = await import('../config/database.js');
      await db.updateMovieStatus(movieId, 'generating', progress);
      
      // Emit socket event (will be handled by server.js)
      // socketIO.to(`user_${userId}`).emit('movie_progress', { movieId, progress, message });
      
    } catch (error) {
      logger.error('Progress update error:', error);
    }
  }
}

export default new VideoService();