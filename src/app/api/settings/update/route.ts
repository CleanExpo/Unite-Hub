import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await request.json()

  const { timezone, locale, notification_digest, notification_alerts, notification_cases, google_drive_vault_folder_id } = body

  // Validate timezone
  const validTimezones = ['Australia/Sydney', 'Australia/Melbourne', 'UTC']
  if (timezone && !validTimezones.includes(timezone)) {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
  }

  // Validate locale
  const validLocales = ['en-AU', 'en-US']
  if (locale && !validLocales.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  // Upsert user settings
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      timezone: timezone || 'Australia/Sydney',
      locale: locale || 'en-AU',
      notification_digest: notification_digest ?? true,
      notification_alerts: notification_alerts ?? true,
      notification_cases: notification_cases ?? true,
      google_drive_vault_folder_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET(_request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Settings don't exist yet, return defaults
    return NextResponse.json({
      timezone: 'Australia/Sydney',
      locale: 'en-AU',
      notification_digest: true,
      notification_alerts: true,
      notification_cases: true,
      google_drive_vault_folder_id: null,
    })
  }

  return NextResponse.json(data)
}
