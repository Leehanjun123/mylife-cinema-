import { createClient } from '@supabase/supabase-js';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

export const redis = Redis.createClient(redisConfig);

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

redis.connect().catch(console.error);

// Database helper functions
export const db = {
  // User operations
  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Diary operations
  async createDiaryEntry(diaryData) {
    const { data, error } = await supabase
      .from('diary_entries')
      .insert([diaryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDiaryEntries(userId, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  async getDiaryEntry(entryId, userId) {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Movie operations
  async createMovie(movieData) {
    const { data, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getMovies(userId, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        *,
        diary_entries(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  async updateMovieStatus(movieId, status, progress = null) {
    const updates = { status };
    if (progress !== null) updates.progress = progress;

    const { data, error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movieId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Subscription operations
  async createSubscription(subscriptionData) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getActiveSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
    return data;
  }
};

// Cache helper functions
export const cache = {
  async get(key) {
    try {
      const result = await redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, expirationSeconds = 3600) {
    try {
      await redis.setEx(key, expirationSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  async flushUser(userId) {
    try {
      const pattern = `user:${userId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
};