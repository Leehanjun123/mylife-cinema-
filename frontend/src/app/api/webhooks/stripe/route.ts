import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'

export async function POST(request: NextRequest) {
  console.log('🎯 Stripe Webhook 호출됨 - 시작')
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  
  console.log('📝 Webhook 수신:', {
    hasBody: !!body,
    hasSignature: !!signature,
    webhookSecretConfigured: !!webhookSecret && webhookSecret !== 'whsec_dummy'
  })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Webhook 서명 검증 성공, 이벤트 타입:', event.type)
  } catch (error: any) {
    console.error(`❌ Webhook signature verification failed:`, error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Checkout 완료 처리 시작:', {
    sessionId: session.id,
    userId: session.metadata?.userId,
    customerEmail: session.customer_email,
    subscriptionId: session.subscription
  })
  
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('❌ userId가 metadata에 없음')
    return
  }

  // Get subscription details
  let tier = 'free'
  
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = subscription.items.data[0].price.id
      console.log('📦 구독 정보:', { subscriptionId: subscription.id, priceId, status: subscription.status })
      
      // Determine subscription tier based on metadata or price
      if (session.metadata?.priceId === 'price_creator_monthly' || priceId === 'price_creator_monthly') {
        tier = 'creator'
      } else if (session.metadata?.priceId === 'price_pro_monthly' || priceId === 'price_pro_monthly') {
        tier = 'pro'
      }
    } catch (error) {
      console.error('❌ 구독 정보 조회 실패:', error)
      // Fallback to metadata
      if (session.metadata?.priceId === 'price_creator_monthly') tier = 'creator'
      if (session.metadata?.priceId === 'price_pro_monthly') tier = 'pro'
    }
  } else {
    // One-time payment or test mode - use metadata
    if (session.metadata?.priceId === 'price_creator_monthly') tier = 'creator'
    if (session.metadata?.priceId === 'price_pro_monthly') tier = 'pro'
  }
  
  console.log('🎯 결정된 구독 티어:', tier)

  // Update user subscription in database
  console.log('💾 DB 업데이트 시작 - users 테이블')
  
  const updateData = {
    subscription_tier: tier,
    stripe_customer_id: session.customer as string,
    subscription_status: 'active',
    updated_at: new Date().toISOString()
  }
  
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      updateData['subscription_expires_at'] = new Date(subscription.current_period_end * 1000).toISOString()
    } catch (error) {
      console.error('구독 만료일 설정 실패:', error)
    }
  }
  
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()
  
  if (updateError) {
    console.error('❌ users 테이블 업데이트 실패:', updateError)
  } else {
    console.log('✅ users 테이블 업데이트 성공:', updatedUser)
  }

  // Create subscription record if subscription exists
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          plan_name: tier
        })
      
      if (insertError) {
        console.error('❌ user_subscriptions 테이블 삽입 실패:', insertError)
      } else {
        console.log('✅ user_subscriptions 테이블 삽입 성공')
      }
    } catch (error) {
      console.error('❌ 구독 레코드 생성 실패:', error)
    }
  }

  console.log(`🎉 구독 생성 완료 - 사용자 ${userId}: ${tier} 플랜`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const priceId = subscription.items.data[0].price.id
  let tier = 'free'
  if (priceId === 'price_creator_monthly') tier = 'creator'
  if (priceId === 'price_pro_monthly') tier = 'pro'

  // Update user subscription
  await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  // Update subscription record
  await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_name: tier,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Subscription updated for user ${userId}: ${tier}`)
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  // Downgrade to free tier at period end
  await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  // Update subscription record
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  // Reset monthly usage counters on successful payment
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.userId
    
    if (userId) {
      await supabase
        .from('user_stats')
        .update({
          movies_this_month: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    }
  }

  console.log(`Payment succeeded for subscription ${subscriptionId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  console.log(`Payment failed for subscription ${subscriptionId}`)
  
  // Could implement dunning logic here
  // For now, Stripe will handle retry attempts
}