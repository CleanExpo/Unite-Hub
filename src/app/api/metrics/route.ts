import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

/**
 * Prometheus metrics endpoint
 * Scraped by Prometheus for monitoring
 */
export async function GET(req: NextRequest) {
  try {
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
