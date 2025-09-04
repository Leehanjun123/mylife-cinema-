import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Movie create API route called:', body)
    
    // 임시 응답 - 실제 영화 생성 로직은 나중에 추가
    // 지금은 샘플 비디오 URL 반환
    const response = {
      success: true,
      message: '영화가 성공적으로 생성되었습니다!',
      movie: {
        id: body.movieId || `movie-${Date.now()}`,
        title: body.title || '나의 영화',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: '/movie-placeholder.jpg',
        duration: 60,
        status: 'completed'
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Movie create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create movie' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}