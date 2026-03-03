import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Questionnaire API is working',
    timestamp: new Date().toISOString()
  })
}