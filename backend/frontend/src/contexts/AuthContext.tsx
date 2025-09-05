'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth, db, supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url?: string
  subscription_tier: 'free' | 'creator' | 'pro'
  created_at: string
}

interface UserStats {
  user_id: string
  movies_created: number
  movies_this_month: number
  streak_days: number
  total_likes: number
  free_movies_used: number
  last_movie_date?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  stats: UserStats | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshStats: () => Promise<void>
  canCreateMovie: () => boolean
  getRemainingFreeMovies: () => number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Auth 초기화 시작...')
      try {
        // Add timeout to prevent infinite hanging - increased to 10 seconds
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
        )
        
        const { user, error } = await Promise.race([
          auth.getCurrentUser(),
          timeoutPromise
        ]) as any
        
        if (error) {
          console.warn('⚠️ Auth 사용자 가져오기 실패:', error)
        }
        
        setUser(user)
        if (user) {
          // Load profile and stats with timeout protection
          try {
            await Promise.race([
              Promise.all([
                loadUserProfile(user.id),
                loadUserStats(user.id)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile loading timeout')), 8000)
              )
            ])
          } catch (profileError) {
            console.warn('Profile loading failed, continuing anyway:', profileError)
            // Don't throw - allow the user to proceed even if profile loading fails
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
        // Auth 실패해도 앱은 계속 작동해야 함
        setUser(null)
        setProfile(null)
        setStats(null)
      } finally {
        console.log('✅ Auth 초기화 완료')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        
        if (user) {
          try {
            // Add timeout protection for auth state changes too
            await Promise.race([
              Promise.all([
                loadUserProfile(user.id),
                loadUserStats(user.id)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth state change profile loading timeout')), 8000)
              )
            ])
          } catch (error) {
            console.warn('Auth state change profile loading failed:', error)
            // Continue anyway - don't block user
          }
        } else {
          setProfile(null)
          setStats(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await db.getUser(userId)
      if (error && error.code === 'PGRST116') {
        // User profile doesn't exist, create one
        const { user: authUser } = await auth.getCurrentUser()
        if (authUser) {
          const newProfile = {
            id: userId,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
            email: authUser.email!,
            subscription_tier: 'free' as const,
            created_at: new Date().toISOString()
          }
          
          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single()
          
          if (!createError) {
            setProfile(createdProfile)
            // Also create initial stats
            await createInitialStats(userId)
          }
        }
      } else if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      const { data, error } = await db.getUserStats(userId)
      if (error && error.code === 'PGRST116') {
        // Stats don't exist, create initial stats
        await createInitialStats(userId)
      } else if (!error && data) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const createInitialStats = async (userId: string) => {
    const initialStats = {
      user_id: userId,
      movies_created: 0,
      movies_this_month: 0,
      streak_days: 0,
      total_likes: 0,
      free_movies_used: 0
    }
    
    const { data, error } = await db.updateUserStats(userId, initialStats)
    if (!error && data) {
      setStats(data)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password)
    return { error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await auth.signUp(email, password, { username })
    return { error }
  }

  const signOut = async () => {
    await auth.signOut()
    setUser(null)
    setProfile(null)
    setStats(null)
  }


  const refreshProfile = async () => {
    try {
      if (user) {
        console.log('🔄 프로필 강제 리프레시 시작...')
        
        // 먼저 Supabase에서 직접 최신 데이터 가져오기
        const { data: freshData, error: freshError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (freshError) {
          console.error('❌ 프로필 리프레시 실패:', freshError)
          return false
        }
        
        if (freshData) {
          console.log('✅ 프로필 리프레시 성공:', {
            userId: freshData.id,
            tier: freshData.subscription_tier,
            status: freshData.subscription_status
          })
          
          // 상태 직접 업데이트
          setProfile(freshData)
          
          // 통계도 리프레시
          await loadUserStats(user.id)
          return true
        }
        return false
      }
      return false
    } catch (error) {
      console.error('Error refreshing profile:', error)
      // Don't throw error to prevent breaking payment success page
      return false
    }
  }

  const refreshStats = async () => {
    if (user) {
      await loadUserStats(user.id)
    }
  }

  const canCreateMovie = () => {
    if (!profile || !stats) {
      console.log('⚠️ canCreateMovie: 프로필 또는 통계 데이터 없음')
      return false
    }
    
    // 프리미엄 사용자는 무제한
    if (profile?.subscription_tier === 'creator' || profile?.subscription_tier === 'pro') {
      console.log('✅ 프리미엄 사용자 - 영화 제작 가능')
      return true
    }
    
    // 무료 사용자는 3편까지
    const canCreate = stats.free_movies_used < 3
    console.log(`🆓 무료 사용자 - 영화 ${stats.free_movies_used}/3 사용, 제작 가능: ${canCreate}`)
    return canCreate
  }

  const getRemainingFreeMovies = () => {
    if (!profile || !stats) {
      console.log('⚠️ getRemainingFreeMovies: 프로필 또는 통계 데이터 없음')
      return 0
    }
    
    // 프리미엄 사용자는 무제한
    if (profile?.subscription_tier === 'creator' || profile?.subscription_tier === 'pro') {
      console.log('✅ 프리미엄 사용자 - 무제한 영화 제작')
      return Infinity
    }
    
    const remaining = Math.max(0, 3 - stats.free_movies_used)
    console.log(`🆓 무료 사용자 - 남은 영화: ${remaining}편`)
    return remaining
  }

  const value = {
    user,
    profile,
    stats,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    refreshStats,
    canCreateMovie,
    getRemainingFreeMovies
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}