// GET    /api/content/{id} — Read single generated content
// PATCH  /api/content/{id} — Update status (approve/reject)
// DELETE /api/content/{id} — Delete generated content
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  return NextResponse.json({ content: data })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await request.json()) as Record<string, unknown>

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('generated_content')
    .update(body)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ content: data })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('generated_content')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'deleted' })
}
