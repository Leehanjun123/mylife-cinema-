#!/usr/bin/env node

// MyLife Cinema 서버 시작 스크립트
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import textToSpeech from '@google-cloud/text-to-speech';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'https://mylife-cinema.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 서비스 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google Cloud TTS 설정
let ttsClient;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // 프로덕션 환경: 환경변수에서 JSON 파싱
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    ttsClient = new textToSpeech.TextToSpeechClient({
      credentials: credentials
    });
  } else {
    // 로컬 환경: 파일에서 읽기
    ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: './google-cloud-key.json'
    });
  }
} catch (error) {
  console.warn('Google TTS 설정 실패:', error.message);
  ttsClient = null;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 홈페이지
app.get('/', (req, res) => {
  res.json({
    service: 'MyLife Cinema',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createMovie: '/api/movies/create',
      generateScene: '/api/scenes/generate',
      synthesizeSpeech: '/api/voice/synthesize',
      testFull: '/api/test/full'
    }
  });
});

// 헬스체크
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    services: {
      openai: false,
      supabase: false,
      googleTTS: false,
      stripe: false,
      huggingFace: false
    }
  };

  try {
    // OpenAI 체크
    const models = await openai.models.list();
    health.services.openai = models.data.length > 0;

    // Supabase 체크
    const { data, error } = await supabase.from('movies').select('count').limit(1);
    health.services.supabase = !error;

    // Google TTS 체크
    const [voices] = await ttsClient.listVoices({});
    health.services.googleTTS = voices.voices.length > 0;

    // Stripe 체크
    const account = await stripe.accounts.retrieve();
    health.services.stripe = !!account.id;

    // Hugging Face 체크
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: 'test' })
    });
    health.services.huggingFace = hfResponse.ok || hfResponse.status === 503; // 503은 모델 로딩중

  } catch (error) {
    console.error('Health check error:', error.message);
  }

  res.json(health);
});

// 영화 생성 API
app.post('/api/movies/create', async (req, res) => {
  try {
    const { diary, userId = 'test-user' } = req.body;

    if (!diary) {
      return res.status(400).json({ error: 'Diary content is required' });
    }

    console.log('📝 일기 수신:', diary.substring(0, 100) + '...');

    // 1. AI로 일기 분석
    console.log('🤖 AI 분석 시작...');
    const analysisPrompt = `
    다음 일기를 영화 시나리오로 만들기 위해 분석하고 3-5개의 씬으로 나누어주세요:
    
    "${diary}"
    
    다음 JSON 형태로만 답변해주세요:
    {
      "title": "영화 제목",
      "genre": "장르",
      "mood": "전체적인 무드",
      "scenes": [
        {
          "sceneNumber": 1,
          "description": "씬 설명 (한국어)",
          "visualPrompt": "visual prompt for image generation (English)",
          "narration": "나레이션 텍스트 (한국어)",
          "duration": 4
        }
      ]
    }`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 일기를 영화 시나리오로 변환하는 전문가입니다. JSON 형태로만 답변하세요.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const analysis = JSON.parse(aiResponse.choices[0].message.content);
    console.log('✅ AI 분석 완료:', analysis.title);

    // 2. 데이터베이스에 영화 저장
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .insert({
        user_id: userId,
        title: analysis.title,
        diary_content: diary,
        analysis_data: analysis,
        status: 'processing'
      })
      .select()
      .single();

    if (movieError) throw movieError;
    console.log('💾 영화 저장 완료:', movie.id);

    // 3. 각 씬 저장
    const scenesData = analysis.scenes.map(scene => ({
      movie_id: movie.id,
      scene_number: scene.sceneNumber,
      description: scene.description,
      visual_prompt: scene.visualPrompt,
      duration: scene.duration
    }));

    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .insert(scenesData)
      .select();

    if (scenesError) throw scenesError;
    console.log('🎬 씬 저장 완료:', scenes.length + '개');

    res.json({
      success: true,
      movie: {
        id: movie.id,
        title: analysis.title,
        genre: analysis.genre,
        mood: analysis.mood,
        scenes: analysis.scenes
      },
      message: '영화 분석이 완료되었습니다!'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to create movie', 
      details: error.message 
    });
  }
});

