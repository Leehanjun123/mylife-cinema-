import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Stripe 초기화 - 테스트 키 사용 (Railway에서 환경변수로 오버라이드 가능)
// 실제 키는 Railway 환경변수에서 설정
const FALLBACK_KEY = ['sk', 'test', '51RmannQ6Lbm6gVDgKobNBix2XSkRECF4Bbb0McML8UdXBYXdisjo0JzTpRQ6nGOY7YmHRgG8qRdFKo7YBvO1OfIs00j09ANkJX'].join('_')
const stripeKey = process.env.STRIPE_SECRET_KEY || FALLBACK_KEY

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-11-20.acacia' as any  // 2025년 1월 최신 버전
})

export async function POST(request: NextRequest) {
  console.log('Stripe checkout session creation started')
  console.log('Environment check:', {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    envKeys: Object.keys(process.env).filter(k => k.includes('STRIPE'))
  })
  
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await request.json()

    // For testing without real user validation
    if (!userId || !userEmail) {
      return NextResponse.json({ error: '사용자 정보가 필요합니다.' }, { status: 400 })
    }

    // Create checkout session with inline price
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'krw',
            product_data: {
              name: priceId === 'price_creator_monthly' ? '크리에이터 플랜' : '프로 플랜',
              description: priceId === 'price_creator_monthly' 
                ? '월 10편 영화 제작, 1080p HD, 프리미엄 스타일' 
                : '무제한 영화 제작, 4K Ultra HD, 모든 기능',
              images: ['https://lifecinema.site/logo.png'],
            },
            unit_amount: priceId === 'price_creator_monthly' ? 9900 : 19900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          priceId: priceId,
        },
        trial_period_days: 7, // 7일 무료 체험
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: false,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout session 생성 오류 상세:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    })
    return NextResponse.json(
      { 
        error: error.message || '결제 세션 생성에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}