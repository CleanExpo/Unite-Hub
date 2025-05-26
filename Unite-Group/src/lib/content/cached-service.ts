import { getCache } from '@/lib/cache';
import { ContentService } from './service';
import { Content, ContentType, ContentStatus, BaseContent } from './types';

/**
 * Cache TTL values (in milliseconds)
 */
const CACHE_TTL = {
  // Cache content for 30 minutes
  CONTENT: 30 * 60 * 1000,
  
  // Cache content lists for 10 minutes
  CONTENT_LIST: 10 * 60 * 1000,
  
  // Cache content stats for 15 minutes
  CONTENT_STATS: 15 * 60 * 1000
};

/**
 * Cache tags for invalidation
 */
const CACHE_TAGS = {
  // All content cache items
  CONTENT: 'content',
  
  // Content items by type
  CONTENT_TYPE: (type: ContentType) => `content:type:${type}`,
  
  // Content item by slug
  CONTENT_SLUG: (type: ContentType, slug: string) => `content:${type}:${slug}`,
  
  // Content items by status
  CONTENT_STATUS: (status: ContentStatus) => `content:status:${status}`
};

/**
 * Cache key generators
 */
const CACHE_KEYS = {
  // Key for a single content item
  CONTENT: (type: ContentType, slug: string) => `content:${type}:${slug}`,
  
  // Key for a list of content items with options
  CONTENT_LIST: (type: ContentType, options?: any) => 
    `content:list:${type}:${options ? JSON.stringify(options) : 'all'}`,
  
  // Key for content stats
  CONTENT_STATS: () => `content:stats`
};

/**
 * Content list options interface
 */
interface ContentListOptions {
  status?: ContentStatus;
  limit?: number;
  offset?: number;
  sortBy?: keyof BaseContent;
  sortDirection?: 'asc' | 'desc';
  tag?: string;
}

/**
 * Cached content service that wraps the standard content service
 * with caching capabilities for improved performance
 */
export class CachedContentService {
  private contentService: ContentService;
  
  /**
   * Create a new cached content service
   * @param contentService Optional content service instance to use
   */
  constructor(contentService?: ContentService) {
    this.contentService = contentService || new ContentService();
  }
  
  /**
   * Get a content item by type and slug with caching
   * @param type Content type
   * @param slug Content slug
   * @returns Content item or null if not found
   */
  async getContentItem<T extends Content>(type: ContentType, slug: string): Promise<T> {
    const cacheKey = CACHE_KEYS.CONTENT(type, slug);
    
    return getCache().remember(
      cacheKey,
      async () => {
        return this.contentService.getContentItem<T>(type, slug);
      },
      {
        ttl: CACHE_TTL.CONTENT,
        tags: [
          CACHE_TAGS.CONTENT,
          CACHE_TAGS.CONTENT_TYPE(type),
          CACHE_TAGS.CONTENT_SLUG(type, slug)
        ]
      }
    );
  }
  
  /**
   * Get content items with caching
   * @param type Content type
   * @param options Filter and pagination options
   * @returns List of content items
   */
  async getContent<T extends Content>(
    type: ContentType,
    options?: ContentListOptions
  ): Promise<T[]> {
    const cacheKey = CACHE_KEYS.CONTENT_LIST(type, options);
    const cacheTags = [CACHE_TAGS.CONTENT, CACHE_TAGS.CONTENT_TYPE(type)];
    
    // Add status-specific tags
    if (options?.status) {
      cacheTags.push(CACHE_TAGS.CONTENT_STATUS(options.status));
    }
    
    return getCache().remember(
      cacheKey,
      async () => {
        return this.contentService.getContent<T>(type, options || {});
      },
      {
        ttl: CACHE_TTL.CONTENT_LIST,
        tags: cacheTags
      }
    );
  }
  
  /**
   * Get content statistics with caching
   * @returns Content statistics by type
   */
  async getContentStats(): Promise<Record<ContentType, number>> {
    const cacheKey = CACHE_KEYS.CONTENT_STATS();
    
    return getCache().remember(
      cacheKey,
      async () => {
        return this.contentService.getContentStats();
      },
      {
        ttl: CACHE_TTL.CONTENT_STATS,
        tags: [CACHE_TAGS.CONTENT]
      }
    );
  }
  
  /**
   * Save a content item
   * This operation will invalidate relevant cache tags
   * @param content Content item to save
   * @returns Saved content item
   */
  async saveContent<T extends Content>(content: T): Promise<T> {
    const result = await this.contentService.saveContent<T>(content);
    
    // Invalidate relevant cache tags
    await getCache().invalidateTags([
      CACHE_TAGS.CONTENT,
      CACHE_TAGS.CONTENT_TYPE(content.type),
      CACHE_TAGS.CONTENT_STATUS(content.status),
      CACHE_TAGS.CONTENT_SLUG(content.type, content.slug)
    ]);
    
    return result;
  }
  
  /**
   * Delete a content item
   * This operation will invalidate relevant cache tags
   * @param type Content type
   * @param slug Content slug
   * @returns True if the content was deleted
   */
  async deleteContent(type: ContentType, slug: string): Promise<boolean> {
    const result = await this.contentService.deleteContent(type, slug);
    
    // Invalidate relevant cache tags
    await getCache().invalidateTags([
      CACHE_TAGS.CONTENT,
      CACHE_TAGS.CONTENT_TYPE(type),
      CACHE_TAGS.CONTENT_SLUG(type, slug)
    ]);
    
    return result;
  }
  
  /**
   * Clear all content caches
   * This is useful when performing bulk operations or when the cache gets out of sync
   */
  async clearContentCache(): Promise<void> {
    await getCache().invalidateTags([CACHE_TAGS.CONTENT]);
  }
  
  /**
   * Initialize content directories
   * This passes through to the underlying content service
   */
  async initialize(): Promise<void> {
    return this.contentService.initialize();
  }
}

/**
 * Get a singleton instance of the cached content service
 */
let cachedContentService: CachedContentService | null = null;

/**
 * Get the default cached content service instance
 * @returns The cached content service
 */
export function getCachedContentService(): CachedContentService {
  if (!cachedContentService) {
    cachedContentService = new CachedContentService();
  }
  
  return cachedContentService;
}
