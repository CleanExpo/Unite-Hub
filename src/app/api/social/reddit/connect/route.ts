import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim()
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim()
  const username = process.env.REDDIT_USERNAME?.trim()
  const password = process.env.REDDIT_PASSWORD?.trim()

  if (!clientId || !clientSecret || !username || !password) {
    const missing: string[] = []
    if (!clientId) missing.push('REDDIT_CLIENT_ID')
    if (!clientSecret) missing.push('REDDIT_CLIENT_SECRET')
    if (!username) missing.push('REDDIT_USERNAME')
    if (!password) missing.push('REDDIT_PASSWORD')

    return NextResponse.json({
      connected: false,
      username: null,
      error: `Missing environment variables: ${missing.join(', ')}`,
    })
  }

  // Verify credentials by requesting a token
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `Unite-Group/1.0 (by /u/${username})`,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username,
        password,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        username: null,
        error: `Reddit auth failed with status ${response.status}`,
      })
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        connected: false,
        username: null,
        error: `Reddit auth error: ${data.error}`,
      })
    }

    return NextResponse.json({
      connected: true,
      username,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      connected: false,
      username: null,
      error: message,
    })
  }
}
