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
    // Get initial session
    auth.getCurrentUser().then(({ user }) => {
      setUser(user)
      if (user) {
        loadUserProfile(user.id)
        loadUserStats(user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        
        if (user) {
          await loadUserProfile(user.id)
          await loadUserStats(user.id)
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
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const refreshStats = async () => {
    if (user) {
      await loadUserStats(user.id)
    }
  }

  const canCreateMovie = () => {
    if (!profile || !stats) return false
    
    if (profile?.subscription_tier !== 'free') return true
    
    return stats.free_movies_used < 3
  }

  const getRemainingFreeMovies = () => {
    if (!profile || !stats) return 0
    
    if (profile?.subscription_tier !== 'free') return Infinity
    
    return Math.max(0, 3 - stats.free_movies_used)
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