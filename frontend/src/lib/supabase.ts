import { createClient } from '@supabase/supabase-js'

// Use fallback values if environment variables are not set (for build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      return { data, error }
    } catch (err) {
      console.error('SignUp error:', err)
      return { data: null, error: err }
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { data: null, error: err }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      console.error('SignOut error:', err)
      return { error: err }
    }
  },

  getCurrentUser: async () => {
    try {
      console.log('🔍 Getting current user from Supabase...')
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.warn('⚠️ Supabase getUser error:', error)
      } else if (user) {
        console.log('✅ User found:', user.email)
      } else {
        console.log('ℹ️ No user logged in')
      }
      return { user, error }
    } catch (err) {
      console.error('❌ getCurrentUser error:', err)
      return { user: null, error: err }
    }
  },

}

// Database helper functions
export const db = {
  // User operations
  getUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        avatar_url,
        subscription_tier,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        updated_at
      `)
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
      .select(`
        id,
        title,
        content,
        emotion,
        genre,
        style,
        music,
        length,
        status,
        video_url,
        thumbnail_url,
        scenes,
        is_public,
        likes,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createMovie: async (movieData: any) => {
    console.log('🎬 영화 저장 시도:', movieData)
    
    // 필수 필드 확인
    if (!movieData.user_id || !movieData.title || !movieData.content) {
      console.error('❌ 필수 필드 누락')
      return { data: null, error: new Error('필수 필드가 누락되었습니다') }
    }
    
    try {
      const { data, error } = await supabase
        .from('movies')
        .insert([{
          user_id: movieData.user_id,
          title: movieData.title || '제목 없음',
          content: movieData.content || '',
          emotion: movieData.emotion || 'joy',
          genre: movieData.genre || 'drama',
          style: movieData.style || 'realistic',
          music: movieData.music || 'emotional',
          length: movieData.length === 'short' ? 30 : movieData.length === 'full' ? 180 : 60,
          status: movieData.status || 'processing',
          video_url: movieData.video_url || null,
          thumbnail_url: movieData.thumbnail_url || null,
          scenes: movieData.scenes || null,
          is_public: movieData.is_public || false,
          likes: 0
        }])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Supabase 에러:', error)
        throw error
      }
      
      console.log('✅ 영화 저장 성공:', data)
      return { data, error }
    } catch (err) {
      console.error('❌ 영화 저장 실패:', err)
      return { data: null, error: err }
    }
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
        id,
        title,
        content,
        emotion,
        genre,
        style,
        music,
        status,
        video_url,
        thumbnail_url,
        is_public,
        likes,
        created_at,
        user_id,
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
      .select(`
        user_id,
        total_movies,
        movies_this_month,
        storage_used,
        last_movie_date,
        created_at,
        updated_at
      `)
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
      .select('id', { count: 'exact', head: true })
    return { data: count, error }
  },

  getAllUsersCount: async () => {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    return { data: count, error }
  },

  getTodayMoviesCount: async () => {
    const today = new Date().toISOString().split('T')[0]
    const { count, error } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true })
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