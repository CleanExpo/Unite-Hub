/**
 * Neo4j Schema Management API
 *
 * POST /api/neo4j/schema - Initialize schema (constraints and indexes)
 * GET /api/neo4j/schema - Verify schema and get statistics
 * DELETE /api/neo4j/schema - Drop schema (use with caution!)
 *
 * @module api/neo4j/schema
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeSchema,
  verifySchema,
  getSchemaStats,
  dropSchema,
} from '@/lib/neo4j/schema';

/**
 * GET /api/neo4j/schema
 *
 * Verify schema and get statistics
 *
 * @returns Schema health and stats
 */
export async function GET() {
  try {
    const [health, stats] = await Promise.all([verifySchema(), getSchemaStats()]);

    return NextResponse.json({
      status: health.status,
      constraints: health.constraints,
      indexes: health.indexes,
      statistics: {
        nodes: stats.nodes,
        relationships: stats.relationships,
        totalNodes: stats.totalNodes,
        totalRelationships: stats.totalRelationships,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j schema verification error:', error);

    return NextResponse.json(
      {
        error: 'Schema verification failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neo4j/schema
 *
 * Initialize schema (constraints and indexes)
 *
 * @returns Initialization result
 */
export async function POST() {
  try {
    await initializeSchema();

    const [health, stats] = await Promise.all([verifySchema(), getSchemaStats()]);

    return NextResponse.json({
      success: true,
      message: 'Schema initialized successfully',
      status: health.status,
      constraints: health.constraints,
      indexes: health.indexes,
      statistics: {
        nodes: stats.nodes,
        relationships: stats.relationships,
        totalNodes: stats.totalNodes,
        totalRelationships: stats.totalRelationships,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j schema initialization error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Schema initialization failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/neo4j/schema
 *
 * Drop all constraints and indexes
 *
 * ⚠️  DANGER: This will remove all schema but not data
 *
 * @returns Drop result
 */
export async function DELETE() {
  try {
    await dropSchema();

    return NextResponse.json({
      success: true,
      message: 'Schema dropped successfully',
      warning: 'All constraints and indexes have been removed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j schema drop error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Schema drop failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
