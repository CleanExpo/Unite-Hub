// src/lib/ai/features/citations.ts
// Citation extraction and formatting for Australian tax and legal references.

// ── Types ───────────────────────────────────────────────────────────────────

export interface FormattedCitation {
  type: 'ato_ruling' | 'legislation' | 'case_law' | 'ato_guidance' | 'web_search' | 'other'
  title: string
  reference?: string
  relevance?: string
  url?: string
}

// ── Citation patterns ───────────────────────────────────────────────────────

type CitationType = FormattedCitation['type']

const CITATION_PATTERNS: Array<{ pattern: RegExp; type: CitationType }> = [
  // ATO rulings: TR YYYY/N, TD YYYY/N, PS LA YYYY/N
  { pattern: /\bTR\s+\d{4}\/\d+/g, type: 'ato_ruling' },
  { pattern: /\bTD\s+\d{4}\/\d+/g, type: 'ato_ruling' },
  { pattern: /\bPS\s+LA\s+\d{4}\/\d+/g, type: 'ato_ruling' },
  { pattern: /\bIT\s+\d{4,}/g, type: 'ato_ruling' },

  // ATO guidance: PCG YYYY/N, LCR YYYY/N
  { pattern: /\bPCG\s+\d{4}\/\d+/g, type: 'ato_guidance' },
  { pattern: /\bLCR\s+\d{4}\/\d+/g, type: 'ato_guidance' },

  // Legislation: Division NNN, Subdivision NNN-X, Part IVA, Section NNN
  { pattern: /\bDivision\s+\d+/g, type: 'legislation' },
  { pattern: /\bSubdivision\s+\d+[-\w]*/g, type: 'legislation' },
  { pattern: /\bPart\s+IV[A-Z]?/g, type: 'legislation' },
  { pattern: /\bSection\s+\d+/g, type: 'legislation' },

  // Acts: ITAA YYYY, GST Act, FBTA YYYY, TAA YYYY
  { pattern: /\bITAA\s+\d{4}/g, type: 'legislation' },
  { pattern: /\bGST\s+Act/g, type: 'legislation' },
  { pattern: /\bFBTA\s+\d{4}/g, type: 'legislation' },
  { pattern: /\bTAA\s+\d{4}/g, type: 'legislation' },

  // Case law: Name v Commissioner/FCT/ATO [YYYY]
  { pattern: /\b[A-Z][a-zA-Z]+\s+v\s+(?:Commissioner|FCT|ATO)\s*\[\d{4}\]/g, type: 'case_law' },
]

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract citations from text using regex patterns for Australian tax references.
 */
export function extractCitations(text: string): FormattedCitation[] {
  const citations: FormattedCitation[] = []
  const seen = new Set<string>()

  for (const { pattern, type } of CITATION_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const reference = match[0]
      if (seen.has(reference)) continue
      seen.add(reference)

      citations.push({
        type,
        title: reference,
        reference,
      })
    }
  }

  return citations
}

/**
 * Format citations as numbered footnotes for UI display.
 */
export function formatCitationsForUI(citations: FormattedCitation[]): string {
  if (citations.length === 0) return ''

  return citations
    .map((c, i) => `[${i + 1}] ${c.title} (${c.type})`)
    .join('\n')
}
