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
  const sortedSets = new Map<string, Map<string, number>>(); // key -> (member -> score)

  return {
    get: async (key: string) => {
      const item = mockData.get(key);
      if (!item) {
return null;
}
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
      // Also handle sorted sets
      if (sortedSets.has(key)) {
        // Sorted sets don't have expiry in mock, but we'll accept the call
        return 1;
      }
      return 0;
    },
    del: async (key: string) => {
      const deleted = mockData.delete(key) || sortedSets.delete(key);
      return deleted ? 1 : 0;
    },
    ttl: async (key: string) => {
      const item = mockData.get(key);
      if (!item) {
return -2;
}
      const remaining = Math.floor((item.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
    ping: async () => {
      return 'PONG';
    },
    keys: async (pattern: string) => {
      // Simple pattern matching for mock (just prefix matching)
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const dataKeys = Array.from(mockData.keys()).filter(key => regex.test(key));
      const setKeys = Array.from(sortedSets.keys()).filter(key => regex.test(key));
      return [...new Set([...dataKeys, ...setKeys])];
    },
    exists: async (...keys: string[]) => {
      return keys.filter(key => mockData.has(key) || sortedSets.has(key)).length;
    },
    // Sorted set operations for rate limiting
    zadd: async (key: string, score: number, member: string) => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      const isNew = !set.has(member);
      set.set(member, score);
      return isNew ? 1 : 0;
    },
    zcard: async (key: string) => {
      const set = sortedSets.get(key);
      return set ? set.size : 0;
    },
    zremrangebyscore: async (key: string, min: string | number, max: string | number) => {
      const set = sortedSets.get(key);
      if (!set) {
return 0;
}
      const minScore = min === '-inf' ? -Infinity : Number(min);
      const maxScore = max === '+inf' ? Infinity : Number(max);
      let removed = 0;
      for (const [member, score] of set.entries()) {
        if (score >= minScore && score <= maxScore) {
          set.delete(member);
          removed++;
        }
      }
      return removed;
    },
    zrange: async (key: string, start: number, stop: number, ...args: string[]) => {
      const set = sortedSets.get(key);
      if (!set) {
return [];
}
      const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
      const endIdx = stop < 0 ? entries.length + stop + 1 : stop + 1;
      const slice = entries.slice(start, endIdx);
      if (args.includes('WITHSCORES')) {
        return slice.flatMap(([member, score]) => [member, String(score)]);
      }
      return slice.map(([member]) => member);
    },
    // Lua script evaluation (simplified for rate limiting)
    eval: async (script: string, numKeys: number, ...args: string[]) => {
      // Simplified mock implementation for rate limiting script
      const key = args[0];
      const now = parseInt(args[1], 10);
      const windowStart = parseInt(args[2], 10);
      const maxRequests = parseInt(args[3], 10);
      const windowSeconds = parseInt(args[4], 10);

      // Remove old entries
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      for (const [member, score] of set.entries()) {
        if (score < windowStart) {
          set.delete(member);
        }
      }

      // Check count
      const currentCount = set.size;
      if (currentCount < maxRequests) {
        // Add new entry
        set.set(`${now}-${Math.random()}`, now);
        return [1, maxRequests - currentCount - 1, 0];
      } else {
        // Get oldest for retry-after
        const oldest = Array.from(set.values()).sort((a, b) => a - b)[0];
        const retryAfter = Math.ceil((oldest + windowSeconds * 1000 - now) / 1000);
        return [0, 0, Math.max(0, retryAfter)];
      }
    },
    quit: async () => {
      mockData.clear();
      sortedSets.clear();
      return 'OK';
    },
    disconnect: () => {
      mockData.clear();
      sortedSets.clear();
    },
  } as unknown as Redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
