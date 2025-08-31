#!/usr/bin/env node

// Stripe 결제 시스템 테스트
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

async function testStripe() {
  console.log('💳 Stripe 결제 시스템 테스트');
  console.log('===========================');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    console.log('❌ Stripe 키가 설정되지 않았습니다.');
    return false;
  }

  console.log('✅ Stripe 키 확인됨');
  console.log(`🔑 Publishable Key: ${publishableKey.substring(0, 20)}...`);
  console.log(`🔐 Secret Key: ${secretKey.substring(0, 20)}...`);

  try {
    // Stripe 클라이언트 초기화
    const stripe = new Stripe(secretKey);

    // 1. 계정 정보 확인
    console.log('\n1. 🏪 계정 정보 확인...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ 계정 ID: ${account.id}`);
    console.log(`📧 이메일: ${account.email || '미설정'}`);
    console.log(`🏢 국가: ${account.country}`);
    console.log(`💰 통화: ${account.default_currency.toUpperCase()}`);

    // 2. MyLife Cinema 상품 생성 테스트
    console.log('\n2. 🎬 MyLife Cinema 상품 생성 테스트...');
    
    // 기본 상품 확인/생성
    const products = await stripe.products.list({ limit: 10 });
    let premiumProduct = products.data.find(p => p.name === 'MyLife Cinema Premium');
    
    if (!premiumProduct) {
      console.log('   📦 Premium 상품 생성 중...');
      premiumProduct = await stripe.products.create({
        name: 'MyLife Cinema Premium',
        description: 'AI로 일기를 개인화된 영화로 변환 - 프리미엄 기능',
        images: ['https://via.placeholder.com/400x300?text=MyLife+Cinema'],
        metadata: {
          service: 'mylife-cinema',
          tier: 'premium'
        }
      });
      console.log(`   ✅ Premium 상품 생성 완료: ${premiumProduct.id}`);
    } else {
      console.log(`   ✅ Premium 상품 확인됨: ${premiumProduct.id}`);
    }

    // 3. 가격 설정 확인/생성
    console.log('\n3. 💰 가격 설정 테스트...');
    
    const prices = await stripe.prices.list({ 
      product: premiumProduct.id,
      limit: 10 
    });
    
    let monthlyPrice = prices.data.find(p => 
      p.recurring?.interval === 'month' && 
      p.unit_amount === 1500  // $15.00
    );
    
    if (!monthlyPrice) {
      console.log('   💵 월간 구독 가격 생성 중...');
      monthlyPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 1500,  // $15.00 in cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        nickname: 'Premium Monthly'
      });
      console.log(`   ✅ 월간 가격 생성 완료: ${monthlyPrice.id}`);
    } else {
      console.log(`   ✅ 월간 가격 확인됨: ${monthlyPrice.id}`);
    }

    // 4. 테스트 결제 세션 생성
    console.log('\n4. 🛒 테스트 결제 세션 생성...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: monthlyPrice.id,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        service: 'mylife-cinema',
        tier: 'premium'
      }
    });

    console.log(`✅ 결제 세션 생성 완료`);
    console.log(`🔗 결제 URL: ${session.url}`);
    console.log(`📋 세션 ID: ${session.id}`);

    // 5. 웹훅 엔드포인트 확인 (선택사항)
    console.log('\n5. 🔔 웹훅 엔드포인트 확인...');
    
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 3 });
    
    if (webhookEndpoints.data.length === 0) {
      console.log('   ⚠️ 웹훅 엔드포인트가 없습니다.');
      console.log('   💡 나중에 프로덕션 배포시 설정하세요.');
      console.log('   📝 URL: https://your-domain.com/webhook/stripe');
    } else {
      console.log(`   ✅ 웹훅 엔드포인트: ${webhookEndpoints.data.length}개`);
      webhookEndpoints.data.forEach(endpoint => {
        console.log(`      📍 ${endpoint.url}`);
      });
    }

    console.log('\n🎉 Stripe 설정 완료!');
    console.log('====================');
    console.log('✅ 계정 연결: 성공');
    console.log('✅ 상품 생성: 완료');
    console.log('✅ 가격 설정: 완료');
    console.log('✅ 결제 시스템: 준비됨');
    console.log('💡 MyLife Cinema 프리미엄 구독 준비 완료!');

    // 6. 요약 정보
    console.log('\n📊 설정된 결제 옵션:');
    console.log(`   💳 MyLife Cinema Premium: $15/월`);
    console.log(`   🎬 무제한 AI 영화 생성`);
    console.log(`   🎨 고품질 비디오`);
    console.log(`   ☁️ 클라우드 저장`);

    return true;

  } catch (error) {
    console.error('❌ Stripe 테스트 실패:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔑 API 키가 유효하지 않습니다. 다시 확인해주세요.');
    } else if (error.type === 'StripePermissionError') {
      console.log('🚫 권한이 부족합니다. 계정 설정을 확인해주세요.');
    } else if (error.type === 'StripeRateLimitError') {
      console.log('⏰ API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }

    return false;
  }
}

// 스크립트 실행
testStripe().then(success => {
  if (success) {
    console.log('\n🏆 Stripe 완전 설정 성공!');
    console.log('💰 MyLife Cinema 프리미엄 구독 결제 준비 완료!');
  } else {
    console.log('\n⚠️ Stripe 설정에서 문제가 발생했습니다.');
  }
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
});