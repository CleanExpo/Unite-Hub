import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const fileField = formData.get('file')
  if (!(fileField instanceof Blob)) {
    return NextResponse.json({ error: 'file field is required (must be a file upload)' }, { status: 400 })
  }

  const filename = (fileField as File).name ?? 'upload'

  if (process.env.UNITE_HUB_TEST_MOCK_AI_FILES === '1') {
    const text = await fileField.text().catch(() => '')
    return NextResponse.json({
      transcript: text || `Mock transcript for ${filename}`,
      filename,
      sizeBytes: fileField.size,
      provider: 'mock',
      liveProviderExecuted: false,
    })
  }

  return NextResponse.json(
    {
      error: 'Transcription provider is not configured for autonomous verification',
      provider: 'not_connected',
      liveProviderExecuted: false,
    },
    { status: 503 }
  )
}
