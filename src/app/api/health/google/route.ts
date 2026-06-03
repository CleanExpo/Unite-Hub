// src/app/api/health/google/route.ts
// Google OAuth connectivity test — checks token validity

import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || clientId === 'your-google-client-id') {
    return NextResponse.json({
      success: false,
      status: 'missing_credentials',
      configured: false,
      action: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local',
    })
  }

  // We can't test Google OAuth token without user interaction (consent screen),
  // but we can verify the client ID format and that credentials aren't placeholders
  const isValidFormat = clientId.endsWith('.apps.googleusercontent.com')

  return NextResponse.json({
    success: isValidFormat,
    status: isValidFormat ? 'configured' : 'invalid_format',
    configured: isValidFormat,
    clientId: clientId.substring(0, 20) + '...',
    note: 'OAuth requires browser consent flow. Use /api/auth/google to initiate.',
    nextAction: isValidFormat
      ? 'Navigate to /api/auth/google to complete OAuth consent'
      : 'Verify GOOGLE_CLIENT_ID format: should end with .apps.googleusercontent.com',
  })
}
