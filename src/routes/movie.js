import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db, cache } from '../config/database.js';
import aiService from '../services/aiService.js';
import videoService from '../services/videoService.js';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

/**
 * POST /api/movie/generate
 * Generate a movie from diary entry
 */
router.post('/generate',
  [
    body('diary_entry_id').isUUID().withMessage('Valid diary entry ID required'),
    body('genre').isIn(['action', 'romance', 'comedy', 'horror', 'sci-fi', 'drama', 'documentary', 'animation']).withMessage('Valid genre required'),
    body('duration').optional().isInt({ min: 5, max: 30 }).withMessage('Duration must be between 5-30 minutes'),
    body('style').optional().isIn(['cinematic', 'realistic', 'artistic', 'cartoon', 'vintage']).withMessage('Valid style required'),
    body('voice_style').optional().isIn(['natural', 'dramatic', 'cheerful', 'serious', 'whimsical']).withMessage('Valid voice style required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { diary_entry_id, genre, duration = 15, style = 'cinematic', voice_style = 'natural' } = req.body;
      const userId = req.user.id;

      // Check if user has active subscription or free credits
      const subscription = await db.getActiveSubscription(userId);
      if (!subscription) {
        // Check free usage limits
        const todayMovies = await db.getMoviesToday(userId);
        if (todayMovies >= 1) { // Free tier: 1 movie per day
          return res.status(403).json({
            error: 'Subscription required',
            message: 'Upgrade to generate more movies'
          });
        }
      }

      // Get diary entry
      const diaryEntry = await db.getDiaryEntry(diary_entry_id, userId);
      if (!diaryEntry) {
        return res.status(404).json({
          error: 'Diary entry not found'
        });
      }

      // Create movie record
      const movieData = {
        user_id: userId,
        diary_entry_id: diary_entry_id,
        genre: genre,
        duration: duration,
        style: style,
        voice_style: voice_style,
        status: 'queued',
        progress: 0,
        created_at: new Date().toISOString()
      };

      const movie = await db.createMovie(movieData);

      // Start async movie generation
      generateMovieAsync(movie.id, diaryEntry, {
        genre,
        duration,
        style,
        voice_style
      }).catch(error => {
        logger.error('Async movie generation failed:', error);
        db.updateMovieStatus(movie.id, 'failed', 0);
      });

      res.status(202).json({
        message: 'Movie generation started',
        movie_id: movie.id,
        estimated_completion: new Date(Date.now() + duration * 60000).toISOString() // Rough estimate
      });

    } catch (error) {
      logger.error('Movie generation request error:', error);
      res.status(500).json({
        error: 'Failed to start movie generation',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/movie/:id
 * Get movie details and status
 */
router.get('/:id',
  [
    param('id').isUUID().withMessage('Valid movie ID required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid movie ID',
          details: errors.array()
        });
      }

      const movieId = req.params.id;
      const userId = req.user.id;

      // Check cache first
      const cacheKey = `movie:${movieId}`;
      let movie = await cache.get(cacheKey);

      if (!movie) {
        movie = await db.getMovie(movieId, userId);
        if (!movie) {
          return res.status(404).json({
            error: 'Movie not found'
          });
        }

        // Cache for 5 minutes
        await cache.set(cacheKey, movie, 300);
      }

      res.json(movie);

    } catch (error) {
      logger.error('Get movie error:', error);
      res.status(500).json({
        error: 'Failed to get movie',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/movie
 * Get user's movies with pagination
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
    query('genre').optional().isIn(['action', 'romance', 'comedy', 'horror', 'sci-fi', 'drama', 'documentary', 'animation']),
    query('status').optional().isIn(['queued', 'generating', 'completed', 'failed'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { genre, status } = req.query;

      // Check cache
      const cacheKey = `user_movies:${userId}:${page}:${limit}:${genre || 'all'}:${status || 'all'}`;
      let result = await cache.get(cacheKey);

      if (!result) {
        const movies = await db.getMovies(userId, limit, offset, { genre, status });
        const totalCount = await db.getMoviesCount(userId, { genre, status });

        result = {
          movies,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        };

        // Cache for 2 minutes
        await cache.set(cacheKey, result, 120);
      }

      res.json(result);

    } catch (error) {
      logger.error('Get movies error:', error);
      res.status(500).json({
        error: 'Failed to get movies',
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/movie/:id
 * Delete a movie
 */
router.delete('/:id',
  [
    param('id').isUUID().withMessage('Valid movie ID required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid movie ID',
          details: errors.array()
        });
      }

      const movieId = req.params.id;
      const userId = req.user.id;

      // Verify ownership
      const movie = await db.getMovie(movieId, userId);
      if (!movie) {
        return res.status(404).json({
          error: 'Movie not found'
        });
      }

      // Delete movie record
      await db.deleteMovie(movieId, userId);

      // Clean up files (async)
      cleanupMovieFiles(movie).catch(error => {
        logger.error('File cleanup error:', error);
      });

      // Clear cache
      await cache.flushUser(userId);

      res.json({
        message: 'Movie deleted successfully'
      });

    } catch (error) {
      logger.error('Delete movie error:', error);
      res.status(500).json({
        error: 'Failed to delete movie',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/movie/:id/share
 * Share a movie
 */
router.post('/:id/share',
  [
    param('id').isUUID().withMessage('Valid movie ID required'),
    body('platform').optional().isIn(['link', 'social', 'email']).withMessage('Valid platform required'),
    body('privacy').optional().isIn(['public', 'unlisted', 'private']).withMessage('Valid privacy setting required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: errors.array()
        });
      }

      const movieId = req.params.id;
      const userId = req.user.id;
      const { platform = 'link', privacy = 'unlisted' } = req.body;

      // Verify movie ownership
      const movie = await db.getMovie(movieId, userId);
      if (!movie) {
        return res.status(404).json({
          error: 'Movie not found'
        });
      }

      if (movie.status !== 'completed') {
        return res.status(400).json({
          error: 'Movie not ready for sharing'
        });
      }

      // Generate share token
      const shareToken = generateShareToken();
      
      // Update movie with sharing info
      await db.updateMovie(movieId, {
        share_token: shareToken,
        share_privacy: privacy,
        shared_at: new Date().toISOString()
      });

      const shareUrl = `${process.env.FRONTEND_URL}/watch/${shareToken}`;

      res.json({
        message: 'Movie shared successfully',
        share_url: shareUrl,
        share_token: shareToken,
        privacy: privacy
      });

    } catch (error) {
      logger.error('Share movie error:', error);
      res.status(500).json({
        error: 'Failed to share movie',
        message: error.message
      });
    }
  }
);

// Async movie generation function
async function generateMovieAsync(movieId, diaryEntry, options) {
  try {
    logger.info(`Starting async movie generation for ${movieId}`);

    // Update status
    await db.updateMovieStatus(movieId, 'generating', 0);

    // Step 1: Analyze diary entry
    logger.info('Step 1: Analyzing diary entry');
    const analysis = await aiService.analyzeDiary(
      diaryEntry.content,
      diaryEntry.mood,
      diaryEntry.images || []
    );
    await db.updateMovieStatus(movieId, 'generating', 10);

    // Step 2: Generate script
    logger.info('Step 2: Generating script');
    const script = await aiService.generateScript(
      analysis,
      options.genre,
      options.duration,
      options.style
    );
    await db.updateMovieStatus(movieId, 'generating', 20);

    // Step 3: Generate video prompts
    logger.info('Step 3: Generating video prompts');
    const videoPrompts = await aiService.generateVideoPrompts(script, options.style);
    await db.updateMovieStatus(movieId, 'generating', 30);

    // Step 4: Generate audio script
    logger.info('Step 4: Generating audio script');
    const audioScript = await aiService.generateAudioScript(script, options.voice_style);
    await db.updateMovieStatus(movieId, 'generating', 35);

    // Step 5: Generate music prompts
    logger.info('Step 5: Generating music prompts');
    const musicPrompts = await aiService.generateMusicPrompts(script, options.genre);
    await db.updateMovieStatus(movieId, 'generating', 40);

    // Step 6: Generate final movie
    logger.info('Step 6: Generating video');
    const finalMovie = await videoService.generateMovie({
      script,
      videoPrompts,
      audioScript,
      musicPrompts,
      movieId
    });

    // Step 7: Update movie with final details
    await db.updateMovie(movieId, {
      status: 'completed',
      progress: 100,
      video_url: finalMovie.path,
      file_size: finalMovie.fileSize,
      actual_duration: finalMovie.duration,
      script: JSON.stringify(script),
      completed_at: new Date().toISOString()
    });

    // Clear cache
    await cache.del(`movie:${movieId}`);
    
    logger.info(`Movie generation completed for ${movieId}`);

  } catch (error) {
    logger.error(`Movie generation failed for ${movieId}:`, error);
    
    await db.updateMovieStatus(movieId, 'failed', 0);
    await cache.del(`movie:${movieId}`);
    
    throw error;
  }
}

// Helper functions
function generateShareToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function cleanupMovieFiles(movie) {
  // Implementation for cleaning up temporary and final video files
  // This would delete files from storage (S3, local filesystem, etc.)
  logger.info(`Cleaning up files for movie ${movie.id}`);
}

export default router;