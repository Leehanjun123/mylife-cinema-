const API_BASE_URL = 'http://localhost:3000/api'

export interface CreateMovieRequest {
  content: string
  emotion: string
  genre?: string
}

export interface CreateMovieResponse {
  success: boolean
  movieId: string
  message: string
}

export interface Movie {
  id: string
  title: string
  content: string
  emotion: string
  genre: string
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  createdAt: string
}

class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  async createMovie(request: CreateMovieRequest): Promise<CreateMovieResponse> {
    const response = await fetch(`${this.baseURL}/movies/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  async getMovies(): Promise<Movie[]> {
    const response = await fetch(`${this.baseURL}/movies`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  async getMovie(movieId: string): Promise<Movie> {
    const response = await fetch(`${this.baseURL}/movies/${movieId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseURL.replace('/api', '')}/health`)
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    return await response.json()
  }
}

export const apiClient = new APIClient()