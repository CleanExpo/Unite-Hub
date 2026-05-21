// src/lib/advisory/evidence-extractor.ts
// Extracts and validates ATO citations from firm proposal structured data.
// Validates citation format (not existence — that's the accountant's job).

import type { Citation, CitationType, AdvisoryEvidence } from './types'

// ── Known ATO reference patterns ─────────────────────────────────────────────

const CITATION_PATTERNS: Array<{ pattern: RegExp; type: CitationType }> = [
  // Tax Rulings: TR 93/30, TR 2021/1
  { pattern: /^TR\s*\d{2,4}\/\d+$/i, type: 'ato_ruling' },
  // Practical Compliance Guidelines: PCG 2021/4
  { pattern: /^PCG\s*\d{4}\/\d+$/i, type: 'ato_guidance' },
  // Tax Determinations: TD 2024/3
  { pattern: /^TD\s*\d{4}\/\d+$/i, type: 'ato_ruling' },
  // Legislation sections: S.8-1, S.328-180, S.355-25
  { pattern: /^S\.\d+-\d+$/i, type: 'legislation' },
  // Divisions: Div 7A, Div 28, Div 100-152, Div 328
  { pattern: /^Div\s*\d+(-\d+)?[A-Z]?$/i, type: 'legislation' },
  // Parts: Part IVA
  { pattern: /^Part\s+[IVX]+[A-Z]?$/i, type: 'legislation' },
  // Acts: ITAA 1936, ITAA 1997, GST Act 1999, FBT Act 1986
  { pattern: /^(ITAA|GST Act|FBT Act|SG Act|TAA)\s*\d{4}$/i, type: 'legislation' },
  // Practical statements: PS LA 2005/24
  { pattern: /^PS\s*LA\s*\d{4}\/\d+$/i, type: 'ato_guidance' },
  // STP Phase 2 (guidance)
  { pattern: /^STP\s+(Phase\s+)?\d$/i, type: 'ato_guidance' },
  // TPAR
  { pattern: /^TPAR$/i, type: 'ato_guidance' },
  // EMDG Act
  { pattern: /^EMDG\s+Act\s+\d{4}$/i, type: 'legislation' },
  // Industry Research and Development Act
  { pattern: /^Industry\s+Research/i, type: 'legislation' },
  // DPN regime
  { pattern: /^DPN\s+regime$/i, type: 'legislation' },
]

/**
 * Validate a citation reference against known ATO patterns.
 * Returns true if the reference matches any known format.
 */
export function isValidCitationFormat(reference: string): boolean {
  return CITATION_PATTERNS.some(({ pattern }) => pattern.test(reference.trim()))
}

/**
 * Infer citation type from reference string if the provided type seems wrong.
 */
export function inferCitationType(reference: string): CitationType | null {
  const trimmed = reference.trim()
  for (const { pattern, type } of CITATION_PATTERNS) {
    if (pattern.test(trimmed)) return type
  }
  return null
}

/**
 * Extract and validate citations from a firm proposal's structured data.
 * Returns validated citations ready for database insertion.
 */
export function extractCitations(
  proposalId: string,
  caseId: string,
  founderId: string,
  citations: Citation[]
): Omit<AdvisoryEvidence, 'id' | 'created_at'>[] {
  return citations.map(citation => {
    const isValid = isValidCitationFormat(citation.reference)
    const inferredType = inferCitationType(citation.reference)

    return {
      proposal_id: proposalId,
      case_id: caseId,
      founder_id: founderId,
      citation_type: inferredType ?? citation.type,
      reference_id: citation.reference,
      reference_title: citation.title,
      excerpt: citation.relevance,
      relevance_score: isValid ? 1.0 : 0.5, // Lower score for unrecognised formats
      url: buildAtoUrl(citation.reference),
    }
  })
}

/**
 * Build a best-effort ATO URL for a reference.
 * Returns null if no URL can be constructed.
 */
function buildAtoUrl(reference: string): string | null {
  const trimmed = reference.trim()

  // Tax Rulings
  if (/^TR\s*\d{2,4}\/\d+$/i.test(trimmed)) {
    const normalised = trimmed.replace(/\s+/g, ' ').toUpperCase()
    return `https://www.ato.gov.au/law/view/document?docid=${encodeURIComponent(normalised)}`
  }

  // Legislation (generic ATO law search)
  if (/^(S\.|Div|Part)\s*/i.test(trimmed)) {
    return `https://www.ato.gov.au/law/view/search?q=${encodeURIComponent(trimmed)}`
  }

  return null
}
