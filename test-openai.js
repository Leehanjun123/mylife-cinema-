#!/usr/bin/env node

// OpenAI API 테스트 스크립트
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🤖 OpenAI API 테스트 시작...');
  
  try {
    // 1. API 키 유효성 검사
    console.log('\n1. API 키 확인 중...');
    const models = await openai.models.list();
    console.log('✅ API 키 유효함!');
    console.log(`📋 사용 가능한 모델: ${models.data.length}개`);
    
    // GPT-4 모델 찾기
    const gpt4Models = models.data.filter(model => model.id.includes('gpt-4'));
    console.log(`🎯 GPT-4 모델: ${gpt4Models.map(m => m.id).join(', ')}`);
    
    // 2. 간단한 대화 테스트
    console.log('\n2. 대화 테스트 중...');
    const testPrompt = `
    다음 일기를 영화 시나리오로 만들기 위해 분석해주세요:
    
    "오늘 친구와 카페에서 만나서 오랜만에 대화를 나눴다. 
    처음엔 어색했지만 점점 예전처럼 편해졌다. 
    친구가 새로운 직장 이야기를 해줄 때 정말 행복해 보였다. 
    나도 응원한다고 말해주었더니 고마워했다."
    
    다음 정보를 JSON으로 추출해주세요:
    {
      "mainTheme": "주요 테마",
      "emotions": ["감정들"],
      "characters": ["등장인물들"],
      "setting": "장소와 시간",
      "genre_suggestions": ["적합한 장르들"]
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 일기를 영화 시나리오로 분석하는 전문가입니다. JSON 형태로만 답변해주세요.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const analysis = response.choices[0].message.content;
    console.log('✅ AI 분석 완료!');
    console.log('\n📋 분석 결과:');
    console.log(analysis);
    
    // 3. 토큰 사용량 확인
    console.log('\n3. 사용량 정보:');
    console.log(`📊 입력 토큰: ${response.usage?.prompt_tokens || '?'}`);
    console.log(`📊 출력 토큰: ${response.usage?.completion_tokens || '?'}`);
    console.log(`📊 총 토큰: ${response.usage?.total_tokens || '?'}`);
    console.log(`💰 예상 비용: $${((response.usage?.total_tokens || 0) * 0.00003).toFixed(4)}`);
    
    console.log('\n🎉 OpenAI API 테스트 성공!');
    console.log('🎬 MyLife Cinema에서 사용할 준비가 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('🔑 API 키를 확인해주세요.');
    } else if (error.code === 'insufficient_quota') {
      console.log('💳 OpenAI 크레딧이 부족합니다.');
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('⏰ 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }
  }
}

// 스크립트 실행
testOpenAI();