'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/supabase'
import { socketManager } from '@/lib/socket'
import Link from 'next/link'
import { 
  Sparkles, 
  Film, 
  Music, 
  Palette, 
  Share2, 
  Download, 
  Heart,
  MessageCircle,
  TrendingUp,
  Clock,
  Mic,
  Camera,
  ChevronRight,
  ChevronLeft,
  Zap,
  Star,
  Gift
} from 'lucide-react'

// Enhanced emotions with gradients
const emotions = [
  { emoji: '😊', label: '기쁨', value: 'joy', color: 'from-yellow-400 to-orange-400' },
  { emoji: '😢', label: '슬픔', value: 'sadness', color: 'from-blue-400 to-indigo-400' },
  { emoji: '😍', label: '사랑', value: 'love', color: 'from-pink-400 to-red-400' },
  { emoji: '😤', label: '분노', value: 'anger', color: 'from-red-500 to-orange-500' },
  { emoji: '😰', label: '불안', value: 'anxiety', color: 'from-purple-400 to-pink-400' },
  { emoji: '😌', label: '평온', value: 'peace', color: 'from-green-400 to-teal-400' },
  { emoji: '🤔', label: '생각', value: 'thoughtful', color: 'from-gray-400 to-slate-400' },
  { emoji: '😴', label: '피곤', value: 'tired', color: 'from-indigo-300 to-purple-300' },
  { emoji: '🤗', label: '감동', value: 'touched', color: 'from-amber-400 to-yellow-400' },
  { emoji: '😎', label: '자신감', value: 'confident', color: 'from-cyan-400 to-blue-400' },
  { emoji: '🥳', label: '축하', value: 'celebration', color: 'from-purple-400 to-pink-500' },
  { emoji: '😔', label: '아쉬움', value: 'regret', color: 'from-slate-400 to-gray-500' }
]

// Visual styles
const visualStyles = [
  { id: 'realistic', name: '실사', icon: '🎬', description: '영화같은 현실감' },
  { id: 'animation', name: '애니메이션', icon: '🎨', description: '부드러운 애니메이션' },
  { id: 'watercolor', name: '수채화', icon: '🖌️', description: '감성적인 수채화' },
  { id: 'vintage', name: '빈티지', icon: '📽️', description: '클래식한 필름룩' },
  { id: 'cyberpunk', name: '사이버펑크', icon: '🤖', description: '미래적인 네온' },
  { id: 'minimalist', name: '미니멀', icon: '⬜', description: '깔끔한 구성' }
]

// Music moods
const musicMoods = [
  { id: 'upbeat', name: '경쾌한', icon: '🎵' },
  { id: 'emotional', name: '감성적인', icon: '🎹' },
  { id: 'epic', name: '웅장한', icon: '🎺' },
  { id: 'calm', name: '잔잔한', icon: '🎶' },
  { id: 'mysterious', name: '신비로운', icon: '🎻' },
  { id: 'nostalgic', name: '향수어린', icon: '🎸' }
]

// Daily prompts
const dailyPrompts = [
  "오늘 가장 감사했던 순간은?",
  "나를 웃게 만든 일은?",
  "오늘의 작은 성취는?",
  "누군가에게 하고 싶은 말은?",
  "오늘 배운 교훈은?",
  "가장 기억에 남는 대화는?"
]

