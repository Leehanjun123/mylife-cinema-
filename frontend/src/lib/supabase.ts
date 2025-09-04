import { createClient } from '@supabase/supabase-js'

// Use fallback values if environment variables are not set (for build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

}

// Database helper functions
export const db = {
  // User operations
  getUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  updateUser: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Movie operations
  getMovies: async (userId: string) => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createMovie: async (movieData: any) => {
    const { data, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select()
      .single()
    return { data, error }
  },

  updateMovie: async (movieId: string, updates: any) => {
    const { data, error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movieId)
      .select()
      .single()
    return { data, error }
  },

  deleteMovie: async (movieId: string, userId: string) => {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieId)
      .eq('user_id', userId)
    return { data, error }
  },

  // Public movie operations for community
  getPublicMovies: async (limit = 20) => {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        *,
        users(username, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'completed')
      .order('likes', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Movie interactions
  likeMovie: async (movieId: string, userId: string) => {
    const { data, error } = await supabase
      .from('movie_likes')
      .upsert([{ movie_id: movieId, user_id: userId }])
    return { data, error }
  },

  unlikeMovie: async (movieId: string, userId: string) => {
    const { data, error } = await supabase
      .from('movie_likes')
      .delete()
      .eq('movie_id', movieId)
      .eq('user_id', userId)
    return { data, error }
  },

  // User stats and subscription
  getUserStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  updateUserStats: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert([{ user_id: userId, ...updates }])
      .select()
      .single()
    return { data, error }
  },

  getUserLikedMovies: async (userId: string) => {
    const { data, error } = await supabase
      .from('movie_likes')
      .select('movie_id')
      .eq('user_id', userId)
    return { data, error }
  },

  // Stats for homepage
  getAllMoviesCount: async () => {
    const { count, error } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
    return { data: count, error }
  },

  getAllUsersCount: async () => {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    return { data: count, error }
  },

  getTodayMoviesCount: async () => {
    const today = new Date().toISOString().split('T')[0]
    const { count, error } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
    return { data: count, error }
  }
}

// Real-time subscriptions
export const subscriptions = {
  subscribeToMovieUpdates: (movieId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`movie:${movieId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'movies',
          filter: `id=eq.${movieId}`
        }, 
        callback
      )
      .subscribe()
  },

  subscribeToUserMovies: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user_movies:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'movies',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

export default supabase