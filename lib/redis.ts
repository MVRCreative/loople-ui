import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from './env';

// Singleton Redis client
let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn('Redis configuration missing. Set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN environment variables.');
    return null;
  }

  redisInstance = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });

  return redisInstance;
}

// Export the singleton instance (can be null if Redis not configured)
export const redis = getRedis();
