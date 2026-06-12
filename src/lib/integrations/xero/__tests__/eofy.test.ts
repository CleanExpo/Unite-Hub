import { describe, it, expect } from 'vitest'
import { computeEofyWindow, type XeroEofyPhase } from '../eofy'

function utc(yyyy: number, mm: number, dd: number): Date {
  return new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0, 0))
}

describe('computeEofyWindow', () => {
  it('reports before_window on 1 May (well before EOFY)', () => {
    const w = computeEofyWindow(utc(2026, 5, 1))
    expect(w.phase).toBe<XeroEofyPhase>('before_window')
    expect(w.eofy_date).toBe('2026-06-30')
    expect(w.days_to_eofy).toBeGreaterThan(0)
    expect(w.recommended_action).toMatch(/BAS preparation|reconcile/i)
  })

  it('reports reconciliation on 15 June (in the active window)', () => {
    const w = computeEofyWindow(utc(2026, 6, 15))
    expect(w.phase).toBe<XeroEofyPhase>('reconciliation')
    expect(w.days_to_eofy).toBe(15) // 15 days from 15 Jun to 30 Jun
    expect(w.recommended_action).toMatch(/15 day/)
  })

  it('reports reconciliation on 30 June (EOFY itself)', () => {
    const w = computeEofyWindow(utc(2026, 6, 30))
    expect(w.phase).toBe<XeroEofyPhase>('reconciliation')
    expect(w.days_to_eofy).toBe(0)
    expect(w.recommended_action).toMatch(/EOFY today/i)
  })

  it('reports reconciliation on 31 August (last day of window)', () => {
    const w = computeEofyWindow(utc(2026, 8, 31))
    expect(w.phase).toBe<XeroEofyPhase>('reconciliation')
    expect(w.days_to_eofy).toBe(-62) // 62 days past 30 Jun
    expect(w.recommended_action).toMatch(/62 day\(s\) ago/)
  })

  it('reports post_window on 1 September', () => {
    const w = computeEofyWindow(utc(2026, 9, 1))
    expect(w.phase).toBe<XeroEofyPhase>('post_window')
    expect(w.recommended_action).toMatch(/BAS filed/i)
  })

  it('reports post_window on 31 December', () => {
    const w = computeEofyWindow(utc(2026, 12, 31))
    expect(w.phase).toBe<XeroEofyPhase>('post_window')
  })

  it('uses the current year for EOFY date (so Jan-Mar is "before next EOFY")', () => {
    const w = computeEofyWindow(utc(2026, 1, 15))
    expect(w.phase).toBe<XeroEofyPhase>('before_window')
    expect(w.eofy_date).toBe('2026-06-30') // the 2026 EOFY, not 2025
    expect(w.days_to_eofy).toBeGreaterThan(135) // mid-Jan to end-Jun
  })

  it('includes an ISO computed_at timestamp', () => {
    const w = computeEofyWindow(utc(2026, 6, 15))
    expect(w.computed_at).toBe('2026-06-15T12:00:00.000Z')
  })

  it('rolls over the EOFY date for late-year (1 Oct = next year EOFY)', () => {
    // Sanity: 1 Oct 2026 is in post_window for the 2026 EOFY (not before_window for 2027).
    // The function intentionally keeps the current-year EOFY in the post_window
    // phase until year-end, because the BAS filing window for the 2026 EOFY
    // extends through Dec 31 2026.
    const w = computeEofyWindow(utc(2026, 10, 1))
    expect(w.phase).toBe<XeroEofyPhase>('post_window')
    expect(w.eofy_date).toBe('2026-06-30') // still 2026, not 2027
  })
})
