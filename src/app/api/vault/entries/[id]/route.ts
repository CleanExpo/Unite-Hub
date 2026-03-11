// src/app/api/vault/entries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { encrypt, type VaultPayload } from '@/lib/vault'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('credentials_vault')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as {
    label?: string
    service?: string
    username?: string
    secret?: string
    notes?: string
    businessKey?: string
  }

  const update: Record<string, unknown> = {}
  if (body.label) update.label = body.label
  if (body.service) update.service = body.service
  if (body.notes !== undefined) update.notes = body.notes
  if (body.secret) {
    const payload: VaultPayload = encrypt(body.secret)
    update.encrypted_value = payload.encryptedValue
    update.iv = payload.iv
    update.salt = payload.salt
  }

  const supabase = await createClient()

  // Fetch current metadata to merge
  const { data: current } = await supabase
    .from('credentials_vault')
    .select('metadata')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  const currentMeta = (current?.metadata as Record<string, string>) ?? {}
  update.metadata = {
    ...currentMeta,
    ...(body.businessKey !== undefined && { businessKey: body.businessKey }),
    ...(body.username !== undefined && { username: body.username }),
  }

  const { error } = await supabase
    .from('credentials_vault')
    .update(update)
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
