'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { BannerAd, InlineAd } from '@/components/AdSense'

const pricingPlans = [
  {
    name: 'Free',
    price: '무료',
    period: '',
    description: '체험용으로 완벽한 플랜',
    features: [
      '월 3편의 영화 제작',
      '720p 화질',
      '최대 3분 영상',
      '기본 장르 3가지',
      '개인 갤러리',
      '기본 지원'
    ],
    limitations: [
      '워터마크 포함',
      '다운로드 제한',
      '공유 기능 제한'
    ],
    buttonText: '무료로 시작',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Creator',
    price: '₩9,900',
    period: '/월',
    description: '개인 크리에이터를 위한 플랜',
    features: [
      '월 10편의 영화 제작',
      '1080p 화질',
      '최대 10분 영상',
      '모든 장르 선택 가능',
      '워터마크 없음',
      '무제한 다운로드',
      '소셜 공유 기능',
      '우선 지원'
    ],
    limitations: [],
    buttonText: '시작하기',
    buttonVariant: 'default' as const,
    popular: true
  },
  {
    name: 'Pro',
    price: '₩19,900',
    period: '/월',
    description: '전문 크리에이터를 위한 플랜',
    features: [
      '무제한 영화 제작',
      '4K 화질',
      '최대 30분 영상',
      '커스텀 장르 생성',
      '고급 편집 옵션',
      '음성 클로닝',
      '비즈니스 라이선스',
      '전용 지원팀',
      'API 액세스'
    ],
    limitations: [],
    buttonText: '시작하기',
    buttonVariant: 'default' as const,
    popular: false
  }
]

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PricingButton({ plan, isAnnual }: { plan: any, isAnnual: boolean }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/auth/signin'
      return
    }

    if (plan.name === 'Free') {
      window.location.href = '/create-movie'
      return
    }

    setIsLoading(true)
    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe를 로드할 수 없습니다.')

      // Stripe Price ID 매핑 (실제 Stripe에서 생성한 ID로 교체)
      const priceIds = {
        'Creator': isAnnual ? 'price_creator_annual' : 'price_creator_monthly',
        'Pro': isAnnual ? 'price_pro_annual' : 'price_pro_monthly'
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceIds[plan.name as keyof typeof priceIds],
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`
        }),
      })

      if (!response.ok) {
        throw new Error('결제 세션 생성에 실패했습니다.')
      }

      const { sessionId } = await response.json()
      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('결제 오류:', error)
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isLoading}
      variant={plan.buttonVariant}
      className={`w-full ${
        plan.popular 
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
          : plan.buttonVariant === 'outline'
          ? 'border-purple-200 hover:bg-purple-50'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      }`}
    >
      {isLoading ? '처리중...' : plan.buttonText}
    </Button>
  )
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const getDiscountedPrice = (monthlyPrice: string) => {
    if (monthlyPrice === '무료') return monthlyPrice
    const price = parseInt(monthlyPrice.replace('₩', '').replace(',', ''))
    const annualPrice = Math.round(price * 12 * 0.8) // 20% 할인
    return `₩${annualPrice.toLocaleString()}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <BannerAd />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              당신에게 맞는 플랜을 선택하세요
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI가 만드는 개인 맞춤형 영화의 세계로 떠나보세요
            </p>
            
            {/* 월간/연간 토글 */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                월간
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                연간
              </span>
              {isAnnual && (
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  20% 절약!
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`relative p-8 ${
                  plan.popular 
                    ? 'border-2 border-purple-500 shadow-xl scale-105' 
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 text-sm font-medium rounded-full">
                      인기
                    </span>
                  </div>
                )}

                {/* 플랜 헤더 */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {isAnnual && plan.price !== '무료' 
                        ? getDiscountedPrice(plan.price)
                        : plan.price
                      }
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 text-lg">
                        {isAnnual ? '/년' : plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* 기능 목록 */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-start mb-2">
                          <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA 버튼 */}
                <PricingButton plan={plan} isAnnual={isAnnual} />
              </Card>
            ))}
          </div>

          <InlineAd />

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              자주 묻는 질문
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 text-left">
                <h3 className="font-semibold mb-2">영화 제작에 얼마나 걸리나요?</h3>
                <p className="text-gray-600 text-sm">
                  일반적으로 5-10분 정도 소요되며, 영상의 길이와 복잡성에 따라 달라질 수 있습니다.
                </p>
              </Card>
              
              <Card className="p-6 text-left">
                <h3 className="font-semibold mb-2">언제든지 플랜을 변경할 수 있나요?</h3>
                <p className="text-gray-600 text-sm">
                  네, 언제든지 업그레이드하거나 다운그레이드할 수 있습니다. 변경 사항은 즉시 적용됩니다.
                </p>
              </Card>
              
              <Card className="p-6 text-left">
                <h3 className="font-semibold mb-2">제작된 영화의 저작권은 누구에게 있나요?</h3>
                <p className="text-gray-600 text-sm">
                  제작된 모든 영화의 저작권은 사용자에게 있습니다. 마음껏 사용하고 공유하세요.
                </p>
              </Card>
              
              <Card className="p-6 text-left">
                <h3 className="font-semibold mb-2">환불 정책은 어떻게 되나요?</h3>
                <p className="text-gray-600 text-sm">
                  첫 결제 후 30일 이내에 100% 환불이 가능합니다. 만족하지 않으시면 언제든지 연락주세요.
                </p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                준비되셨나요?
              </h3>
              <p className="text-gray-600 mb-6">
                지금 바로 첫 번째 영화를 무료로 만들어보세요
              </p>
              <Link href="/create">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                >
                  무료로 시작하기
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}