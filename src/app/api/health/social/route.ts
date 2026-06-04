// src/app/api/health/social/route.ts
// Social platform credential status check
// Returns configuration status for all social platforms

import { NextResponse } from 'next/server'

interface PlatformStatus {
  name: string
  configured: boolean
  envVars: string[]
  missingVars: string[]
  setupUrl: string
  note?: string
}

export async function GET() {
  const platforms: PlatformStatus[] = [
    {
      name: 'Meta (Facebook/Instagram/WhatsApp)',
      configured: false,
      envVars: ['META_APP_ID', 'META_APP_SECRET'],
      missingVars: [],
      setupUrl: 'https://developers.facebook.com/',
      note: 'One app unlocks Facebook, Instagram, and WhatsApp',
    },
    {
      name: 'LinkedIn',
      configured: false,
      envVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
      missingVars: [],
      setupUrl: 'https://developer.linkedin.com/',
      note: 'Company page posting and analytics',
    },
    {
      name: 'TikTok',
      configured: false,
      envVars: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
      missingVars: [],
      setupUrl: 'https://developers.tiktok.com/',
      note: 'Video upload and publishing',
    },
    {
      name: 'YouTube',
      configured: false,
      envVars: ['YOUTUBE_API_KEY'],
      missingVars: [],
      setupUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
      note: 'Enable YouTube Data API v3 in Google Cloud Console',
    },
    {
      name: 'Reddit',
      configured: false,
      envVars: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
      missingVars: [],
      setupUrl: 'https://www.reddit.com/prefs/apps',
      note: 'Social monitoring and cross-posting (optional)',
    },
  ]

  let configuredCount = 0

  for (const p of platforms) {
    for (const v of p.envVars) {
      const val = process.env[v]
      if (!val || val.startsWith('your-') || val.length < 5) {
        p.missingVars.push(v)
      }
    }
    p.configured = p.missingVars.length === 0
    if (p.configured) configuredCount++
  }

  return NextResponse.json({
    success: true,
    totalPlatforms: platforms.length,
    configuredPlatforms: configuredCount,
    missingPlatforms: platforms.length - configuredCount,
    platforms: platforms.map((p) => ({
      name: p.name,
      configured: p.configured,
      missingVars: p.missingVars,
      setupUrl: p.setupUrl,
      note: p.note,
    })),
    overallStatus: configuredCount === platforms.length
      ? 'all_configured'
      : configuredCount === 0
      ? 'none_configured'
      : 'partial',
  })
}
