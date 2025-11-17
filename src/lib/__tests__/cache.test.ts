import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager, CacheKeys, CacheTTL } from '../cache';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      await cache.set('test-key', { foo: 'bar' }, 60);
      const value = await cache.get('test-key');
      expect(value).toEqual({ foo: 'bar' });
    });

    it('should return null for missing keys', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await cache.set('test-key', 'value', 60);
      await cache.del('test-key');
      const value = await cache.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('getOrSet', () => {
    it('should execute function on cache miss', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      const result = await cache.getOrSet('test-key', mockFn, 60);
      
      expect(result).toEqual({ data: 'fresh' });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return cached value on cache hit', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      // First call - cache miss
      await cache.getOrSet('test-key', mockFn, 60);
      
      // Second call - cache hit
      const result = await cache.getOrSet('test-key', mockFn, 60);
      
      expect(result).toEqual({ data: 'fresh' });
      expect(mockFn).toHaveBeenCalledTimes(1); // Only called once
    });
  });
});

describe('CacheKeys', () => {
  it('should generate correct user profile key', () => {
    expect(CacheKeys.userProfile('user123')).toBe('user:profile:user123');
  });

  it('should generate correct contact key', () => {
    expect(CacheKeys.contact('contact456')).toBe('contact:contact456');
  });

  it('should generate correct hot leads key', () => {
    expect(CacheKeys.hotLeads('workspace789')).toBe('contacts:hot:workspace789');
  });
});

describe('CacheTTL', () => {
  it('should have correct TTL values', () => {
    expect(CacheTTL.SHORT).toBe(60);
    expect(CacheTTL.MEDIUM).toBe(300);
    expect(CacheTTL.LONG).toBe(900);
    expect(CacheTTL.HOUR).toBe(3600);
    expect(CacheTTL.DAY).toBe(86400);
  });
});
