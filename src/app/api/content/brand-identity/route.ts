// GET  /api/content/brand-identity?business={key} — Read brand identity
// PUT  /api/content/brand-identity — Update brand identity
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')

  if (!businessKey) {
    return NextResponse.json({ error: 'Missing ?business= parameter' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('brand_identities')
    .select('*')
    .eq('founder_id', user.id)
    .eq('business_key', businessKey)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Brand identity not found' }, { status: 404 })
  }

  return NextResponse.json({ brandIdentity: data })
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as Record<string, unknown>
  const businessKey = body.business_key as string | undefined

  if (!businessKey) {
    return NextResponse.json({ error: 'Missing business_key in body' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('brand_identities')
    .upsert({ ...body, founder_id: user.id }, { onConflict: 'business_key' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ brandIdentity: data })
}
