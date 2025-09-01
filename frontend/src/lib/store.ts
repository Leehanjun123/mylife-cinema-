import { create } from 'zustand'
import { Movie } from './api'

interface AppState {
  // 사용자 상태
  user: {
    id?: string
    email?: string
    name?: string
    subscription?: 'free' | 'creator' | 'pro'
  } | null
  setUser: (user: AppState['user']) => void
  
  // 영화 상태
  movies: Movie[]
  currentMovie: Movie | null
  setMovies: (movies: Movie[]) => void
  setCurrentMovie: (movie: Movie | null) => void
  addMovie: (movie: Movie) => void
  updateMovie: (movieId: string, updates: Partial<Movie>) => void
  
  // UI 상태
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 영화 생성 상태
  generationProgress: number
  generationStatus: string
  isGenerating: boolean
  setGenerationProgress: (progress: number) => void
  setGenerationStatus: (status: string) => void
  setIsGenerating: (generating: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // 초기 상태
  user: null,
  movies: [],
  currentMovie: null,
  isLoading: false,
  error: null,
  generationProgress: 0,
  generationStatus: '',
  isGenerating: false,

  // 사용자 액션
  setUser: (user) => set({ user }),

  // 영화 액션
  setMovies: (movies) => set({ movies }),
  setCurrentMovie: (movie) => set({ currentMovie: movie }),
  addMovie: (movie) => set((state) => ({ 
    movies: [movie, ...state.movies] 
  })),
  updateMovie: (movieId, updates) => set((state) => ({
    movies: state.movies.map(movie => 
      movie.id === movieId ? { ...movie, ...updates } : movie
    ),
    currentMovie: state.currentMovie?.id === movieId 
      ? { ...state.currentMovie, ...updates }
      : state.currentMovie
  })),

  // UI 액션
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // 생성 진행 상황
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
}))