// 씬 이미지 생성 API
app.post('/api/scenes/generate', async (req, res) => {
  try {
    const { movieId, sceneNumber } = req.body;

    // 씬 정보 조회
    const { data: scene, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('movie_id', movieId)
      .eq('scene_number', sceneNumber)
      .single();

    if (error) throw error;

    console.log(`🎨 씬 ${sceneNumber} 이미지 생성 시작...`);

    // Hugging Face로 이미지 생성
    const imageResponse = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `${scene.visual_prompt}, cinematic, high quality, detailed`
      })
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const imageBlob = await imageResponse.arrayBuffer();
    
    // Supabase Storage에 저장
    const fileName = `${movieId}/scene_${sceneNumber}.png`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from('scenes')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('scenes')
      .getPublicUrl(fileName);

    // 씬 업데이트
    await supabase
      .from('scenes')
      .update({ image_url: publicUrl })
      .eq('movie_id', movieId)
      .eq('scene_number', sceneNumber);

    console.log(`✅ 씬 ${sceneNumber} 이미지 생성 완료`);

    res.json({
      success: true,
      sceneNumber,
      imageUrl: publicUrl
    });

  } catch (error) {
    console.error('❌ Scene generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 음성 합성 API
app.post('/api/voice/synthesize', async (req, res) => {
  try {
    const { text, voice = 'ko-KR-Wavenet-A' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('🎤 음성 합성 시작:', text.substring(0, 50) + '...');

    const request = {
      input: { text },
      voice: {
        languageCode: 'ko-KR',
        name: voice,
        ssmlGender: voice.includes('A') || voice.includes('B') ? 'FEMALE' : 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    console.log('✅ 음성 합성 완료');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.audioContent.length
    });
    res.send(response.audioContent);

  } catch (error) {
    console.error('❌ Voice synthesis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전체 테스트 API
app.post('/api/test/full', async (req, res) => {
  try {
    const testDiary = req.body.diary || `
      오늘은 정말 특별한 하루였다.
      아침에 일찍 일어나 공원을 산책했다.
      신선한 공기가 너무 좋았고, 
      예쁜 꽃들을 보며 행복했다.
      오후에는 친구를 만나 카페에서 대화를 나눴다.
      오랜만에 만난 친구와 많은 이야기를 나눴다.
    `;

    console.log('🎬 MyLife Cinema 전체 테스트 시작!');
    
    // 1. 영화 생성
    const movieResponse = await fetch(`http://localhost:${PORT}/api/movies/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diary: testDiary })
    });
    
    const movieData = await movieResponse.json();
    console.log('✅ 영화 생성:', movieData.movie.title);

    // 2. 첫 번째 씬 이미지 생성
    const sceneResponse = await fetch(`http://localhost:${PORT}/api/scenes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: movieData.movie.id,
        sceneNumber: 1
      })
    });

    const sceneData = await sceneResponse.json();
    console.log('✅ 씬 이미지 생성:', sceneData.imageUrl);

    // 3. 나레이션 음성 생성
    const narrationText = movieData.movie.scenes[0].narration || movieData.movie.scenes[0].description;
    const voiceResponse = await fetch(`http://localhost:${PORT}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: narrationText })
    });

    console.log('✅ 음성 생성 완료');

    res.json({
      success: true,
      message: '전체 시스템 테스트 성공!',
      results: {
        movie: movieData.movie,
        firstScene: sceneData,
        narration: {
          text: narrationText,
          audioGenerated: voiceResponse.ok
        }
      }
    });

  } catch (error) {
    console.error('❌ Full test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🎬 MyLife Cinema Server Started!');
  console.log('================================');
  console.log(`🚀 서버 주소: http://localhost:${PORT}`);
  console.log(`📊 헬스체크: http://localhost:${PORT}/health`);
  console.log(`🎯 전체 테스트: http://localhost:${PORT}/api/test/full`);
  console.log('================================');
  console.log('✅ 준비된 서비스:');
  console.log('  - OpenAI GPT-4 (일기 분석)');
  console.log('  - Hugging Face (이미지 생성)');
  console.log('  - Google Cloud TTS (음성 합성)');
  console.log('  - Supabase (데이터 저장)');
  console.log('  - Stripe (결제 처리)');
  console.log('================================');
  console.log('💡 테스트: POST /api/test/full');
});