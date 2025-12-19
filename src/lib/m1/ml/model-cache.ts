/**
 * M1 ML Model Cache
 *
 * Advanced caching system for ML models with versioning, TTL, and intelligent invalidation
 * Supports distributed caching and model artifact management
 *
 * Version: v2.8.0
 * Phase: 14A - ML Model Caching & Optimization
 */

export type CacheStrategy = 'lru' | 'lfu' | 'ttl' | 'arc';
export type ModelType = 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision';

/**
 * ML Model metadata
 */
export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  framework: string; // TensorFlow, PyTorch, scikit-learn, etc.
  createdAt: number;
  updatedAt: number;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
    auc?: number;
  };
  hyperparameters: Record<string, unknown>;
  features: string[];
  size: number; // bytes
  checksum: string; // SHA256 hash for integrity
}

/**
 * Cached model entry
 */
export interface CachedModel {
  model: MLModel;
  data: Buffer | object; // Serialized model data
  hitCount: number;
  accessCount: number;
  lastAccessTime: number;
  cacheTime: number;
  ttl?: number; // milliseconds
  expiresAt?: number;
}

/**
 * Model prediction cache entry
 */
export interface PredictionCacheEntry {
  id: string;
  modelId: string;
  modelVersion: string;
  inputHash: string; // Hash of input features
  output: Record<string, unknown>;
  confidence?: number;
  cacheTime: number;
  ttl: number;
  expiresAt: number;
  hits: number;
}

/**
 * ML Model Cache Manager
 */
export class MLModelCache {
  private modelCache: Map<string, CachedModel> = new Map();
  private predictionCache: Map<string, PredictionCacheEntry> = new Map();
  private modelVersions: Map<string, string[]> = new Map(); // modelId -> [version1, version2, ...]
  private cacheStrategy: CacheStrategy;
  private maxCacheSize: number; // in bytes
  private currentCacheSize: number = 0;
  private accessPatterns: Map<string, number[]> = new Map(); // Track access times for LFU

  constructor(strategy: CacheStrategy = 'lru', maxSizeBytes: number = 1024 * 1024 * 100) {
    this.cacheStrategy = strategy;
    this.maxCacheSize = maxSizeBytes;
  }

  /**
   * Store model in cache
   */
  cacheModel(model: MLModel, data: Buffer | object, ttl?: number): void {
    const cacheKey = `${model.id}_${model.version}`;
    const now = Date.now();

    const cachedModel: CachedModel = {
      model,
      data,
      hitCount: 0,
      accessCount: 0,
      lastAccessTime: now,
      cacheTime: now,
      ttl,
      expiresAt: ttl ? now + ttl : undefined,
    };

    // Track size
    const modelSize = Buffer.isBuffer(data) ? data.length : JSON.stringify(data).length;
    this.currentCacheSize += modelSize;

    // Evict if necessary
    if (this.currentCacheSize > this.maxCacheSize) {
      this.evictModels(modelSize);
    }

    this.modelCache.set(cacheKey, cachedModel);

    // Track version
    const versions = this.modelVersions.get(model.id) || [];
    if (!versions.includes(model.version)) {
      versions.push(model.version);
      this.modelVersions.set(model.id, versions);
    }
  }

  /**
   * Retrieve model from cache
   */
  getModel(modelId: string, version: string): CachedModel | null {
    const cacheKey = `${modelId}_${version}`;
    const cached = this.modelCache.get(cacheKey);

    if (!cached) {
return null;
}

    // Check expiration
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      this.modelCache.delete(cacheKey);
      return null;
    }

    // Update access metrics
    cached.hitCount++;
    cached.accessCount++;
    cached.lastAccessTime = Date.now();

    // Track access pattern for LFU
    const pattern = this.accessPatterns.get(cacheKey) || [];
    pattern.push(Date.now());
    // Keep only last 1000 accesses to manage memory
    if (pattern.length > 1000) {
      pattern.shift();
    }
    this.accessPatterns.set(cacheKey, pattern);

