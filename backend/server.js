import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import MovieGenerator from './services/movieGenerator.js';
import FastVideoGenerator from './services/fastVideoGenerator.js';
import HybridGenerator from './services/hybridGenerator.js';

dotenv.config();

const app = express();

// Configure CORS with the cors package
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://www.lifecinema.site',
      'https://lifecinema.site',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Log for debugging
    console.log('Request from origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not in allowed list, but allowing anyway:', origin);
      callback(null, true); // Temporarily allow all origins for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Socket-Id', 'x-socket-id'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve generated movie files
app.use('/movies', express.static('/tmp/movies'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MyLife Cinema Backend',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok',
    endpoints: {
      movies: '/api/movies',
      generate: '/api/movies/generate'
    }
  });
});

// Movie generation endpoint (mock for now)
app.post('/api/movies/generate', async (req, res) => {
  const { userId, title, content, style } = req.body;
  
  console.log('Movie generation request:', { userId, title, style });
  
  // Mock response - in production, this would call AI services
  const movieId = `movie_${Date.now()}`;
  
  // Send progress updates via Socket.IO if client is connected
  const socketId = req.headers['x-socket-id'];
  if (socketId && io.sockets.sockets.get(socketId)) {
    const socket = io.sockets.sockets.get(socketId);
    
    // Simulate progress updates
    socket.emit('generation:progress', { progress: 10, stage: '스토리 분석 중...' });
    setTimeout(() => socket.emit('generation:progress', { progress: 30, stage: '비주얼 생성 중...' }), 1000);
    setTimeout(() => socket.emit('generation:progress', { progress: 60, stage: '음성 생성 중...' }), 2000);
    setTimeout(() => socket.emit('generation:progress', { progress: 90, stage: '영상 편집 중...' }), 3000);
  }
  
  // Return mock movie data
  setTimeout(() => {
    res.json({
      success: true,
      movie: {
        id: movieId,
        title,
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: '/movie-placeholder.jpg',
        duration: 180,
        style,
        createdAt: new Date().toISOString()
      }
    });
  }, 4000);
});

// Movie creation endpoint (with real AI generation)
app.post('/api/movies/create', async (req, res) => {
  console.log('Movie create endpoint called:', req.body);
  const { diary, emotion, style, music, length, userId, movieId } = req.body;
  
  try {
    // Use Hybrid Generator for better quality
    const generator = new HybridGenerator();
    
    // Generate the movie with hybrid approach
    const result = await generator.generateMovie(
      diary || 'Today was a wonderful day.',
      emotion || 'happy',
      style || 'realistic',
      length || 'short',
      userId || 'anonymous',
      (progress) => {
        // Send progress via Socket.IO if available
        const socketId = req.headers['x-socket-id'];
        if (socketId && io.sockets.sockets.get(socketId)) {
          io.sockets.sockets.get(socketId).emit('generation:progress', progress);
        }
        console.log('Progress:', progress);
      }
    );
    
    // Return the generated movie data
    res.json({
      success: true,
      message: '영화가 성공적으로 생성되었습니다!',
      movieId: movieId || 'movie-' + Date.now(),
      ...result
    });
    
  } catch (error) {
    console.error('Movie creation error:', error);
    
    // Fallback to sample video on error
    res.json({
      success: true,
      message: 'Movie creation started (demo mode)',
      movieId: movieId || 'temp-' + Date.now(),
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Demo Movie',
      genre: emotion || 'drama',
      scenes: []
    });
  }
});

// Get user's movies
app.get('/api/movies/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Mock response
  res.json({
    success: true,
    movies: [
      {
        id: 'movie_1',
        title: '샘플 영화',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: '/movie-placeholder.jpg',
        duration: 180,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('auth', (data) => {
    console.log('User authenticated:', data.userId);
    socket.join(`user:${data.userId}`);
  });
  
  socket.on('movie:generate', async (data) => {
    console.log('Movie generation via socket:', data);
    
    // Send progress updates
    socket.emit('generation:started', { movieId: `movie_${Date.now()}` });
    
    // Simulate generation steps
    const steps = [
      { progress: 10, stage: '스토리 분석 중...' },
      { progress: 30, stage: '비주얼 생성 중...' },
      { progress: 60, stage: '음성 생성 중...' },
      { progress: 90, stage: '영상 편집 중...' }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        socket.emit('generation:progress', steps[i]);
      }, (i + 1) * 1500);
    }
    
    // Send completion
    setTimeout(() => {
      socket.emit('generation:complete', {
        movie: {
          id: `movie_${Date.now()}`,
          title: data.title,
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: '/movie-placeholder.jpg',
          duration: 180,
          createdAt: new Date().toISOString()
        }
      });
    }, 7000);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'https://lifecinema.site'}`);
});