'use client'

import { io, Socket } from 'socket.io-client'
import { useAppStore } from './store'

class SocketManager {
  private socket: Socket | null = null
  private isConnected = false

  connect(serverUrl: string = 'http://localhost:3000') {
    if (this.socket) {
      return this.socket
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })

    // 연결 성공
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.isConnected = true
    })

    // 연결 해제
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.isConnected = false
    })

    // 영화 생성 진행 상황 업데이트
    this.socket.on('movie-progress', (data) => {
      const { setGenerationProgress, setGenerationStatus } = useAppStore.getState()
      setGenerationProgress(data.progress)
      setGenerationStatus(data.status)
      
      console.log('Movie progress:', data)
    })

    // 영화 생성 완료
    this.socket.on('movie-completed', (data) => {
      const { updateMovie, setIsGenerating, setGenerationProgress } = useAppStore.getState()
      
      updateMovie(data.movieId, {
        status: 'completed',
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
      })
      
      setIsGenerating(false)
      setGenerationProgress(100)
      
      console.log('Movie completed:', data)
    })

    // 영화 생성 실패
    this.socket.on('movie-failed', (data) => {
      const { updateMovie, setIsGenerating, setError } = useAppStore.getState()
      
      updateMovie(data.movieId, {
        status: 'failed',
      })
      
      setIsGenerating(false)
      setError(data.error || 'Movie generation failed')
      
      console.error('Movie generation failed:', data)
    })

    // 오류 처리
    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
      const { setError } = useAppStore.getState()
      setError('Connection error occurred')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // 영화 생성 시작 이벤트
  startMovieGeneration(movieId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('start-movie-generation', { movieId })
    }
  }

  // 방 참가 (특정 영화 생성 상황 모니터링)
  joinMovieRoom(movieId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', { movieId })
    }
  }

  // 방 떠나기
  leaveMovieRoom(movieId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', { movieId })
    }
  }

  // 연결 상태 확인
  getConnectionStatus() {
    return this.isConnected
  }

  // 수동 연결
  manualConnect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect()
    }
  }
}

// 싱글톤 인스턴스
export const socketManager = new SocketManager()