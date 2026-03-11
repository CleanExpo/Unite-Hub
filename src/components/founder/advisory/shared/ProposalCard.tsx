'use client'

import { motion } from 'framer-motion'
import type { AdvisoryProposal } from '@/lib/advisory/types'
import { FIRM_META, type FirmKey } from '@/lib/advisory/types'
import { FirmBadge } from './FirmBadge'

interface ProposalCardProps {
  proposal: AdvisoryProposal
}

const RISK_COLOURS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const firmColour = FIRM_META[proposal.firm_key as FirmKey]?.color ?? '#6b7280'
  const data = proposal.structured_data

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-sm"
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${firmColour}25`,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <FirmBadge firm={proposal.firm_key as FirmKey} />
        {proposal.risk_level && (
          <span
            className="text-[10px] font-medium uppercase"
            style={{ color: RISK_COLOURS[proposal.risk_level] }}
          >
            {proposal.risk_level}
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {data?.summary ?? 'No summary available'}
      </p>

      {/* Strategies count + confidence */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>
          {data?.strategies?.length ?? 0} strategies
        </span>
        {data?.confidenceScore != null && (
          <span className="text-[10px]" style={{ color: '#00F5FF' }}>
            {data.confidenceScore}% confidence
          </span>
        )}
        {proposal.input_tokens != null && proposal.output_tokens != null && (
          <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-disabled)' }}>
            {(proposal.input_tokens + proposal.output_tokens).toLocaleString()} tokens
          </span>
        )}
      </div>

      {/* Citations count */}
      {data?.strategies && (
        <div className="mt-1">
          <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>
            {data.strategies.reduce((sum, s) => sum + (s.citations?.length ?? 0), 0)} citations
          </span>
        </div>
      )}
    </motion.div>
  )
}
