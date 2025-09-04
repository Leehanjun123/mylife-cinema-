import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await request.json()

    // Validate user exists in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
        trial_period_days: 7, // 7일 무료 체험
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout session 생성 오류:', error)
    return NextResponse.json(
      { error: '결제 세션 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}