    return cached;
  }

  /**
   * Cache prediction result
   */
  cachePrediction(
    modelId: string,
    modelVersion: string,
    inputHash: string,
    output: Record<string, unknown>,
    confidence?: number,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): string {
    const id = `pred_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const entry: PredictionCacheEntry = {
      id,
      modelId,
      modelVersion,
      inputHash,
      output,
      confidence,
      cacheTime: now,
      ttl,
      expiresAt: now + ttl,
      hits: 0,
    };

    this.predictionCache.set(id, entry);
    return id;
  }

  /**
   * Get cached prediction
   */
  getPrediction(modelId: string, inputHash: string): PredictionCacheEntry | null {
    for (const entry of this.predictionCache.values()) {
      if (entry.modelId === modelId && entry.inputHash === inputHash) {
        // Check expiration
        if (Date.now() > entry.expiresAt) {
          this.predictionCache.delete(entry.id);
          continue;
        }

        entry.hits++;
        return entry;
      }
    }

    return null;
  }

  /**
   * Get or create model version
   */
  getLatestVersion(modelId: string): string | null {
    const versions = this.modelVersions.get(modelId);
    return versions && versions.length > 0 ? versions[versions.length - 1] : null;
  }

  /**
   * Get all model versions
   */
  getModelVersions(modelId: string): string[] {
    return this.modelVersions.get(modelId) || [];
  }

  /**
   * Invalidate model cache
   */
  invalidateModel(modelId: string, version?: string): number {
    let invalidated = 0;

    if (version) {
      const key = `${modelId}_${version}`;
      if (this.modelCache.has(key)) {
        this.modelCache.delete(key);
        invalidated++;
      }
    } else {
      // Invalidate all versions
      for (const key of this.modelCache.keys()) {
        if (key.startsWith(`${modelId}_`)) {
          this.modelCache.delete(key);
          invalidated++;
        }
      }
    }

    return invalidated;
  }

  /**
   * Evict models based on cache strategy
   */
  private evictModels(requiredSpace: number): void {
    let freedSpace = 0;
    const toEvict: string[] = [];

    while (freedSpace < requiredSpace && toEvict.length < this.modelCache.size) {
      const target = this.selectEvictionCandidate();
      if (!target) {
break;
}

      toEvict.push(target);

      const model = this.modelCache.get(target);
      if (model && Buffer.isBuffer(model.data)) {
        freedSpace += model.data.length;
      }
    }

    // Perform eviction
    for (const key of toEvict) {
      this.modelCache.delete(key);
      this.accessPatterns.delete(key);
    }

    this.currentCacheSize = Math.max(0, this.currentCacheSize - freedSpace);
  }

  /**
   * Select model to evict based on strategy
   */
  private selectEvictionCandidate(): string | null {
    if (this.modelCache.size === 0) {
return null;
}

    switch (this.cacheStrategy) {
      case 'lru': {
        // Least Recently Used
        let oldest: [string, CachedModel] | null = null;

        for (const [key, model] of this.modelCache) {
          if (!oldest || model.lastAccessTime < oldest[1].lastAccessTime) {
            oldest = [key, model];
          }
        }

        return oldest ? oldest[0] : null;
      }

      case 'lfu': {
        // Least Frequently Used
        let least: [string, CachedModel] | null = null;

        for (const [key, model] of this.modelCache) {
          if (!least || model.accessCount < least[1].accessCount) {
            least = [key, model];
          }
        }

        return least ? least[0] : null;
      }

      case 'ttl': {
        // Expired entries first, then oldest
        for (const [key, model] of this.modelCache) {
          if (model.expiresAt && Date.now() > model.expiresAt) {
            return key;
          }
        }

        // Fall back to LRU
        return this.selectEvictionCandidate();
      }

      default:
        return Array.from(this.modelCache.keys())[0];
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics(): Record<string, unknown> {
    let totalHits = 0;
    let totalAccesses = 0;
    let expiredCount = 0;

    for (const model of this.modelCache.values()) {
      totalHits += model.hitCount;
      totalAccesses += model.accessCount;

      if (model.expiresAt && Date.now() > model.expiresAt) {
        expiredCount++;
      }
    }

    let predictionHits = 0;
    let expiredPredictions = 0;

    for (const pred of this.predictionCache.values()) {
      predictionHits += pred.hits;

      if (Date.now() > pred.expiresAt) {
        expiredPredictions++;
      }
    }

    return {
      cacheStrategy: this.cacheStrategy,
      cachedModels: this.modelCache.size,
      cachedPredictions: this.predictionCache.size,
      totalUniqueModels: this.modelVersions.size,
      cacheUtilization: `${Math.round((this.currentCacheSize / this.maxCacheSize) * 100)}%`,
      modelHitRate: totalAccesses > 0 ? (totalHits / totalAccesses) * 100 : 0,
      predictionHits,
      expiredModels: expiredCount,
      expiredPredictions,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries(): number {
    let cleaned = 0;
    const now = Date.now();

    // Clean expired models
    for (const [key, model] of this.modelCache) {
      if (model.expiresAt && now > model.expiresAt) {
        this.modelCache.delete(key);
        this.accessPatterns.delete(key);
        cleaned++;
      }
    }

    // Clean expired predictions
    for (const [key, pred] of this.predictionCache) {
      if (now > pred.expiresAt) {
        this.predictionCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.modelCache.clear();
    this.predictionCache.clear();
    this.modelVersions.clear();
    this.accessPatterns.clear();
    this.currentCacheSize = 0;
  }
}

// Export singleton
export const modelCache = new MLModelCache('lru', 100 * 1024 * 1024); // 100MB default
