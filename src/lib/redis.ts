import Redis from 'ioredis';

// Singleton Redis client instance
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    // Connect to Redis (Upstash, local, or cloud Redis)
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (!redisUrl) {
      console.warn('⚠️  No REDIS_URL configured. Rate limiting will use in-memory fallback.');
      // Return a mock client for development
      return createMockRedisClient();
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  return redisClient;
}

// Mock Redis client for development without Redis
function createMockRedisClient(): Redis {
  const mockData = new Map<string, { value: string; expiry: number }>();

  return {
    get: async (key: string) => {
      const item = mockData.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        mockData.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: string, _mode?: string, duration?: number) => {
      const expiry = duration ? Date.now() + duration * 1000 : Date.now() + 86400000;
      mockData.set(key, { value, expiry });
      return 'OK';
    },
    incr: async (key: string) => {
      const item = mockData.get(key);
      const currentValue = item ? parseInt(item.value, 10) : 0;
      const newValue = currentValue + 1;
      mockData.set(key, { value: String(newValue), expiry: Date.now() + 60000 });
      return newValue;
    },
    expire: async (key: string, seconds: number) => {
      const item = mockData.get(key);
      if (item) {
        item.expiry = Date.now() + seconds * 1000;
        return 1;
      }
      return 0;
    },
    del: async (key: string) => {
      return mockData.delete(key) ? 1 : 0;
    },
    ttl: async (key: string) => {
      const item = mockData.get(key);
      if (!item) return -2;
      const remaining = Math.floor((item.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
  } as unknown as Redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
