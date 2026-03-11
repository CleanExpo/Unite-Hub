import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getVaultFileContent } from '@/lib/integrations/google-drive'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })

  try {
    const content = await getVaultFileContent(user.id, fileId)
    return NextResponse.json({ content })
  } catch (_err) {
    return NextResponse.json(
      { error: 'Failed to fetch note content' },
      { status: 500 }
    )
  }
}
