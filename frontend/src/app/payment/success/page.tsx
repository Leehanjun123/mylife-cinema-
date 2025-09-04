'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('결제 확인 중...')

  useEffect(() => {
    console.log('Payment success page mounted')
    
    // Multiple failsafe timers
    const timer1 = setTimeout(() => {
      console.log('Timer 1: Stopping loading after 1 second')
      setLoading(false)
    }, 1000)
    
    const timer2 = setTimeout(() => {
      setLoadingText('잠시만 기다려주세요...')
    }, 500)
    
    // Emergency override - 무조건 3초 후 종료
    const emergencyTimer = setTimeout(() => {
      console.log('Emergency timer: Force stopping loading')
      setLoading(false)
    }, 3000)
    
    // Get session ID without useSearchParams (Suspense 회피)
    const sessionId = typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search).get('session_id')
      : null
    
    console.log('Session ID:', sessionId)
    
    // Profile refresh with timeout
    if (refreshProfile) {
      const refreshTimeout = setTimeout(() => {
        console.log('Profile refresh timeout - continuing anyway')
      }, 2000)
      
      refreshProfile()
        .catch(err => console.error('Profile refresh error:', err))
        .finally(() => clearTimeout(refreshTimeout))
    }
    
    // Fallback on window focus
    const handleFocus = () => {
      console.log('Window focused - stopping loading')
      setLoading(false)
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(emergencyTimer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">{loadingText}</p>
        </div>
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