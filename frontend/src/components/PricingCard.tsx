'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PricingPlan {
  id: string
  name: string
  price: number
  priceId: string
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    priceId: '',
    features: [
      '월 3편의 영화 제작',
      '720p HD 품질',
      '3분 길이 제한',
      '6가지 비주얼 스타일',
      '커뮤니티 공유',
      '기본 고객 지원'
    ],
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 'creator',
    name: '크리에이터',
    price: 9900,
    priceId: 'price_creator_monthly',
    popular: true,
    features: [
      '월 10편의 영화 제작',
      '1080p Full HD 품질',
      '10분 길이 제한',
      '모든 비주얼 스타일',
      '음성 복제 기능',
      '우선 처리',
      '고급 커뮤니티 기능',
      '이메일 지원'
    ],
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'pro',
    name: '프로',
    price: 19900,
    priceId: 'price_pro_monthly',
    features: [
      '무제한 영화 제작',
      '4K Ultra HD 품질',
      '30분 길이 제한',
      '모든 고급 기능',
      '커스텀 브랜딩',
      'API 액세스',
      '최우선 처리',
      '전용 계정 관리자',
      '24/7 프리미엄 지원'
    ],
    icon: <Crown className="w-6 h-6" />
  }
]

export function PricingCard() {
  const [loading, setLoading] = useState<string | null>(null)
  const { user, profile } = useAuth()

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      window.location.href = '/auth/signin?redirect=/pricing'
      return
    }

    if (plan.id === 'free') {
      // Already free plan
      return
    }

    setLoading(plan.id)

    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe 로딩 실패')

      // Call backend to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing?upgrade=cancelled`
        })
      })

      const { sessionId } = await response.json()

      const { error } = await stripe.redirectToCheckout({
        sessionId
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('결제 오류:', error)
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`relative p-8 ${
            plan.popular 
              ? 'border-2 border-purple-500 shadow-lg scale-105' 
              : 'border border-gray-200'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                가장 인기
              </span>
            </div>
          )}

          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              plan.popular 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {plan.icon}
            </div>
            
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            
            <div className="flex items-baseline justify-center mb-4">
              <span className="text-4xl font-bold">
                {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500 ml-2">/월</span>
              )}
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleSubscribe(plan)}
            disabled={
              loading === plan.id || 
              (profile?.subscription_tier === plan.id) ||
              (profile?.subscription_tier === 'pro' && plan.id !== 'pro') ||
              (profile?.subscription_tier === 'creator' && plan.id === 'free')
            }
            className={`w-full h-12 ${
              plan.popular
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                : plan.id === 'pro'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                : ''
            }`}
            variant={plan.id === 'free' ? 'outline' : 'default'}
          >
            {loading === plan.id ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : profile?.subscription_tier === plan.id ? (
              '현재 플랜'
            ) : plan.id === 'free' ? (
              '무료 시작'
            ) : (
              '업그레이드'
            )}
          </Button>

          {plan.price > 0 && (
            <p className="text-xs text-gray-500 text-center mt-4">
              언제든지 취소 가능 • 첫 7일 무료 체험
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}

export default PricingCard