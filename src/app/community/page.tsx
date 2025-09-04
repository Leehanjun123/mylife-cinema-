'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/supabase'
import { BannerAd, InlineAd } from '@/components/AdSense'
import { trackEvent } from '@/components/Analytics'
import { Play, Heart, MessageCircle, Share2, Search, Filter, TrendingUp, Clock, Eye } from 'lucide-react'
import Link from 'next/link'

interface PublicMovie {
  id: string
  title: string
  content: string
  emotion: string
  genre: string
  style: string
  thumbnail_url?: string
  video_url?: string
  likes: number
  views: number
  created_at: string
  users: {
    username: string
    avatar_url?: string
  }
  isLiked?: boolean
}

const sortOptions = [
  { id: 'trending', label: '인기순', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'recent', label: '최신순', icon: <Clock className="w-4 h-4" /> },
  { id: 'hot', label: '화제', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'views', label: '조회순', icon: <Eye className="w-4 h-4" /> }
]

const emotionFilters = [
  { id: 'all', label: '전체', emoji: '🎭' },
  { id: 'joy', label: '기쁨', emoji: '😊' },
  { id: 'sadness', label: '슬픔', emoji: '😢' },
  { id: 'love', label: '사랑', emoji: '😍' },
  { id: 'thoughtful', label: '성찰', emoji: '🤔' },
  { id: 'peace', label: '평온', emoji: '😌' }
]

export default function CommunityPage() {
  const [movies, setMovies] = useState<PublicMovie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<PublicMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSort, setSelectedSort] = useState('trending')
  const [selectedEmotion, setSelectedEmotion] = useState('all')
  const [likedMovies, setLikedMovies] = useState<Set<string>>(new Set())
  
  const { user } = useAuth()

  useEffect(() => {
    loadPublicMovies()
    if (user) {
      loadLikedMovies()
    }
  }, [user])

  useEffect(() => {
    filterAndSortMovies()
  }, [movies, searchQuery, selectedSort, selectedEmotion])

  const loadPublicMovies = async () => {
    try {
      setLoading(true)
      const { data, error } = await db.getPublicMovies(50)
      
      if (error) {
        console.error('공개 영화 로딩 실패:', error)
      } else {
        setMovies(data || [])
      }
    } catch (error) {
      console.error('공개 영화 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLikedMovies = async () => {
    if (!user) return

    try {
      const { data, error } = await db.getUserLikedMovies(user.id)
      if (!error && data) {
        setLikedMovies(new Set(data.map((like: any) => like.movie_id)))
      }
    } catch (error) {
      console.error('좋아요 목록 로딩 오류:', error)
    }
  }

  const filterAndSortMovies = () => {
    let filtered = [...movies]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.users.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Emotion filter
    if (selectedEmotion !== 'all') {
      filtered = filtered.filter(movie => movie.emotion === selectedEmotion)
    }

    // Sort
    switch (selectedSort) {
      case 'trending':
        filtered.sort((a, b) => {
          const scoreA = (a.likes * 3) + (a.views * 1) + (new Date(a.created_at).getTime() / 1000000)
          const scoreB = (b.likes * 3) + (b.views * 1) + (new Date(b.created_at).getTime() / 1000000)
          return scoreB - scoreA
        })
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'hot':
        filtered.sort((a, b) => {
          const dayInMs = 24 * 60 * 60 * 1000
          const recentA = Date.now() - new Date(a.created_at).getTime() < 3 * dayInMs
          const recentB = Date.now() - new Date(b.created_at).getTime() < 3 * dayInMs
          if (recentA && !recentB) return -1
          if (!recentA && recentB) return 1
          return b.likes - a.likes
        })
        break
      case 'views':
        filtered.sort((a, b) => b.views - a.views)
        break
    }

    setFilteredMovies(filtered)
  }

  const handleLike = async (movieId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const isLiked = likedMovies.has(movieId)
      
      if (isLiked) {
        await db.unlikeMovie(movieId, user.id)
        setLikedMovies(prev => {
          const newSet = new Set(prev)
          newSet.delete(movieId)
          return newSet
        })
      } else {
        await db.likeMovie(movieId, user.id)
        setLikedMovies(prev => new Set(prev).add(movieId))
        trackEvent('movie_liked', { movie_id: movieId })
      }

      // Update local movie likes count
      setMovies(prev => prev.map(movie => 
        movie.id === movieId 
          ? { ...movie, likes: movie.likes + (isLiked ? -1 : 1) }
          : movie
      ))
    } catch (error) {
      console.error('좋아요 처리 오류:', error)
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">커뮤니티 영화를 불러오는 중...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🎬 커뮤니티 영화관
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              다른 사용자들의 감동적인 일상 영화를 만나보세요
            </p>
            
            <div className="grid md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{movies.length}</div>
                <div className="text-sm text-gray-500">공개 영화</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {movies.reduce((sum, movie) => sum + movie.likes, 0)}
                </div>
                <div className="text-sm text-gray-500">총 좋아요</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {movies.reduce((sum, movie) => sum + movie.views, 0)}
                </div>
                <div className="text-sm text-gray-500">총 조회수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(movies.map(movie => movie.users.username)).size}
                </div>
                <div className="text-sm text-gray-500">창작자</div>
              </div>
            </div>
          </div>

          {/* Banner Ad */}
          <BannerAd className="mb-12" />

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="영화, 창작자, 장르 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort and Filter Options */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Sort Options */}
              <div className="flex gap-2">
                {sortOptions.map(option => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={selectedSort === option.id ? 'default' : 'outline'}
                    onClick={() => setSelectedSort(option.id)}
                    className="flex items-center gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Emotion Filter */}
              <div className="flex gap-2">
                {emotionFilters.map(emotion => (
                  <Button
                    key={emotion.id}
                    size="sm"
                    variant={selectedEmotion === emotion.id ? 'default' : 'outline'}
                    onClick={() => setSelectedEmotion(emotion.id)}
                  >
                    {emotion.emoji} {emotion.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Movies Grid */}
          {filteredMovies.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '공개된 영화가 없어요'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? '다른 검색어를 시도해보세요' 
                  : '첫 번째 영화를 만들고 커뮤니티에 공유해보세요'}
              </p>
              {!searchQuery && (
                <Link href="/create-movie">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    첫 영화 만들기
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.map((movie, index) => (
                <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden group">
                    {movie.thumbnail_url ? (
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Stats overlay */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {movie.views}
                      </span>
                      <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        {movie.likes}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                        {movie.users.avatar_url ? (
                          <img 
                            src={movie.users.avatar_url} 
                            alt={movie.users.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {movie.users.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{movie.users.username}</p>
                        <p className="text-xs text-gray-500">{movie.genre}</p>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 truncate">{movie.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {movie.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={likedMovies.has(movie.id) ? 'default' : 'outline'}
                          onClick={() => handleLike(movie.id)}
                          className="flex items-center gap-1"
                        >
                          <Heart className={`w-3 h-3 ${likedMovies.has(movie.id) ? 'fill-current text-red-400' : ''}`} />
                          {movie.likes}
                        </Button>
                        
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {new Date(movie.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  {/* Insert ad after every 6th movie */}
                  {(index + 1) % 6 === 0 && index < filteredMovies.length - 1 && (
                    <div className="col-span-full">
                      <InlineAd />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {filteredMovies.length >= 20 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                더 많은 영화 보기
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}