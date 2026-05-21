// src/lib/ai/paper-banana-client.ts
// Nullable singleton HTTP client for PaperBanana visual generation microservice.
// Returns null when PAPER_BANANA_URL is not set — Gemini-only mode.

// ─── Quality Score Thresholds ─────────────────────────────────────────────────

export const QUALITY_APPROVED = 70   // Score >= 70: auto-approve
export const QUALITY_REVIEW = 50     // Score 50-69: needs founder review
                                     // Score < 50: rejected, fall back to Gemini

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface PaperBananaResult {
  imageBase64: string | null
  mimeType: string
  qualityScore: number
  qualityFeedback: string
  error: string | null
}

interface DiagramRequest {
  prompt: string
  style?: Record<string, unknown>
  width?: number
  height?: number
}

interface PlotRequest {
  prompt: string
  data?: Record<string, unknown>
  style?: Record<string, unknown>
  width?: number
  height?: number
}

interface EvaluateResult {
  score: number
  feedback: string
}

// ─── Client Class ─────────────────────────────────────────────────────────────

class PaperBananaClient {
  constructor(private readonly baseUrl: string) {}

  /** POST /api/generate/diagram — concept diagrams, infographics, process flows */
  async generateDiagram(request: DiagramRequest): Promise<PaperBananaResult> {
    return this.callGenerate('/api/generate/diagram', { ...request })
  }

  /** POST /api/generate/plot — data visualisations, charts, graphs */
  async generatePlot(request: PlotRequest): Promise<PaperBananaResult> {
    return this.callGenerate('/api/generate/plot', { ...request })
  }

  /** POST /api/evaluate — quality evaluation via Critic agent */
  async evaluate(imageBase64: string): Promise<EvaluateResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      })

      if (!response.ok) {
        return { score: 0, feedback: `Evaluation failed: HTTP ${response.status}` }
      }

      const data = await response.json() as { score?: number; feedback?: string }
      return {
        score: typeof data.score === 'number' ? data.score : 0,
        feedback: typeof data.feedback === 'string' ? data.feedback : 'No feedback',
      }
    } catch (err) {
      return { score: 0, feedback: `Evaluation error: ${err instanceof Error ? err.message : String(err)}` }
    }
  }

  private async callGenerate(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<PaperBananaResult> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000), // 90s timeout for generation
      })

      if (!response.ok) {
        return {
          imageBase64: null,
          mimeType: 'image/png',
          qualityScore: 0,
          qualityFeedback: `Generation failed: HTTP ${response.status}`,
          error: `PaperBanana returned HTTP ${response.status}`,
        }
      }

      const data = await response.json() as {
        image?: string
        mimeType?: string
        qualityScore?: number
        feedback?: string
        metadata?: Record<string, unknown>
      }

      return {
        imageBase64: typeof data.image === 'string' ? data.image : null,
        mimeType: typeof data.mimeType === 'string' ? data.mimeType : 'image/png',
        qualityScore: typeof data.qualityScore === 'number' ? data.qualityScore : 0,
        qualityFeedback: typeof data.feedback === 'string' ? data.feedback : '',
        error: data.image ? null : 'No image in PaperBanana response',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn('[PaperBanana] Generation failed (non-fatal):', message)
      return {
        imageBase64: null,
        mimeType: 'image/png',
        qualityScore: 0,
        qualityFeedback: '',
        error: message,
      }
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: PaperBananaClient | null = null

/** Returns null if PAPER_BANANA_URL is not configured — Gemini-only mode. */
export function getPaperBananaClient(): PaperBananaClient | null {
  const baseUrl = process.env.PAPER_BANANA_URL
  if (!baseUrl) return null
  if (!_instance) _instance = new PaperBananaClient(baseUrl)
  return _instance
}

/** Reset the singleton — used in tests. */
export function resetPaperBananaClient(): void {
  _instance = null
}
