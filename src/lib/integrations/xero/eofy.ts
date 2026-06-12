// src/lib/integrations/xero/eofy.ts
//
// Lane X (Xero EOFY sprint, Phase B) — EOFY window helper.
//
// The Australian EOFY for a typical AU business is 30 June. The Xero
// reconciliation window is the ~3 months around that date (1 Jun - 31 Aug
// in AU conventions). This module computes the current position in that
// window so the founder UI and the BAS draft generator can adapt.
//
// Pure function library. No I/O, no time zone math beyond a single UTC
// offset calculation. Tested in __tests__/eofy.test.ts.

/**
 * Australian financial year ends 30 June. We use a "reconciliation window"
 * of 1 June - 31 August as the period when AU businesses typically reconcile
 * BAS and file.
 */
export const AU_EOFY_MONTH = 6 // June (1-indexed: 6 = June, 7 = July)
export const AU_EOFY_DAY = 30

export type XeroEofyPhase =
  | 'before_window'      // 1 Jan - 31 May: too early to bother
  | 'reconciliation'     // 1 Jun - 31 Aug: actively reconcile
  | 'post_window'        // 1 Sep - 31 Dec: BAS filed, closeout

export interface XeroEofyWindow {
  /** ISO date string (YYYY-MM-DD) of the EOFY for the calendar year containing `now`. */
  eofy_date: string
  /** Days from `now` to EOFY. Negative if EOFY has passed. */
  days_to_eofy: number
  /** Which window we're in. */
  phase: XeroEofyPhase
  /** Human-readable recommended action for the current phase. */
  recommended_action: string
  /** ISO timestamp the computation ran. */
  computed_at: string
}

/** Build a YYYY-MM-DD string for a Date. */
function isoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayDiff(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime()
  const rounded = Math.round(ms / 86_400_000)
  // Normalize -0 to 0 (some Math.round paths produce -0).
  return rounded === 0 ? 0 : rounded
}

/**
 * Compute the EOFY window state for `now`. Pure: no I/O, no globals.
 * The injected `today` and `todayDate` (YYYY-MM-DD) let tests pin time.
 */
export function computeEofyWindow(
  now: Date = new Date(),
): XeroEofyWindow {
  const year = now.getUTCFullYear()
  const eofy = new Date(Date.UTC(year, AU_EOFY_MONTH - 1, AU_EOFY_DAY, 0, 0, 0, 0))
  const reconciliationStart = new Date(Date.UTC(year, 5, 1, 0, 0, 0, 0)) // 1 Jun
  const reconciliationEnd = new Date(Date.UTC(year, 8, 0, 23, 59, 59, 999)) // 31 Aug (day 0 of Sep)

  const days = dayDiff(eofy, now)
  const eofyStr = isoDate(eofy)
  const iso = now.toISOString()

  let phase: XeroEofyPhase
  let recommended_action: string
  if (now.getTime() < reconciliationStart.getTime()) {
    phase = 'before_window'
    recommended_action = 'BAS preparation: reconcile monthly Xero data; flag anomalies early.'
  } else if (now.getTime() <= reconciliationEnd.getTime()) {
    phase = 'reconciliation'
    if (days > 0) {
      recommended_action = `${days} day(s) to EOFY. Verify Xero connection, BAS draft data, GST collected.`
    } else if (days === 0) {
      recommended_action = 'EOFY today. Lock Xero data, prepare BAS draft, hold the line on new transactions.'
    } else {
      const daysPast = Math.abs(days)
      recommended_action = `EOFY was ${daysPast} day(s) ago. File BAS; reconcile any pending invoices.`
    }
  } else {
    phase = 'post_window'
    recommended_action = 'BAS filed window. Verify lodgement, archive reconciliation evidence.'
  }

  return {
    eofy_date: eofyStr,
    days_to_eofy: days,
    phase,
    recommended_action,
    computed_at: iso,
  }
}
