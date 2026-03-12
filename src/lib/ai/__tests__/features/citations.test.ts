// src/lib/ai/__tests__/features/citations.test.ts
// Tests for citation extraction and formatting.

import { describe, it, expect } from 'vitest'
import {
  extractCitations,
  formatCitationsForUI,
  type FormattedCitation,
} from '../../features/citations'

describe('extractCitations', () => {
  it('extracts TR and Division citations from tax-related text', () => {
    const text =
      'According to TR 2024/1, the CGT discount under Division 115 applies ' +
      'when the asset has been held for more than 12 months. See also TD 2023/5 ' +
      'for guidance on Subdivision 115-A.'

    const citations = extractCitations(text)

    const types = citations.map((c) => c.type)
    expect(types).toContain('ato_ruling')
    expect(types).toContain('legislation')

    const references = citations.map((c) => c.reference)
    expect(references).toContain('TR 2024/1')
    expect(references).toContain('Division 115')
    expect(references).toContain('TD 2023/5')
    expect(references).toContain('Subdivision 115-A')
  })

  it('extracts ATO guidance references', () => {
    const text = 'The ATO has issued PCG 2024/1 and LCR 2023/2 on this matter.'
    const citations = extractCitations(text)
    const references = citations.map((c) => c.reference)
    expect(references).toContain('PCG 2024/1')
    expect(references).toContain('LCR 2023/2')
    expect(citations.every((c) => c.type === 'ato_guidance')).toBe(true)
  })

  it('extracts Part IVA references', () => {
    const text = 'Part IVA may apply to this arrangement.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].type).toBe('legislation')
    expect(citations[0].reference).toBe('Part IVA')
  })

  it('extracts case law citations', () => {
    const text = 'As established in Smith v Commissioner [2023], the principle holds.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].type).toBe('case_law')
    expect(citations[0].reference).toBe('Smith v Commissioner [2023]')
  })

  it('extracts case law with FCT', () => {
    const text = 'In Jones v FCT [2022], the court found otherwise.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].type).toBe('case_law')
  })

  it('extracts Act references', () => {
    const text = 'Under the ITAA 1997 and GST Act provisions.'
    const citations = extractCitations(text)
    const references = citations.map((c) => c.reference)
    expect(references).toContain('ITAA 1997')
    expect(references).toContain('GST Act')
  })

  it('extracts Section references', () => {
    const text = 'Section 100 applies in this case.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].reference).toBe('Section 100')
    expect(citations[0].type).toBe('legislation')
  })

  it('extracts PS LA rulings', () => {
    const text = 'See PS LA 2024/3 for the administrative approach.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].type).toBe('ato_ruling')
    expect(citations[0].reference).toBe('PS LA 2024/3')
  })

  it('extracts IT rulings', () => {
    const text = 'IT 2650 provides guidance on this topic.'
    const citations = extractCitations(text)
    expect(citations).toHaveLength(1)
    expect(citations[0].type).toBe('ato_ruling')
    expect(citations[0].reference).toBe('IT 2650')
  })

  it('returns empty for text without citations', () => {
    const text = 'The weather today is sunny and warm.'
    expect(extractCitations(text)).toEqual([])
  })
})

describe('formatCitationsForUI', () => {
  it('formats as numbered footnotes', () => {
    const citations: FormattedCitation[] = [
      { type: 'ato_ruling', title: 'TR 2024/1', reference: 'TR 2024/1' },
      { type: 'legislation', title: 'Division 115', reference: 'Division 115' },
    ]

    const formatted = formatCitationsForUI(citations)
    expect(formatted).toContain('[1] TR 2024/1 (ato_ruling)')
    expect(formatted).toContain('[2] Division 115 (legislation)')
  })

  it('returns empty string for empty citations', () => {
    expect(formatCitationsForUI([])).toBe('')
  })
})
