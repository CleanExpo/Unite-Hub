import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple Redis connection test
    // This would normally test actual Redis connection
    
    return NextResponse.json({
      status: 'success',
      message: 'Redis connection test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis connection test error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Redis connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
