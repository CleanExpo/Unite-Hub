import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { crmOptimizer } from '@/lib/performance/CrmOptimizations';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'report';

    switch (action) {
      case 'report':
        return handlePerformanceReport();
      
      case 'metrics':
        return handleMetrics(searchParams);
      
      case 'cache-stats':
        return handleCacheStats();
      
      case 'clear-cache':
        return handleClearCache(searchParams);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, metrics } = body;

    switch (action) {
      case 'record-metric':
        return handleRecordMetric(metrics);
      
      case 'record-timing':
        return handleRecordTiming(body);
      
      case 'initialize':
        return handleInitialize();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePerformanceReport() {
  try {
    const report = await crmOptimizer.generateReport();
    
    // Add server-side performance metrics
    const serverMetrics = await getServerPerformanceMetrics();
    
    return NextResponse.json({
      ...report,
      serverMetrics,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error generating performance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance report' },
      { status: 500 }
    );
  }
}

async function handleMetrics(searchParams: URLSearchParams) {
  try {
    const metricName = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const monitor = crmOptimizer.getMonitor();
    const metrics = monitor.getMetrics(metricName || undefined);
    
    // Return most recent metrics first, limited by count
    const limitedMetrics = metrics
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return NextResponse.json({
      metrics: limitedMetrics,
      total: metrics.length,
      averageTime: metricName ? monitor.getAverageTime(metricName) : null,
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function handleCacheStats() {
  try {
    const allCacheStats: Record<string, any> = {};
    
    // Get stats for each cache
    ['clients', 'deals', 'tasks', 'analytics'].forEach(cacheName => {
      const cache = crmOptimizer.getCache(cacheName);
      if (cache) {
        allCacheStats[cacheName] = cache.getStats();
      }
    });

    // Calculate overall statistics
    const overallStats = calculateOverallCacheStats(allCacheStats);

    return NextResponse.json({
      individual: allCacheStats,
      overall: overallStats,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}

async function handleClearCache(searchParams: URLSearchParams) {
  try {
    const cacheName = searchParams.get('cache');
    
    if (cacheName && cacheName !== 'all') {
      const cache = crmOptimizer.getCache(cacheName);
      if (cache) {
        cache.clear();
        return NextResponse.json({ 
          message: `Cache '${cacheName}' cleared successfully`,
          cleared: [cacheName],
        });
      } else {
        return NextResponse.json(
          { error: `Cache '${cacheName}' not found` },
          { status: 404 }
        );
      }
    } else {
      // Clear all caches
      crmOptimizer.clearAllCaches();
      return NextResponse.json({ 
        message: 'All caches cleared successfully',
        cleared: ['clients', 'deals', 'tasks', 'analytics'],
      });
    }

  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

async function handleRecordMetric(metrics: any) {
  try {
    const monitor = crmOptimizer.getMonitor();
    
    if (Array.isArray(metrics)) {
      metrics.forEach(metric => monitor.recordMetric(metric));
    } else {
      monitor.recordMetric(metrics);
    }

    return NextResponse.json({ 
      message: 'Metrics recorded successfully',
      count: Array.isArray(metrics) ? metrics.length : 1,
    });

  } catch (error) {
    console.error('Error recording metrics:', error);
    return NextResponse.json(
      { error: 'Failed to record metrics' },
      { status: 500 }
    );
  }
}

async function handleRecordTiming(body: any) {
  try {
    const { name, startTime, endTime, tags } = body;
    const monitor = crmOptimizer.getMonitor();
    
    if (startTime && endTime) {
      // Calculate duration and record directly
      const duration = endTime - startTime;
      monitor.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        type: 'timing',
        tags,
      });
    } else if (startTime) {
      // Start timing
      monitor.startTiming(name, tags);
    } else {
      // End timing
      const duration = monitor.endTiming(name, tags);
      return NextResponse.json({ duration });
    }

    return NextResponse.json({ message: 'Timing recorded successfully' });

  } catch (error) {
    console.error('Error recording timing:', error);
    return NextResponse.json(
      { error: 'Failed to record timing' },
      { status: 500 }
    );
  }
}

async function handleInitialize() {
  try {
    crmOptimizer.initialize();
    
    return NextResponse.json({ 
      message: 'CRM Performance Optimizer initialized successfully',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error initializing optimizer:', error);
    return NextResponse.json(
      { error: 'Failed to initialize performance optimizer' },
      { status: 500 }
    );
  }
}

async function getServerPerformanceMetrics() {
  const metrics: any = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    cpuUsage: process.cpuUsage(),
  };

  // Add additional server metrics if available
  if (process.env.VERCEL) {
    (metrics as any).environment = 'vercel';
    (metrics as any).region = process.env.VERCEL_REGION || 'unknown';
  } else {
    (metrics as any).environment = 'development';
  }

  return metrics;
}

function calculateOverallCacheStats(individualStats: Record<string, any>) {
  const caches = Object.values(individualStats);
  
  if (caches.length === 0) {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: 0,
      memoryUsage: 0,
    };
  }

  const totalHits = caches.reduce((sum, cache) => sum + cache.hits, 0);
  const totalMisses = caches.reduce((sum, cache) => sum + cache.misses, 0);
  const totalSize = caches.reduce((sum, cache) => sum + cache.size, 0);
  const totalMaxSize = caches.reduce((sum, cache) => sum + cache.maxSize, 0);
  const totalMemory = caches.reduce((sum, cache) => sum + cache.memoryUsage, 0);

  return {
    hits: totalHits,
    misses: totalMisses,
    hitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
    size: totalSize,
    maxSize: totalMaxSize,
    memoryUsage: totalMemory,
    efficiency: totalMaxSize > 0 ? totalSize / totalMaxSize : 0,
  };
}
