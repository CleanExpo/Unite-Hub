import { getCachedFile, type CachedFile } from './files'

export type TranscriptionProvider = 'mock'
export type TranscriptionPersistenceStatus = 'unknown'

export type TranscriptResult = {
  cacheKey: string
  fileId: string
  filename: string
  provider: TranscriptionProvider
  source: 'mocked_provider'
  transcript: {
    text: string
    language: string
    confidence: number
  }
  persistence: {
    status: TranscriptionPersistenceStatus
    persisted: false
    reason: string
  }
}

export class TranscriptionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

type TranscriptionProviderAdapter = {
  id: TranscriptionProvider
  transcribe(file: CachedFile): Promise<TranscriptResult['transcript']>
}

const TRANSCRIPT_PERSISTENCE_REASON =
  'No active additive transcript persistence migration or existing ai_file_cache transcript column is present.'

const mockProvider: TranscriptionProviderAdapter = {
  id: 'mock',
  async transcribe(file) {
    return {
      text: `Mock transcript for ${file.filename} (${file.cacheKey}).`,
      language: 'en',
      confidence: 1,
    }
  },
}

function resolveProvider(cacheKey: string): TranscriptionProviderAdapter {
  if (process.env.UNITE_HUB_TEST_MOCK_TRANSCRIPTION === '1' && cacheKey.startsWith('__PW_TEST__')) {
    return mockProvider
  }

  throw new TranscriptionError(
    'Live transcription provider is not configured for this endpoint.',
    503,
    'provider_not_configured'
  )
}

export async function transcribeCachedFile(
  founderId: string,
  cacheKey: string
): Promise<TranscriptResult> {
  const cached = await getCachedFile(founderId, cacheKey)
  if (!cached) {
    throw new TranscriptionError('Cached file not found', 404, 'file_not_found')
  }

  const provider = resolveProvider(cacheKey)
  const transcript = await provider.transcribe(cached)

  return {
    cacheKey: cached.cacheKey,
    fileId: cached.fileId,
    filename: cached.filename,
    provider: provider.id,
    source: 'mocked_provider',
    transcript,
    persistence: {
      status: 'unknown',
      persisted: false,
      reason: TRANSCRIPT_PERSISTENCE_REASON,
    },
  }
}
