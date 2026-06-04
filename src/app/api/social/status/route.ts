// src/app/api/social/status/route.ts
// GET /api/social/status
// Returns configuration and connection status for all social platforms

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { SOCIAL_PLATFORMS, isPlatformConfigured, loadPlatformTokens } from '@/lib/integrations/social'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()

  const platforms = await Promise.all(
    SOCIAL_PLATFORMS.map(async (platform) => {
      const configured = isPlatformConfigured(platform.key)
      const tokens = user ? await loadPlatformTokens(user.id, platform.key) : null

      return {
        key: platform.key,
        name: platform.name,
        description: platform.description,
        configured,
        connected: !!tokens,
        connectedAt: tokens?.connectedAt ?? null,
        icon: platform.icon,
        setupUrl: platform.setupUrl,
        docsUrl: platform.docsUrl,
      }
    })
  )

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    platforms,
    connectedCount: platforms.filter(p => p.connected).length,
    configuredCount: platforms.filter(p => p.configured).length,
  })
}
