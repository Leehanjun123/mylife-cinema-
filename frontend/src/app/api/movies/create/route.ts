import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Movie create API route called:', body)
    
    // Frontend API route should NOT be used - redirect to backend
    // The real AI generation happens in the Railway backend
    return NextResponse.json(
      { 
        success: false, 
        error: 'This API route should not be used. Use the Railway backend at https://mylife-cinema-backend-production.up.railway.app/api/movies/create',
        redirectTo: 'https://mylife-cinema-backend-production.up.railway.app/api/movies/create'
      },
      { status: 400 }
    )
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