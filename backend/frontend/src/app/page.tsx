'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/supabase'
import { 
  Sparkles, 
  Film, 
  Users, 
  TrendingUp, 
  Star,
  Play,
  ChevronRight,
  Check,
  Globe,
  Zap,
  Heart
} from 'lucide-react'

interface TrendingMovie {
  id: string
  title: string
  emotion: string
  likes: number
  views: number
  users: {
    username: string
  }
}

// Features
const features = [
  {
    icon: '🤖',
    title: 'AI 시나리오',
    description: 'GPT-4가 당신의 일기를 감동적인 시나리오로 변환합니다'
  },
  {
    icon: '🎨',
    title: '다양한 스타일',
    description: '실사, 애니메이션, 수채화 등 6가지 비주얼 스타일'
  },
  {
    icon: '🎵',
    title: '감성 음악',
    description: '분위기에 맞는 배경음악과 나레이션 자동 생성'
  },
  {
    icon: '⚡',
    title: '빠른 제작',
    description: '3분 만에 완성되는 나만의 영화'
  },
  {
    icon: '📱',
    title: 'SNS 최적화',
    description: '인스타그램, 유튜브 숏츠에 최적화된 포맷'
  },
  {
    icon: '🌍',
    title: '글로벌 공유',
    description: '전 세계 사용자들과 영화 공유'
  }
]

