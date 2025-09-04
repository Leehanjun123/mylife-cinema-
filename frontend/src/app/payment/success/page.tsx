'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id')
      
      if (sessionId) {
        // Refresh user profile to get updated subscription
        try {
          if (refreshProfile) {
            await refreshProfile()
          }
        } catch (error) {
          console.error('Profile refresh error:', error)
        }
        
        // Set a timeout to ensure loading stops
        setTimeout(() => {
          setLoading(false)
        }, 1500)
      } else {
        // No session ID, just show success anyway (Stripe redirect might not include it)
        setLoading(false)
      }
    }
    
    handlePaymentSuccess()
  }, [searchParams, refreshProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white/10 backdrop-blur border-white/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            결제가 완료되었습니다!
          </h1>
          
          <p className="text-white/80 mb-8">
            프리미엄 기능이 활성화되었습니다. 
            이제 무제한으로 영화를 제작할 수 있습니다.
          </p>

          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-3">활성화된 기능:</h3>
            <ul className="text-left text-white/80 space-y-2">
              <li className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                월 10편 또는 무제한 영화 제작
              </li>
              <li className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                고화질 1080p/4K 영상
              </li>
              <li className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                모든 프리미엄 스타일 사용 가능
              </li>
              <li className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                워터마크 제거
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/create-movie" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                영화 만들기 시작
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                대시보드로 이동
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}