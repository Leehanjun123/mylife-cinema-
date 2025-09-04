import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 재초기화
const supabaseUrl = 'https://hsvdyccqsrkdswkkvftf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmR5Y2Nxc3JrZHN3a2t2ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzA5ODIsImV4cCI6MjA3MjU0Njk4Mn0.AbhBx6WW3rYHwAw_ITpsY5DG3cJ1u-_Qg6_th8-psQ8'

export const supabaseFixed = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  db: {
    schema: 'public'
  }
})

// 영화 저장 함수 (직접 구현)
export async function saveMovie(movieData: any) {
  console.log('🎬 영화 저장 시작:', movieData)
  
  try {
    // fetch API로 직접 호출
    const response = await fetch(
      `${supabaseUrl}/rest/v1/movies`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: movieData.user_id,
          title: movieData.title || '제목 없음',
          content: movieData.content || '',
          emotion: movieData.emotion || 'joy',
          style: movieData.style || 'realistic',
          music: movieData.music || 'emotional',
          length: movieData.length || 60,
          status: 'processing',
          is_public: false
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 응답 에러:', errorText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ 영화 저장 성공:', data)
    return { data: data[0], error: null }
    
  } catch (error) {
    console.error('❌ 영화 저장 실패:', error)
    return { data: null, error }
  }
}