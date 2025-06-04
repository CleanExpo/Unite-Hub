import { RuntimeService } from '../base/RuntimeService';
import Redis from 'ioredis';

export class RedisService extends RuntimeService {
  private client: Redis | null = null;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    if (!this.client && typeof window === 'undefined') {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        enableOfflineQueue: false,
        lazyConnect: true
      });
      
      this.client.on('error', (err) => {
        console.warn('Redis connection error:', err.message);
      });
    }
  }

  async connect(): Promise<void> {
    await this.initialize();
    if (this.client) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    await this.initialize();
    if (!this.client) {
      console.warn('Redis client not available');
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.initialize();
    if (!this.client) {
      console.warn('Redis client not available');
      return;
    }
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.warn('Redis set error:', error);
    }
  }

  async execute(): Promise<unknown> {
    return 'Redis service executed successfully';
  }
}
