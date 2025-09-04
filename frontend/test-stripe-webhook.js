#!/usr/bin/env node

import Stripe from 'stripe';
import fetch from 'node-fetch';

// Your test Stripe secret key
const stripe = new Stripe('sk_test_51RmannQ6Lbm6gVDgKobNBix2XSkRECF4Bbb0McML8UdXBYXdisjo0JzTpRQ6nGOY7YmHRgG8qRdFKo7YBvO1OfIs00j09ANkJX', {
  apiVersion: '2024-11-20.acacia',
});

// Your webhook endpoint
const webhookUrl = 'https://www.lifecinema.site/api/webhooks/stripe';
const webhookSecret = 'whsec_nml4YKs6WkH20Et2hq5Csof9ics8KgEk';

// Your user ID for testing
const userId = 'c84dae12-f851-4215-a3fc-420b2b93e447';

async function testWebhook() {
  console.log('🧪 Stripe Webhook 테스트 시작...\n');

  // Create a test event
  const testEvent = {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2024-11-20.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        customer: 'cus_test_' + Date.now(),
        customer_email: 'hjun040608@gmail.com',
        payment_status: 'paid',
        metadata: {
          userId: userId,
          priceId: 'price_creator_monthly'
        },
        subscription: null, // Test without subscription for simplicity
        customer_details: {
          email: 'hjun040608@gmail.com'
        }
      }
    }
  };

  const payload = JSON.stringify(testEvent);
  
  // Generate webhook signature
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
    timestamp
  });

  console.log('📤 테스트 이벤트 전송 중...');
  console.log('   URL:', webhookUrl);
  console.log('   Event Type:', testEvent.type);
  console.log('   User ID:', userId);
  console.log('   Plan:', 'creator\n');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Webhook 테스트 성공!');
      console.log('   Status:', response.status);
      console.log('   Response:', responseText);
      
      console.log('\n📝 다음 단계:');
      console.log('   1. Supabase에서 users 테이블 확인');
      console.log('   2. subscription_tier가 "creator"로 업데이트되었는지 확인');
      console.log('   3. 웹사이트에서 로그아웃 후 재로그인하여 변경사항 확인');
    } else {
      console.log('❌ Webhook 테스트 실패');
      console.log('   Status:', response.status);
      console.log('   Error:', responseText);
    }
  } catch (error) {
    console.log('❌ 요청 실패:', error.message);
    console.log('\n가능한 원인:');
    console.log('   - 웹사이트가 다운됨');
    console.log('   - Webhook endpoint가 잘못됨');
    console.log('   - 네트워크 연결 문제');
  }

  console.log('\n💡 실제 결제 테스트:');
  console.log('   Stripe Dashboard에서 "Test mode" 활성화 후');
  console.log('   테스트 카드: 4242 4242 4242 4242');
  console.log('   만료일: 미래 날짜 (예: 12/34)');
  console.log('   CVC: 아무 3자리 숫자');
}

// Run the test
testWebhook().catch(console.error);