import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error(`Webhook signature verification failed:`, error.message)
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
  const userId = session.metadata?.userId
  if (!userId) return

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const priceId = subscription.items.data[0].price.id

  // Determine subscription tier
  let tier = 'free'
  if (priceId === 'price_creator_monthly') tier = 'creator'
  if (priceId === 'price_pro_monthly') tier = 'pro'

  // Update user subscription in database
  await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      stripe_customer_id: session.customer as string,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  // Create subscription record
  await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_name: tier
    })

  console.log(`Subscription created for user ${userId}: ${tier}`)
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