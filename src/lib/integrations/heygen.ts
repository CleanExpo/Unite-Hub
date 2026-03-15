// src/lib/integrations/heygen.ts
// HeyGen API client — AI talking-head video generation

const HEYGEN_API = 'https://api.heygen.com'

function getApiKey(): string {
  const key = process.env.HEYGEN_API_KEY?.trim()
  if (!key) throw new Error('[HeyGen] HEYGEN_API_KEY not configured')
  return key
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeyGenVideoRequest {
  avatarId: string
  script: string
  voiceId?: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  title?: string
}

export interface HeyGenVideoStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  error: string | null
}

export interface HeyGenAvatar {
  avatarId: string
  avatarName: string
  gender: string
  previewUrl: string | null
}

// ── Dimension mapping ────────────────────────────────────────────────────────

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
}

// ── Internal helpers ─────────────────────────────────────────────────────────

interface HeyGenApiResponse<T> {
  code: number
  data: T
  message: string | null
  error: string | null
}

async function heygenFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiKey = getApiKey()

  const res = await fetch(`${HEYGEN_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      ...options.headers,
    },
  })

  const json = (await res.json()) as HeyGenApiResponse<T>

  if (!res.ok || json.error) {
    const msg = json.error ?? json.message ?? `HTTP ${res.status}`
    throw new Error(`[HeyGen] API error: ${msg}`)
  }

  return json.data
}

// ── Client Functions ─────────────────────────────────────────────────────────

/**
 * Create a talking-head video via HeyGen's Video Generation API v2.
 * Returns the video_id which can be polled via getVideoStatus().
 *
 * HeyGen API: POST https://api.heygen.com/v2/video/generate
 */
export async function createTalkingHeadVideo(
  request: HeyGenVideoRequest,
): Promise<string> {
  const { avatarId, script, voiceId, aspectRatio = '9:16', title } = request
  const dimension = DIMENSIONS[aspectRatio]

  const body = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          input_text: script,
          ...(voiceId ? { voice_id: voiceId } : {}),
        },
      },
    ],
    dimension,
    aspect_ratio: aspectRatio,
    ...(title ? { title } : {}),
  }

  const data = await heygenFetch<{ video_id: string }>(
    '/v2/video/generate',
    { method: 'POST', body: JSON.stringify(body) },
  )

  return data.video_id
}

/**
 * Check the status of a HeyGen video generation job.
 *
 * HeyGen API: GET https://api.heygen.com/v1/video_status.get?video_id={id}
 */
export async function getVideoStatus(
  videoId: string,
): Promise<HeyGenVideoStatus> {
  const data = await heygenFetch<{
    status: string
    video_url: string | null
    thumbnail_url: string | null
    duration: number | null
    error: string | null
  }>(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`)

  // Map HeyGen statuses to our normalised interface
  const statusMap: Record<string, HeyGenVideoStatus['status']> = {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
  }

  return {
    status: statusMap[data.status] ?? 'pending',
    videoUrl: data.video_url ?? null,
    thumbnailUrl: data.thumbnail_url ?? null,
    duration: data.duration ?? null,
    error: data.error ?? null,
  }
}

/**
 * List available HeyGen avatars.
 *
 * HeyGen API: GET https://api.heygen.com/v2/avatars
 */
export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const data = await heygenFetch<{
    avatars: Array<{
      avatar_id: string
      avatar_name: string
      gender: string
      preview_image_url?: string | null
    }>
  }>('/v2/avatars')

  return data.avatars.map((a) => ({
    avatarId: a.avatar_id,
    avatarName: a.avatar_name,
    gender: a.gender,
    previewUrl: a.preview_image_url ?? null,
  }))
}
