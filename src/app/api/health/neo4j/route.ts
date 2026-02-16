/**
 * Neo4j Health Check API Endpoint
 *
 * GET /api/health/neo4j - Check Neo4j database connectivity and status
 *
 * @module api/health/neo4j
 */

import { NextResponse } from 'next/server';
import { healthCheck, getServerInfo } from '@/lib/neo4j/client';

/**
 * GET /api/health/neo4j
 *
 * Check Neo4j database health and connectivity
 *
 * @returns Health status with server information
 *
 * @example Response (Healthy):
 * ```json
 * {
 *   "status": "healthy",
 *   "message": "Neo4j connection is healthy",
 *   "details": {
 *     "version": "5.15.0",
 *     "edition": "community",
 *     "address": "bolt://localhost:7687"
 *   },
 *   "timestamp": "2026-01-27T08:00:00.000Z"
 * }
 * ```
 *
 * @example Response (Unhealthy):
 * ```json
 * {
 *   "status": "unhealthy",
 *   "message": "Cannot connect to Neo4j database",
 *   "timestamp": "2026-01-27T08:00:00.000Z"
 * }
 * ```
 */
export async function GET() {
  try {
    const health = await healthCheck();

    return NextResponse.json(
      {
        ...health,
        timestamp: new Date().toISOString(),
      },
      {
        status: health.status === 'healthy' ? 200 : 503,
      }
    );
  } catch (error: unknown) {
    console.error('[API] Neo4j health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
