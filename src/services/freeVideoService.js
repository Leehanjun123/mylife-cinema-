import axios from 'axios';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class FreeVideoService {
  constructor() {
    this.huggingFaceToken = process.env.HUGGING_FACE_TOKEN; // 무료
    this.lumaApiKey = process.env.LUMA_API_KEY; // 무료 플랜
    this.tempDir = process.env.TEMP_DIR || './temp';
  }

  /**
   * 무료 비디오 생성 메인 함수
   */
  async generateFreeVideo(prompt, movieId, sceneNumber) {
    logger.info(`Free video generation started for scene ${sceneNumber}`);

    try {
      // 1순위: Hugging Face (완전 무료)
      let videoPath = await this.generateWithHuggingFace(prompt, movieId, sceneNumber);
      
      if (videoPath) {
        logger.info('✅ Hugging Face 생성 성공');
        return videoPath;
      }

      // 2순위: Luma Dream Machine (무료 티어)
      videoPath = await this.generateWithLuma(prompt, movieId, sceneNumber);
      
      if (videoPath) {
        logger.info('✅ Luma Dream Machine 생성 성공');
        return videoPath;
      }

      // 3순위: 간단한 텍스트 비디오 생성
      videoPath = await this.generateTextVideo(prompt, movieId, sceneNumber);
      
      logger.info('✅ 텍스트 비디오 생성 성공');
      return videoPath;

    } catch (error) {
      logger.error('Free video generation failed:', error);
      // 플레이스홀더 비디오 생성
      return await this.createPlaceholderVideo(prompt, movieId, sceneNumber);
    }
  }

  /**
   * Hugging Face Stable Video Diffusion
   */
  async generateWithHuggingFace(prompt, movieId, sceneNumber) {
    if (!this.huggingFaceToken) {
      logger.warn('Hugging Face token not configured');
      return null;
    }

    try {
      const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt";
      
      // 먼저 이미지 생성
      const imageResponse = await axios.post(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // 이미지를 비디오로 변환
      const videoResponse = await axios.post(
        API_URL,
        { inputs: imageResponse.data },
        {
          headers: {
            Authorization: `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // 비디오 파일 저장
      const videoPath = path.join(this.tempDir, 'scenes', `${movieId}_scene_${sceneNumber}_hf.mp4`);
      await fs.writeFile(videoPath, videoResponse.data);

      return videoPath;

    } catch (error) {
      logger.error('Hugging Face generation error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Luma Dream Machine API
   */
  async generateWithLuma(prompt, movieId, sceneNumber) {
    if (!this.lumaApiKey) {
      logger.warn('Luma API key not configured');
      return null;
    }

    try {
      const response = await axios.post('https://api.lumalabs.ai/dream-machine/v1/generations', {
        prompt: prompt,
        aspect_ratio: "16:9",
        loop: false
      }, {
        headers: {
          Authorization: `Bearer ${this.lumaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const generationId = response.data.id;

      // 생성 완료 대기 (폴링)
      const videoUrl = await this.pollLumaGeneration(generationId);
      
      if (videoUrl) {
        const videoPath = await this.downloadVideo(videoUrl, `${movieId}_scene_${sceneNumber}_luma.mp4`);
        return videoPath;
      }

      return null;

    } catch (error) {
      logger.error('Luma generation error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * 텍스트 기반 비디오 생성 (최후 수단)
   */
  async generateTextVideo(prompt, movieId, sceneNumber) {
    const { createCanvas } = require('canvas');
    const ffmpeg = require('fluent-ffmpeg');
    
    try {
      // 캔버스에 텍스트 그리기
      const canvas = createCanvas(1920, 1080);
      const ctx = canvas.getContext('2d');

      // 배경 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
      gradient.addColorStop(0, '#1a202c');
      gradient.addColorStop(1, '#2d3748');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1920, 1080);

      // 텍스트 스타일
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 텍스트 그리기 (자동 줄바꿈)
      const words = prompt.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > 1600 && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine.trim());

      // 각 줄 그리기
      const lineHeight = 60;
      const startY = 540 - (lines.length * lineHeight / 2);
      
      lines.forEach((line, index) => {
        ctx.fillText(line, 960, startY + (index * lineHeight));
      });

      // 이미지를 파일로 저장
      const imageBuffer = canvas.toBuffer('image/png');
      const imagePath = path.join(this.tempDir, 'scenes', `${movieId}_scene_${sceneNumber}_text.png`);
      await fs.writeFile(imagePath, imageBuffer);

      // 이미지를 비디오로 변환
      const videoPath = path.join(this.tempDir, 'scenes', `${movieId}_scene_${sceneNumber}_text.mp4`);

      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(imagePath)
          .inputOptions([
            '-loop 1',
            '-t 4' // 4초 길이
          ])
          .outputOptions([
            '-c:v libx264',
            '-preset ultrafast',
            '-pix_fmt yuv420p',
            '-vf scale=1920:1080'
          ])
          .output(videoPath)
          .on('end', () => {
            // 임시 이미지 삭제
            fs.unlink(imagePath).catch(() => {});
            resolve(videoPath);
          })
          .on('error', reject)
          .run();
      });

    } catch (error) {
      logger.error('Text video generation error:', error);
      throw error;
    }
  }

  /**
   * 플레이스홀더 비디오 생성
   */
  async createPlaceholderVideo(prompt, movieId, sceneNumber) {
    const videoPath = path.join(this.tempDir, 'scenes', `${movieId}_scene_${sceneNumber}_placeholder.mp4`);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=c=navy:s=1920x1080:d=4')
        .inputFormat('lavfi')
        .outputOptions([
          '-vf', `drawtext=text='🎬 MyLife Cinema\\n\\n"${prompt.substring(0, 100)}..."\\n\\nGenerating...':fontsize=36:fontcolor=gold:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Arial.ttf`,
          '-c:v libx264',
          '-preset ultrafast',
          '-pix_fmt yuv420p'
        ])
        .output(videoPath)
        .on('end', () => resolve(videoPath))
        .on('error', reject)
        .run();
    });
  }

  /**
   * Luma 생성 상태 폴링
   */
  async pollLumaGeneration(generationId) {
    const maxAttempts = 30; // 5분 대기
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`, {
          headers: {
            Authorization: `Bearer ${this.lumaApiKey}`
          }
        });

        const status = response.data.state;
        
        if (status === 'completed') {
          return response.data.video?.download_url;
        } else if (status === 'failed') {
          throw new Error('Luma generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        attempts++;

      } catch (error) {
        logger.error('Luma polling error:', error);
        break;
      }
    }

    return null;
  }

  /**
   * 비디오 파일 다운로드
   */
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
}

export default new FreeVideoService();