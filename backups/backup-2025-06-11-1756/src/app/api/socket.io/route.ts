import { NextRequest, NextResponse } from 'next/server';
import socketHandler from '@/lib/socket/server';

// WebSocket API route
export async function GET(req: NextRequest) {
  // Create a mock response object
  const res = new NextResponse();
  
  // Add socket server property
  (res as any).socket = {
    server: {}
  };

  await socketHandler(req as any, res as any);
  return new NextResponse('WebSocket connection established');
}
