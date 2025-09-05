'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function PaymentSuccessPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // 결제 완료 후 프로필 업데이트 시도
  useEffect(() => {
    const updateProfile = async () => {
      if (user && retryCount < 5) {
        setIsRefreshing(true)
        try {
          // Supabase에서 직접 최신 데이터 가져오기
          const { data, error } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()
          
          if (data && data.subscription_tier !== 'free') {
            console.log('✅ 구독 업데이트 확인:', data.subscription_tier)
            await refreshProfile()
          } else {
            // 아직 업데이트 안됨 - 3초 후 재시도
            console.log('⏳ 구독 업데이트 대기 중... 재시도:', retryCount + 1)
            setTimeout(() => setRetryCount(prev => prev + 1), 3000)
          }
        } catch (error) {
          console.error('프로필 업데이트 오류:', error)
        } finally {
          setIsRefreshing(false)
        }
      }
    }
    
    updateProfile()
  }, [user, retryCount])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await refreshProfile()
    setTimeout(() => setIsRefreshing(false), 1000)
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
            {profile && profile.subscription_tier !== 'free' ? (
              <div className="mb-4 p-3 bg-green-500/20 rounded-lg">
                <p className="text-sm text-green-300">
                  ✅ {profile.subscription_tier === 'creator' ? '크리에이터' : '프로'} 플랜 활성화됨
                </p>
              </div>
            ) : isRefreshing ? (
              <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⏳ 결제 확인 중... (시도 {retryCount}/5)
                </p>
              </div>
            ) : null}

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

            {profile && profile.subscription_tier === 'free' && (
              <Button 
                onClick={handleManualRefresh} 
                variant="ghost" 
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
                    업데이트 확인 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    수동으로 업데이트 확인
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}