import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.first_name) {
    return NextResponse.json({ error: 'first_name is required' }, { status: 400 })
  }

  const validStatuses = ['lead', 'prospect', 'client', 'churned', 'archived']
  const status = validStatuses.includes(body.status) ? body.status : 'lead'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      founder_id: user.id,
      business_id: body.business_id || null,
      first_name: body.first_name,
      last_name: body.last_name || null,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      role: body.role || null,
      status,
      tags: body.tags || [],
      metadata: body.metadata || {},
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
