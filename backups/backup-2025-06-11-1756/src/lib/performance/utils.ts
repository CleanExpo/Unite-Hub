import { crmOptimizer } from './CrmOptimizations';

// Utility function to optimize database queries
export async function optimizeQuery(tableName: string, baseQuery: any) {
  const monitor = crmOptimizer.getMonitor();
  monitor.startTiming(`db_query_${tableName}`);

  try {
    // Apply common optimizations
    const optimizedQuery = baseQuery
      .limit(1000) // Prevent unbounded queries
      .order('updated_at', { ascending: false }); // Use indexed column

    const result = await optimizedQuery;
    monitor.endTiming(`db_query_${tableName}`);
    
    return result;
  } catch (error) {
    monitor.endTiming(`db_query_${tableName}`);
    throw error;
  }
}

// Utility function for caching API responses
export function withCache<T>(
  cacheKey: string,
  cacheName: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = crmOptimizer.getCache(cacheName);
  
  if (!cache) {
    return fetcher();
  }

  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  // If not in cache, fetch and store
  return fetcher().then(result => {
    cache.set(cacheKey, result);
    return result;
  });
}
