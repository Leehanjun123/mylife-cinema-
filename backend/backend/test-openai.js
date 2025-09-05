import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log('🧪 OpenAI API 테스트 시작...\n');
  
  try {
    // Test 1: Simple completion
    console.log('1️⃣ GPT-4o-mini 테스트...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ 
        role: "user", 
        content: "오늘 날씨가 좋았다는 일기를 한 줄로 영화 제목으로 만들어줘." 
      }],
      max_tokens: 50
    });
    
    console.log('✅ 생성된 영화 제목:', completion.choices[0].message.content);
    
    // Test 2: Story generation
    console.log('\n2️⃣ 스토리 생성 테스트...');
    const storyPrompt = `
짧은 일기를 영화 스토리로 만들어주세요.
일기: "오늘은 오랜만에 친구들을 만났다. 함께 커피를 마시며 옛날 이야기를 나눴다."

2개의 장면으로 구성된 짧은 스토리를 JSON 형식으로 만들어주세요:
{
  "title": "제목",
  "scenes": [
    {"description": "장면 설명", "narration": "나레이션"}
  ]
}`;

    const story = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: storyPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    
    const storyData = JSON.parse(story.choices[0].message.content);
    console.log('✅ 생성된 스토리:', JSON.stringify(storyData, null, 2));
    
    // Test 3: Check if DALL-E is available
    console.log('\n3️⃣ DALL-E 이미지 생성 테스트 (Optional)...');
    try {
      const image = await openai.images.generate({
        model: "dall-e-2",  // dall-e-3는 더 비싸므로 dall-e-2로 테스트
        prompt: "A peaceful coffee shop scene with friends talking, warm lighting, cozy atmosphere",
        size: "256x256",  // 테스트용 작은 사이즈
        n: 1
      });
      
      console.log('✅ 생성된 이미지 URL:', image.data[0].url);
    } catch (imageError) {
      console.log('⚠️  DALL-E 사용 불가능 (API 플랜 확인 필요)');
    }
    
    console.log('\n🎉 OpenAI API 연결 성공! 영화 생성 준비 완료.');
    console.log('💡 Railway에 같은 API 키를 환경변수로 추가하세요.');
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
    console.log('\n가능한 원인:');
    console.log('1. API 키가 잘못됨');
    console.log('2. API 사용량 한도 초과');
    console.log('3. 네트워크 문제');
  }
}

testOpenAI();