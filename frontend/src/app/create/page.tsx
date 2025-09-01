'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { apiClient, CreateMovieRequest } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { socketManager } from '@/lib/socket'

const emotions = [
  { emoji: '😊', label: '기쁨', value: 'joy' },
  { emoji: '😢', label: '슬픔', value: 'sadness' },
  { emoji: '😍', label: '사랑', value: 'love' },
  { emoji: '😤', label: '분노', value: 'anger' },
  { emoji: '😰', label: '불안', value: 'anxiety' },
  { emoji: '😌', label: '평온', value: 'peace' },
  { emoji: '🤔', label: '생각', value: 'thoughtful' },
  { emoji: '😴', label: '피곤', value: 'tired' }
]

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [diaryContent, setDiaryContent] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [currentMovieId, setCurrentMovieId] = useState<string | null>(null)
  
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

  useEffect(() => {
    // WebSocket 연결
    socketManager.connect()
    socketManager.manualConnect()
    
    return () => {
      // 컴포넌트 언마운트 시 소켓 연결 해제
      if (currentMovieId) {
        socketManager.leaveMovieRoom(currentMovieId)
      }
    }
  }, [])

  useEffect(() => {
    if (currentMovieId) {
      socketManager.joinMovieRoom(currentMovieId)
    }
  }, [currentMovieId])

  const handleGenerateMovie = async () => {
    try {
      setIsGenerating(true)
      setStep(3)
      setGenerationProgress(0)
      setGenerationStatus('영화 생성을 시작합니다...')
      setError(null)

      const request: CreateMovieRequest = {
        content: diaryContent,
        emotion: selectedEmotion
      }

      const response = await apiClient.createMovie(request)
      
      if (response.success) {
        setCurrentMovieId(response.movieId)
        
        // 새로운 영화를 스토어에 추가
        addMovie({
          id: response.movieId,
          title: `${new Date().toLocaleDateString()} 일기`,
          content: diaryContent,
          emotion: selectedEmotion,
          genre: 'auto', // AI가 선택
          status: 'processing',
          createdAt: new Date().toISOString()
        })
        
        // WebSocket으로 영화 생성 시작 알림
        socketManager.startMovieGeneration(response.movieId)
        
        // 완료될 때까지 대기하는 리스너 설정
        const checkCompletion = () => {
          if (generationProgress >= 100) {
            setStep(4)
          }
        }
        
        // 진행 상황 모니터링
        const progressInterval = setInterval(() => {
          if (generationProgress >= 100) {
            clearInterval(progressInterval)
            setStep(4)
          }
        }, 1000)
        
      } else {
        throw new Error(response.message || '영화 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Movie generation failed:', error)
      setError(error instanceof Error ? error.message : '영화 생성에 실패했습니다')
      setIsGenerating(false)
      setStep(2) // 이전 단계로 돌아가기
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              나만의 영화 만들기
            </h1>
            <div className="flex justify-center space-x-4 mb-6">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="text-gray-600">
              {step === 1 && '일기 작성'}
              {step === 2 && '감정 선택'}
              {step === 3 && '영화 생성 중'}
              {step === 4 && '완성!'}
            </p>
          </div>

          {/* Step 1: 일기 작성 */}
          {step === 1 && (
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                오늘의 이야기를 들려주세요
              </h2>
              <div className="space-y-4">
                <textarea
                  className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="오늘 하루는 어떠셨나요? 특별한 일이 있었나요? 자유롭게 작성해주세요..."
                  value={diaryContent}
                  onChange={(e) => setDiaryContent(e.target.value)}
                />
                <div className="text-right">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={diaryContent.length < 10}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    다음 단계
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: 감정 선택 */}
          {step === 2 && (
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                오늘의 감정을 선택해주세요
              </h2>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.value}
                    onClick={() => setSelectedEmotion(emotion.value)}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedEmotion === emotion.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{emotion.emoji}</div>
                    <div className="text-sm font-medium">{emotion.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  이전
                </Button>
                <Button
                  onClick={handleGenerateMovie}
                  disabled={!selectedEmotion}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  영화 생성하기
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: 영화 생성 중 */}
          {step === 3 && (
            <Card className="p-8 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎬</span>
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  AI가 당신의 영화를 만들고 있어요
                </h2>
                <p className="text-gray-600 mb-8">
                  잠시만 기다려주세요. 곧 멋진 영화가 완성됩니다!
                </p>
              </div>
              
              <div className="max-w-md mx-auto mb-8">
                <Progress value={generationProgress} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">{generationProgress}% 완료</p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>{generationStatus || '영화 생성을 준비 중입니다...'}</p>
                {generationProgress > 20 && <p>✨ 스토리 분석 완료</p>}
                {generationProgress > 50 && <p>🎨 장면 생성 중...</p>}
                {generationProgress > 80 && <p>🎵 배경 음악 추가 중...</p>}
              </div>
            </Card>
          )}

          {/* Step 4: 완성 */}
          {step === 4 && (
            <Card className="p-8 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  영화가 완성되었어요!
                </h2>
                <p className="text-gray-600 mb-8">
                  당신의 이야기가 멋진 영화로 탄생했습니다
                </p>
              </div>

              {/* 영화 플레이어 영역 */}
              <div className="bg-black rounded-lg aspect-video mb-8 flex items-center justify-center">
                {currentMovie?.videoUrl ? (
                  <video 
                    className="w-full h-full rounded-lg" 
                    controls
                    src={currentMovie.videoUrl}
                  >
                    <source src={currentMovie.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">▶️</div>
                    <p>영화 재생하기</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  다운로드
                </Button>
                <Button variant="outline">
                  공유하기
                </Button>
                <Button variant="outline" onClick={() => {
                  setStep(1)
                  setDiaryContent('')
                  setSelectedEmotion('')
                  setCurrentMovieId(null)
                  setGenerationProgress(0)
                  setGenerationStatus('')
                }}>
                  새 영화 만들기
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}