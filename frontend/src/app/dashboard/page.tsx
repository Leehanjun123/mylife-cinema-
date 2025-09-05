'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/supabase'
import { BannerAd, InlineAd } from '@/components/AdSense'
import Link from 'next/link'
import { Trash2, Share, Download, Play, Eye } from 'lucide-react'

export default function DashboardPage() {
  const { movies, setMovies, isLoading, setLoading, setError } = useAppStore()
  const { user, profile, stats, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userMovies, setUserMovies] = useState<any[]>([])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/dashboard')
    }
  }, [user, authLoading, router])

  // Load user's movies
  useEffect(() => {
    if (user) {
      loadUserMovies()
    }
  }, [user])

  const loadUserMovies = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const { data: movies, error } = await db.getMovies(user.id)
      
      if (error) {
        console.error('Failed to load movies:', error)
        setError('영화 목록을 불러오는데 실패했습니다')
        setUserMovies([])
      } else {
        setUserMovies(movies || [])
        setMovies(movies || [])
      }
    } catch (error) {
      console.error('Failed to load movies:', error)
      setError('영화 목록을 불러오는데 실패했습니다')
      setUserMovies([])
    } finally {
      setLoading(false)
    }
  }

  const deleteMovie = async (movieId: string) => {
    if (!user || !confirm('정말로 이 영화를 삭제하시겠습니까?')) return

    try {
      const { error } = await db.deleteMovie(movieId, user.id)
      if (error) {
        console.error('Failed to delete movie:', error)
        setError('영화 삭제에 실패했습니다')
      } else {
        // Remove from local state
        setUserMovies(prev => prev.filter(movie => movie.id !== movieId))
        setMovies(prev => prev.filter(movie => movie.id !== movieId))
      }
    } catch (error) {
      console.error('Failed to delete movie:', error)
      setError('영화 삭제에 실패했습니다')
    }
  }

  const shareMovie = async (movie: any, platform: string) => {
    // Implement sharing logic
    const shareUrl = `${window.location.origin}/movie/${movie.id}`
    const shareText = `방금 MyLife Cinema로 "${movie.title}" 영화를 만들었어요! 🎬`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to copy link
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 복사되었습니다!')
    }
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Redirect if not logged in
  if (!user) {
    return null
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

          {/* Banner Ad */}
          <BannerAd className="mb-8" />

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🎬</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">총 영화 수</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.movies_created || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-800">{stats?.movies_this_month || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">연속 기록</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.streak_days || 0}일</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Movies Grid */}
          {userMovies.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">아직 영화가 없어요</h3>
              <p className="text-gray-600 mb-6">
                첫 번째 일기를 작성하고 멋진 영화를 만들어보세요
              </p>
              <Link href="/create-movie">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  첫 영화 만들기
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userMovies.map((movie, index) => (
                  <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* 썸네일 또는 비디오 */}
                    <div className="aspect-video bg-gray-200 relative overflow-hidden group">
                      {(movie.video_url || movie.videoUrl) ? (
                        <video 
                          src={movie.video_url || movie.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause()
                            e.currentTarget.currentTime = 0
                          }}
                        />
                      ) : movie.thumbnail_url ? (
                        <img 
                          src={movie.thumbnail_url} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                          <span className="text-4xl">{getEmotionEmoji(movie.emotion)}</span>
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      {movie.status === 'completed' && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      {/* 상태 배지 */}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(movie.status)}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => deleteMovie(movie.id)}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 내용 */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">{movie.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {movie.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <span>{movie.genre || 'AI 생성'}</span>
                          {movie.likes > 0 && (
                            <>
                              <span>•</span>
                              <span>❤️ {movie.likes}</span>
                            </>
                          )}
                        </span>
                        <span>{new Date(movie.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {movie.status === 'completed' && (
                          <>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                // 비디오 URL이 있으면 직접 재생
                                if (movie.video_url || movie.videoUrl) {
                                  window.open(movie.video_url || movie.videoUrl, '_blank')
                                } else {
                                  // 없으면 create 페이지로 이동
                                  router.push('/create')
                                }
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              재생
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => shareMovie(movie, 'general')}
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {movie.status === 'processing' && (
                          <Button size="sm" variant="outline" disabled className="flex-1">
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                            생성 중...
                          </Button>
                        )}
                        {movie.status === 'failed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => router.push('/create-movie')}
                          >
                            다시 시도
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Insert ad after every 3rd movie */}
                    {(index + 1) % 3 === 0 && index < userMovies.length - 1 && (
                      <div className="col-span-full">
                        <InlineAd />
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Load more button if we have many movies */}
              {userMovies.length >= 9 && (
                <div className="text-center mb-8">
                  <Button variant="outline">더 많은 영화 보기</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}