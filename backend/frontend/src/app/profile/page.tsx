'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Settings, Film, Trophy, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user, profile, stats, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.username || user.email?.split('@')[0]}</h1>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400">가입일: {new Date(user.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Film className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats?.total_movies || 0}</div>
              <div className="text-sm text-gray-500">총 영화</div>
            </Card>
            <Card className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{profile?.subscription_tier || 'free'}</div>
              <div className="text-sm text-gray-500">구독 플랜</div>
            </Card>
            <Card className="p-4 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold">{stats?.movies_this_month || 0}</div>
              <div className="text-sm text-gray-500">이번 달 제작</div>
            </Card>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              대시보드
            </Button>
            <Button
              onClick={() => router.push('/pricing')}
              variant="outline"
              className="flex-1"
            >
              플랜 업그레이드
            </Button>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}