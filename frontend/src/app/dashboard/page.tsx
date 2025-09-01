'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { apiClient, Movie } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { movies, setMovies, isLoading, setLoading, setError } = useAppStore()
  const [stats, setStats] = useState({
    totalMovies: 0,
    thisMonth: 0,
    completedMovies: 0
  })

  useEffect(() => {
    loadMovies()
  }, [])

  useEffect(() => {
    // 통계 계산
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const thisMonthMovies = movies.filter(movie => 
      new Date(movie.createdAt) >= thisMonthStart
    ).length

    const completedMovies = movies.filter(movie => 
      movie.status === 'completed'
    ).length

    setStats({
      totalMovies: movies.length,
      thisMonth: thisMonthMovies,
      completedMovies
    })
  }, [movies])

  const loadMovies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 실제로는 사용자별로 영화를 가져와야 함
      // 지금은 임시 데이터 사용
      const mockMovies: Movie[] = [
        {
          id: '1',
          title: '2024-08-31 일기',
          content: '오늘은 정말 좋은 하루였다...',
          emotion: 'joy',
          genre: '로맨스',
          status: 'completed',
          videoUrl: 'https://example.com/video1.mp4',
          thumbnailUrl: 'https://picsum.photos/400/225?random=1',
          createdAt: '2024-08-31T10:00:00Z'
        },
        {
          id: '2',
          title: '2024-08-30 일기',
          content: '오늘은 조금 우울했던 하루...',
          emotion: 'sadness',
          genre: '드라마',
          status: 'completed',
          videoUrl: 'https://example.com/video2.mp4',
          thumbnailUrl: 'https://picsum.photos/400/225?random=2',
          createdAt: '2024-08-30T15:30:00Z'
        },
        {
          id: '3',
          title: '2024-08-29 일기',
          content: '새로운 도전을 시작했다...',
          emotion: 'thoughtful',
          genre: '액션',
          status: 'processing',
          createdAt: '2024-08-29T20:15:00Z'
        }
      ]
      
      setMovies(mockMovies)
    } catch (error) {
      console.error('Failed to load movies:', error)
      setError('영화 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Movie['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            완성
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            생성중
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
            실패
          </span>
        )
      default:
        return null
    }
  }

  const getEmotionEmoji = (emotion: string) => {
    const emotionMap: { [key: string]: string } = {
      joy: '😊',
      sadness: '😢',
      love: '😍',
      anger: '😤',
      anxiety: '😰',
      peace: '😌',
      thoughtful: '🤔',
      tired: '😴'
    }
    return emotionMap[emotion] || '😊'
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">영화 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                나의 영화 갤러리
              </h1>
              <p className="text-gray-600">
                당신의 일상이 만들어낸 특별한 영화들을 만나보세요
              </p>
            </div>
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                + 새 영화 만들기
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🎬</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">총 영화 수</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalMovies}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">이번 달</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.thisMonth}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">완성된 영화</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completedMovies}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Movies Grid */}
          {movies.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">아직 영화가 없어요</h3>
              <p className="text-gray-600 mb-6">
                첫 번째 일기를 작성하고 멋진 영화를 만들어보세요
              </p>
              <Link href="/create">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  첫 영화 만들기
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 썸네일 */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    {movie.thumbnailUrl ? (
                      <img 
                        src={movie.thumbnailUrl} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                        <span className="text-4xl">{getEmotionEmoji(movie.emotion)}</span>
                      </div>
                    )}
                    
                    {/* 상태 배지 */}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(movie.status)}
                    </div>
                  </div>
                  
                  {/* 내용 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {movie.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{movie.genre}</span>
                      <span>{new Date(movie.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {movie.status === 'completed' && (
                        <Button size="sm" className="flex-1">
                          재생
                        </Button>
                      )}
                      {movie.status === 'processing' && (
                        <Button size="sm" variant="outline" disabled className="flex-1">
                          생성 중...
                        </Button>
                      )}
                      {movie.status === 'failed' && (
                        <Button size="sm" variant="outline" className="flex-1">
                          다시 시도
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        공유
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}