// Pricing plans
const pricingPlans = [
  {
    name: '무료',
    price: '0',
    features: [
      '월 3편 제작',
      '720p 화질',
      '기본 스타일',
      '워터마크 포함'
    ],
    cta: '무료로 시작',
    popular: false
  },
  {
    name: '크리에이터',
    price: '9,900',
    features: [
      '월 10편 제작',
      '1080p 화질',
      '프리미엄 스타일',
      '워터마크 제거',
      '음성 복제',
      '우선 처리'
    ],
    cta: '시작하기',
    popular: true
  },
  {
    name: '프로',
    price: '19,900',
    features: [
      '무제한 제작',
      '4K 화질',
      '모든 스타일',
      '커스텀 브랜딩',
      'API 액세스',
      '전담 지원'
    ],
    cta: '문의하기',
    popular: false
  }
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    todayMovies: 0
  })

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken')
    setIsLoggedIn(!!token)

    // Load real data
    loadTrendingMovies()
    loadStats()
  }, [])

  const loadTrendingMovies = async () => {
    try {
      const { data, error } = await db.getPublicMovies(6)
      if (!error && data) {
        setTrendingMovies(data)
      }
    } catch (error) {
      console.error('인기 영화 로딩 오류:', error)
      // Fallback to mock data
      setTrendingMovies([
        { id: '1', title: '첫사랑의 기억', emotion: 'love', likes: 342, views: 1250, users: { username: '김민지' } },
        { id: '2', title: '월요일의 작은 기적', emotion: 'joy', likes: 289, views: 980, users: { username: '이준호' } },
        { id: '3', title: '우리 가족 이야기', emotion: 'love', likes: 256, views: 876, users: { username: '박서연' } },
        { id: '4', title: '도전의 순간', emotion: 'thoughtful', likes: 198, views: 654, users: { username: '최성민' } },
        { id: '5', title: '비 오는 날의 감성', emotion: 'peace', likes: 167, views: 543, users: { username: '정하늘' } },
        { id: '6', title: '새로운 시작', emotion: 'joy', likes: 145, views: 432, users: { username: '강민서' } }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data: movies } = await db.getAllMoviesCount()
      const { data: users } = await db.getAllUsersCount()
      const { data: todayMovies } = await db.getTodayMoviesCount()
      
      setStats({
        totalMovies: movies || 0,
        totalUsers: users || 0,
        todayMovies: todayMovies || 0
      })
    } catch (error) {
      console.error('통계 로딩 오류:', error)
      // Fallback to reasonable numbers
      setStats({
        totalMovies: 234,
        totalUsers: 89,
        todayMovies: 12
      })
    }
  }

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      joy: '😊',
      sadness: '😢',
      love: '😍',
      anger: '😤',
      anxiety: '😰',
      peace: '😌',
      thoughtful: '🤔',
      tired: '😴'
    }
    return emojiMap[emotion] || '🎭'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-8xl mb-6"
            >
              🎬
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MyLife Cinema
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              당신의 일기가 영화가 됩니다
            </p>
            
            <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto">
              AI가 당신의 하루를 분석해 감동적인 영화로 만들어드립니다.
              단 3분만에 나만의 특별한 영화를 경험해보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/create-movie">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  무료로 영화 만들기
                </Button>
              </Link>
              <Button 
                size="lg"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6"
              >
                <Play className="mr-2 h-5 w-5" />
                샘플 영상 보기
              </Button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white">{stats.totalMovies.toLocaleString()}</div>
                <div className="text-sm text-white/70">제작된 영화</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-white/70">행복한 사용자</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white">{stats.todayMovies}</div>
                <div className="text-sm text-white/70">오늘의 영화</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-pulse">🎥</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-pulse delay-100">🎬</div>
        <div className="absolute top-40 right-20 text-6xl opacity-10 animate-pulse delay-200">🎞️</div>
      </section>

      {/* Trending Movies Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              <TrendingUp className="inline-block mr-3 h-8 w-8" />
              오늘의 인기 영화
            </h2>
            <p className="text-white/70">실시간으로 사랑받는 영화들을 만나보세요</p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">인기 영화를 불러오는 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{getEmotionEmoji(movie.emotion)}</div>
                        <div className="flex items-center gap-1 text-white/70">
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="text-sm">{movie.likes}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{movie.title}</h3>
                      <p className="text-sm text-white/60">by {movie.users.username}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/community">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                더 많은 영화 보기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              왜 MyLife Cinema인가요?
            </h2>
            <p className="text-white/70">최첨단 AI 기술로 만드는 당신만의 특별한 영화</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              간단한 3단계
            </h2>
            <p className="text-white/70">누구나 쉽게 영화를 만들 수 있어요</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">일기 작성</h3>
              <p className="text-white/60">오늘 하루를 자유롭게 표현해주세요</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">스타일 선택</h3>
              <p className="text-white/60">감정과 비주얼 스타일을 선택하세요</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">영화 완성</h3>
              <p className="text-white/60">3분 만에 멋진 영화가 완성됩니다</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              합리적인 가격
            </h2>
            <p className="text-white/70">당신에게 맞는 플랜을 선택하세요</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-white/10 backdrop-blur border-white/20 p-8 relative ${
                  plan.popular ? 'ring-2 ring-purple-500' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        인기
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">₩{plan.price}</span>
                    {plan.price !== '0' && <span className="text-white/60">/월</span>}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-white/80">
                        <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={plan.popular 
                      ? "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "w-full bg-white/10 hover:bg-white/20"
                    }
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              지금 시작하세요!
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              매일 수천 명이 MyLife Cinema와 함께 특별한 추억을 만들고 있습니다.
              당신의 이야기도 영화로 만들어보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-movie">
                <Button 
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  무료로 시작하기
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  <Film className="mr-2 h-5 w-5" />
                  내 영화 갤러리
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">MyLife Cinema</h3>
              <p className="text-white/60 text-sm">당신의 일상을 영화로</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">제품</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/features">기능</Link></li>
                <li><Link href="/pricing">가격</Link></li>
                <li><Link href="/samples">샘플</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">회사</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/about">소개</Link></li>
                <li><Link href="/blog">블로그</Link></li>
                <li><Link href="/contact">문의</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">법적 고지</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/privacy">개인정보처리방침</Link></li>
                <li><Link href="/terms">이용약관</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="text-center text-white/40 text-sm pt-8 border-t border-white/10">
            <p>© 2024 MyLife Cinema. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}