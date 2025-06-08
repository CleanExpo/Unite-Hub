import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/utils/redis'

export async function GET(request: NextRequest) {
  const results = {
    configured: false,
    connectionSuccessful: false,
    redisHost: false,
    redisPort: false,
    message: '',
    recommendations: [] as string[]
  }

  try {
    // Check environment variables
    const host = process.env.REDIS_HOST
    const port = process.env.REDIS_PORT

    if (!host) {
      results.recommendations.push('Set REDIS_HOST in your .env.local file (default: localhost)')
    } else {
      results.redisHost = true
    }

    if (!port) {
      results.recommendations.push('Set REDIS_PORT in your .env.local file (default: 6379)')
    } else {
      results.redisPort = true
    }

    // Try to connect to Redis
    try {
      const redis = await getRedis()
      
      if (redis) {
        // Test basic operations
        const testKey = `test:connection:${Date.now()}`
        await redis.set(testKey, 'test-value', 10) // Expire in 10 seconds
        const value = await redis.get(testKey)
        await redis.del(testKey)

        if (value === 'test-value') {
          results.connectionSuccessful = true
          results.configured = true
          results.message = 'Redis connection successful! Basic operations working.'
        } else {
          results.message = 'Redis connected but operations failed'
          results.recommendations.push('Check Redis permissions and configuration')
        }
      } else {
        results.message = 'Redis is optional - app will work without it'
        results.configured = true // Still configured, just not available
        results.recommendations.push('Redis provides caching benefits but is not required')
      }
    } catch (redisError: any) {
      results.message = `Redis connection failed: ${redisError.message}`
      results.recommendations.push('Ensure Redis server is running')
      results.recommendations.push('Check firewall settings')
      results.recommendations.push('Redis is optional - the app will work without it')
      
      // Still mark as configured since Redis is optional
      results.configured = true
    }

    // Return results
    return NextResponse.json({
      success: results.configured,
      details: results,
      timestamp: new Date().toISOString(),
      note: 'Redis is optional for this application'
    }, {
      status: 200 // Always 200 since Redis is optional
    })

  } catch (error: any) {
    return NextResponse.json({
      success: true, // Still success since Redis is optional
      error: error.message || 'Failed to test Redis connection',
      details: results,
      note: 'Redis is optional - the app will function without it'
    }, { status: 200 })
  }
}