export default function CreateMoviePage() {
  const [step, setStep] = useState(1)
  const [diaryContent, setDiaryContent] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [selectedMusic, setSelectedMusic] = useState('emotional')
  const [movieLength, setMovieLength] = useState('short') // short (30s) or full (3min)
  const [isRecording, setIsRecording] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [todayPrompt] = useState(dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)])
  const [currentMovieId, setCurrentMovieId] = useState<string | null>(null)
  
  const router = useRouter()
  const { user, profile, stats, loading, canCreateMovie, getRemainingFreeMovies, refreshStats } = useAuth()
  
  const {
    isGenerating,
    generationProgress,
    generationStatus,
    setIsGenerating,
    setGenerationProgress,
    setGenerationStatus,
    setError,
    addMovie,
    currentMovie
  } = useAppStore()

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      socketManager.connect(apiUrl)
      socketManager.manualConnect()
    }
  }, [user])

  // Update word count
  useEffect(() => {
    setWordCount(diaryContent.length)
  }, [diaryContent])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/signin?redirect=/create-movie')
    }
  }, [user, loading, router])

  // Show loading if auth is still loading
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  const handleGenerateMovie = async () => {
    // Check if user can create movie
    if (!canCreateMovie()) {
      alert('무료 영화 제작 횟수를 모두 사용했습니다. 프리미엄으로 업그레이드하세요!')
      router.push('/pricing')
      return
    }

    try {
      setIsGenerating(true)
      setStep(4) // Go to processing step
      setGenerationProgress(0)
      setGenerationStatus('당신의 이야기를 분석하고 있어요...')
      setError(null)

      // Create movie in database first
      const movieData = {
        user_id: user!.id,
        title: `${new Date().toLocaleDateString('ko-KR')} 일기`,
        content: diaryContent,
        emotion: selectedEmotion,
        style: selectedStyle,
        music: selectedMusic,
        length: movieLength === 'short' ? 30 : movieLength === 'full' ? 180 : 60,
        status: 'processing' as const
      }

      const { data: movie, error: dbError } = await db.createMovie(movieData)
      
      if (dbError || !movie) {
        throw new Error('영화 데이터베이스 저장에 실패했습니다.')
      }

      setCurrentMovieId(movie.id)
      
      // Add to local store
      addMovie({
        id: movie.id,
        title: movie.title,
        content: movie.content,
        emotion: movie.emotion,
        genre: 'AI 분석중',
        style: movie.style,
        music: movie.music,
        status: movie.status,
        createdAt: movie.created_at
      })

      // Call backend API to start generation
      let data
      try {
        // Backend URL 설정 (환경변수 또는 기본값)
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const apiEndpoint = backendUrl ? `${backendUrl}/movies/create` : '/api/movies/create'
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            movieId: movie.id,
            diary: diaryContent,
            emotion: selectedEmotion,
            style: selectedStyle,
            music: selectedMusic,
            length: movieLength,
            userId: user!.id
          })
        })

        if (response.ok) {
          data = await response.json()
          if (!data.success) {
            throw new Error(data.message || '영화 생성에 실패했습니다.')
          }
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      } catch (backendError) {
        console.log('API 호출 실패:', backendError)
        
        // 백엔드가 연결되지 않은 경우 임시 처리
        setGenerationStatus('📋 현재 백엔드 서버에 연결할 수 없습니다.')
        setGenerationProgress(50)
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setGenerationStatus('⚠️  임시 모드로 영화 정보를 저장합니다.')
        setGenerationProgress(100)
        
        // 임시 데이터로 처리
        data = {
          success: true,
          videoUrl: null,
          thumbnailUrl: null,
          genre: `${selectedEmotion} 기반 AI 영화`,
          scenes: [
            { sceneNumber: 1, description: "분석 대기중", narration: "백엔드 연결 후 처리됩니다." }
          ]
        }
      }

      // Update movie status in database with real data
      const updatedMovie = await db.updateMovie(movie.id, {
        status: 'completed',
        video_url: data.videoUrl,
        thumbnail_url: data.thumbnailUrl,
        genre: data.genre,
        scenes: data.scenes
      })

      // Update local store with completed movie using real data
      addMovie({
        id: movie.id,
        title: movie.title,
        content: movie.content,
        emotion: movie.emotion,
        genre: data.genre,
        style: movie.style,
        music: movie.music,
        status: 'completed',
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        scenes: data.scenes,
        createdAt: movie.created_at
      })

      // Refresh user stats
      await refreshStats()
      
      setStep(5) // Go to completion step
      
    } catch (error) {
      console.error('Movie generation failed:', error)
      setError(error instanceof Error ? error.message : '영화 생성에 실패했습니다. 다시 시도해주세요.')
      setIsGenerating(false)
      setStep(3)
      
      // Clean up database if movie was created
      if (currentMovieId) {
        try {
          await db.updateMovie(currentMovieId, { status: 'failed' })
        } catch (cleanupError) {
          console.error('Failed to update movie status to failed:', cleanupError)
        }
      }
    }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Implement voice recording logic
  }

  const handleImageUpload = () => {
    // Implement image upload logic
  }

  const shareMovie = (platform: string) => {
    // Implement sharing logic
    console.log(`Sharing to ${platform}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header with user stats */}
        <div className="flex justify-between items-center mb-6 text-white">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ChevronLeft className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              <span className="text-sm">{stats?.movies_created || 0} 편 제작</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-sm">{stats?.streak_days || 0}일 연속</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
              <Gift className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {profile?.subscription_tier === 'free' 
                  ? `무료 ${getRemainingFreeMovies()}/3`
                  : profile?.subscription_tier === 'creator' 
                    ? `크리에이터 ${10 - (stats?.movies_this_month || 0)}/10`
                    : '프로 무제한'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between mb-4">
            {['일기 작성', '감정 선택', '스타일 설정', 'AI 제작중', '완성'].map((label, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: step > idx ? 1 : 0.8 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step > idx 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {step > idx ? '✓' : idx + 1}
                </motion.div>
                <span className="text-xs text-white/70 mt-2">{label}</span>
              </div>
            ))}
          </div>
          <Progress value={(step - 1) * 25} className="h-2 bg-white/10" />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Diary Writing */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-8 bg-white/95 backdrop-blur">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    오늘의 이야기를 들려주세요
                  </h2>
                  <p className="text-gray-600">오늘의 질문: {todayPrompt}</p>
                </div>

                <div className="mb-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceInput}
                    className={isRecording ? 'bg-red-50 border-red-500' : ''}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isRecording ? 'text-red-500' : ''}`} />
                    {isRecording ? '녹음 중...' : '음성 입력'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImageUpload}>
                    <Camera className="h-4 w-4 mr-2" />
                    사진 추가
                  </Button>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="오늘 하루를 자유롭게 표현해주세요. 기쁜 일, 슬픈 일, 특별한 순간들..."
                    value={diaryContent}
                    onChange={(e) => setDiaryContent(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                    {wordCount}자 {wordCount < 50 && '(50자 이상 추천)'}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    💡 Tip: 구체적으로 작성할수록 더 멋진 영화가 만들어져요!
                  </div>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={diaryContent.length < 10}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    다음 단계
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Emotion Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-8 bg-white/95 backdrop-blur">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  오늘의 감정을 선택해주세요
                </h2>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                  {emotions.map((emotion) => (
                    <motion.button
                      key={emotion.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedEmotion(emotion.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedEmotion === emotion.value
                          ? `bg-gradient-to-r ${emotion.color} text-white border-transparent shadow-lg`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{emotion.emoji}</div>
                      <div className="text-sm font-medium">{emotion.label}</div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!selectedEmotion}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    다음 단계
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Style & Music Selection */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-8 bg-white/95 backdrop-blur">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  영화 스타일을 선택해주세요
                </h2>

                {/* Visual Style */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    비주얼 스타일
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {visualStyles.map((style) => (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedStyle === style.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{style.icon}</div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Music Mood */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Music className="h-5 w-5 mr-2" />
                    배경 음악
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {musicMoods.map((mood) => (
                      <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMusic(mood.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedMusic === mood.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{mood.icon}</div>
                        <div className="text-xs font-medium">{mood.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Movie Length */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    영화 길이
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMovieLength('short')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        movieLength === 'short'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">숏폼 (30초)</div>
                      <div className="text-sm text-gray-500">SNS 공유에 최적화</div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMovieLength('full')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        movieLength === 'full'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">풀버전 (3분)</div>
                      <div className="text-sm text-gray-500">완전한 스토리텔링</div>
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    이전
                  </Button>
                  <Button
                    onClick={handleGenerateMovie}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    영화 제작 시작
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Processing */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-12 bg-white/95 backdrop-blur text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Film className="h-12 w-12 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI가 당신의 영화를 만들고 있어요
                </h2>

                <p className="text-gray-600 mb-8">
                  잠시만 기다려주세요. 곧 멋진 영화가 완성됩니다!
                </p>

                <div className="max-w-md mx-auto mb-8">
                  <Progress value={generationProgress} className="h-4" />
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{generationProgress}% 완료</span>
                    <span>예상 시간: {3 - Math.floor(generationProgress / 33)}분</span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 text-gray-600"
                >
                  <p className="font-medium">{generationStatus}</p>
                  
                  <div className="grid grid-cols-4 gap-4 mt-8 max-w-sm mx-auto">
                    <div className={`text-center ${generationProgress > 0 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-xs">분석</div>
                    </div>
                    <div className={`text-center ${generationProgress > 25 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className="text-2xl mb-1">🎬</div>
                      <div className="text-xs">시나리오</div>
                    </div>
                    <div className={`text-center ${generationProgress > 50 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-xs">영상</div>
                    </div>
                    <div className={`text-center ${generationProgress > 75 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className="text-2xl mb-1">🎵</div>
                      <div className="text-xs">음악</div>
                    </div>
                  </div>
                </motion.div>

                {/* Fun facts or tips while waiting */}
                <div className="mt-12 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    💡 알고 계셨나요? AI는 당신의 감정을 분석해 가장 어울리는 색감과 음악을 선택합니다!
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Completion */}
          {step === 5 && currentMovie && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="overflow-hidden bg-white/95 backdrop-blur">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-2">영화가 완성되었어요!</h2>
                  <p className="text-white/90">{currentMovie.title}</p>
                </div>

                {/* Movie Player */}
                <div className="p-8">
                  <div className="bg-black rounded-lg aspect-video mb-6 relative overflow-hidden">
                    {currentMovie.videoUrl ? (
                      <video 
                        className="w-full h-full" 
                        controls
                        autoPlay
                        src={currentMovie.videoUrl}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-white text-center">
                          <Film className="h-16 w-16 mx-auto mb-4" />
                          <p>영화 미리보기</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {emotions.find(e => e.value === currentMovie.emotion)?.emoji}
                        </span>
                        <span className="font-medium">
                          {emotions.find(e => e.value === currentMovie.emotion)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Film className="h-5 w-5 text-gray-500" />
                        <span>{currentMovie.genre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-gray-500" />
                        <span>{visualStyles.find(s => s.id === currentMovie.style)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-gray-500" />
                        <span>{musicMoods.find(m => m.id === currentMovie.music)?.name} 음악</span>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-center gap-6">
                      <button className="flex flex-col items-center gap-1 hover:text-red-500 transition-colors">
                        <Heart className="h-6 w-6" />
                        <span className="text-sm">0</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-sm">0</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 hover:text-green-500 transition-colors">
                        <Share2 className="h-6 w-6" />
                        <span className="text-sm">공유</span>
                      </button>
                    </div>
                  </div>

                  {/* Scenes */}
                  {currentMovie.scenes && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">영화 장면</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {currentMovie.scenes.slice(0, 4).map((scene: any, idx: number) => (
                          <div key={idx} className="bg-gray-100 rounded-lg p-3">
                            <div className="text-sm font-medium mb-1">Scene {idx + 1}</div>
                            <p className="text-xs text-gray-600 line-clamp-2">{scene.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Download className="mr-2 h-4 w-4" />
                      다운로드
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => shareMovie('instagram')}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      인스타그램
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => shareMovie('youtube')}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      유튜브
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setStep(1)
                        setDiaryContent('')
                        setSelectedEmotion('')
                        setGenerationProgress(0)
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      새 영화 만들기
                    </Button>
                  </div>

                  {/* Upgrade CTA for users who can't create more movies */}
                  {!canCreateMovie() && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">무료 제작 횟수를 모두 사용했어요!</h4>
                          <p className="text-sm text-gray-600">프리미엄으로 업그레이드하고 무제한 영화를 만들어보세요</p>
                        </div>
                        <Link href="/pricing">
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                            <Star className="mr-2 h-4 w-4" />
                            프리미엄 시작
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Community Section */}
              <Card className="mt-6 p-6 bg-white/95 backdrop-blur">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  오늘의 인기 영화
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                      <span className="text-gray-400">인기 영화 {i}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}