'use client'

import { motion } from 'framer-motion'
import { FIRM_META, type FirmKey } from '@/lib/advisory/types'

/** Accepts both DB format (snake_case) and API format (camelCase) */
interface ScoreEntry {
  firm_key: string
  legality_score: number
  compliance_risk_score: number
  financial_outcome_score: number
  documentation_score: number
  ethics_score: number
  weighted_total: number
  rationale: string
  [key: string]: unknown
}

interface JudgeScorecardProps {
  scores: ScoreEntry[]
  winner: FirmKey | null
}

const CATEGORIES = [
  { key: 'legality_score', label: 'Legality', weight: '40%' },
  { key: 'compliance_risk_score', label: 'Compliance Risk', weight: '25%' },
  { key: 'financial_outcome_score', label: 'Financial Outcome', weight: '20%' },
  { key: 'documentation_score', label: 'Documentation', weight: '10%' },
  { key: 'ethics_score', label: 'Ethics', weight: '5%' },
] as const

export function JudgeScorecard({ scores, winner }: JudgeScorecardProps) {
  const sorted = [...scores].sort(
    (a, b) => Number(b.weighted_total) - Number(a.weighted_total)
  )

  return (
    <div className="space-y-3">
      {sorted.map((score, i) => {
        const firm = score.firm_key as FirmKey
        const meta = FIRM_META[firm]
        const isWinner = firm === winner

        return (
          <motion.div
            key={firm}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-sm"
            style={{
              background: 'var(--surface-card)',
              border: isWinner
                ? `1px solid ${meta?.color ?? '#00F5FF'}`
                : '1px solid var(--color-border)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-[12px] font-medium"
                  style={{ color: meta?.color }}
                >
                  {meta?.name}
                </span>
                {isWinner && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm" style={{ background: '#00F5FF18', color: '#00F5FF' }}>
                    WINNER
                  </span>
                )}
              </div>
              <span className="text-[14px] font-mono font-bold" style={{ color: meta?.color }}>
                {Number(score.weighted_total).toFixed(1)}
              </span>
            </div>

            {/* Score bars */}
            <div className="space-y-1">
              {CATEGORIES.map(({ key, label, weight }) => {
                const value = Number(score[key])
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] w-28 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      {label} ({weight})
                    </span>
                    <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ background: 'var(--surface-elevated)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-sm"
                        style={{ background: meta?.color }}
                      />
                    </div>
                    <span className="text-[10px] font-mono w-7 text-right" style={{ color: 'var(--color-text-disabled)' }}>
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Rationale */}
            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {score.rationale}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
