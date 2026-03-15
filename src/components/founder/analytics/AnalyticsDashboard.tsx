// src/components/founder/analytics/AnalyticsDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUSINESSES } from '@/lib/businesses'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsRow {
  id: string
  businessKey: string
  platform: string
  postExternalId: string
  metricDate: string
  impressions: number
  reach: number
  engagements: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  videoViews: number
  engagementRate: number
}

interface AnalyticsSummaryData {
  totalImpressions: number
  totalReach: number
  totalEngagements: number
  totalClicks: number
  averageEngagementRate: number
  byPlatform: Record<string, { impressions: number; engagements: number; postCount: number }>
}

type DateRange = '7d' | '30d' | '90d'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-AU')
}

function computeSummary(rows: AnalyticsRow[]): AnalyticsSummaryData {
  const byPlatform: Record<string, { impressions: number; engagements: number; postCount: number }> = {}

  let totalImpressions = 0
  let totalReach = 0
  let totalEngagements = 0
  let totalClicks = 0
  let engRateSum = 0

  for (const row of rows) {
    totalImpressions += row.impressions
    totalReach += row.reach
    totalEngagements += row.engagements
    totalClicks += row.clicks
    engRateSum += row.engagementRate

    if (!byPlatform[row.platform]) {
      byPlatform[row.platform] = { impressions: 0, engagements: 0, postCount: 0 }
    }
    byPlatform[row.platform].impressions += row.impressions
    byPlatform[row.platform].engagements += row.engagements
    byPlatform[row.platform].postCount += 1
  }

  return {
    totalImpressions,
    totalReach,
    totalEngagements,
    totalClicks,
    averageEngagementRate: rows.length > 0 ? engRateSum / rows.length : 0,
    byPlatform,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  index: number
}

function StatCard({ label, value, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-sm border p-4 flex flex-col gap-1"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
    >
      <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: 'var(--color-text-disabled)' }}>
        {label}
      </span>
      <span className="text-[26px] font-semibold leading-none tracking-tight text-[#00F5FF]">
        {value}
      </span>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-sm border p-4 h-[78px] animate-pulse"
      style={{ background: '#111', borderColor: 'var(--color-border)' }}
    />
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const PLATFORMS = ['all', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'] as const
const PLATFORM_LABELS: Record<string, string> = {
  all: 'All Platforms',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string; days: number }[] = [
  { value: '7d', label: '7d', days: 7 },
  { value: '30d', label: '30d', days: 30 },
  { value: '90d', label: '90d', days: 90 },
]

export default function AnalyticsDashboard() {
  const [selectedBusiness, setSelectedBusiness] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null)

  useEffect(() => {
    const days = DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.days ?? 30
    const params = new URLSearchParams({
      business: selectedBusiness,
      platform: selectedPlatform,
      days: String(days),
    })

    setLoading(true)
    fetch(`/api/analytics?${params.toString()}`)
      .then((res) => res.json() as Promise<{ data: AnalyticsRow[] }>)
      .then(({ data }) => {
        setAnalytics(data ?? [])
        setSummary(computeSummary(data ?? []))
      })
      .catch((err) => {
        console.error('[analytics] fetch failed:', err)
        setAnalytics([])
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [selectedBusiness, selectedPlatform, dateRange])

  // Top 10 posts by engagements
  const topPosts = [...analytics]
    .sort((a, b) => b.engagements - a.engagements)
    .slice(0, 10)

  const platformRows = summary
    ? Object.entries(summary.byPlatform).sort((a, b) => b[1].impressions - a[1].impressions)
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Analytics</h1>

        {/* Date range toggle */}
        <div
          className="flex items-center rounded-sm overflow-hidden border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {DATE_RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDateRange(value)}
              className="px-3 h-8 text-[12px] font-medium transition-colors duration-100"
              style={{
                background: dateRange === value ? 'rgba(0,245,255,0.12)' : 'transparent',
                color: dateRange === value ? '#00F5FF' : 'var(--color-text-muted)',
                borderRight: value !== '90d' ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Business filter */}
        <select
          value={selectedBusiness}
          onChange={(e) => setSelectedBusiness(e.target.value)}
          className="h-8 px-3 rounded-sm text-[12px] font-medium appearance-none cursor-pointer"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <option value="all">All Businesses</option>
          {BUSINESSES.map((biz) => (
            <option key={biz.key} value={biz.key}>
              {biz.name}
            </option>
          ))}
        </select>

        {/* Platform filter */}
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="h-8 px-3 rounded-sm text-[12px] font-medium appearance-none cursor-pointer"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          ) : summary ? (
            <>
              <StatCard label="Impressions" value={formatNumber(summary.totalImpressions)} index={0} />
              <StatCard label="Reach" value={formatNumber(summary.totalReach)} index={1} />
              <StatCard label="Engagements" value={formatNumber(summary.totalEngagements)} index={2} />
              <StatCard label="Clicks" value={formatNumber(summary.totalClicks)} index={3} />
              <StatCard label="Avg Eng%" value={`${summary.averageEngagementRate.toFixed(2)}%`} index={4} />
            </>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {!loading && analytics.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-sm py-12 flex items-center justify-center text-center"
          style={{ border: '1px dashed #00F5FF33' }}
        >
          <p className="text-[13px] max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
            No analytics data yet — connect your social channels and publish content to see metrics here.
          </p>
        </motion.div>
      )}

      {/* Platform Breakdown */}
      {!loading && platformRows.length > 0 && (
        <div
          className="rounded-sm border overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-[13px] font-semibold text-white">Platform Breakdown</h2>
          </div>
          <table className="w-full text-[12px]" style={{ background: 'var(--surface-card)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Platform', 'Posts', 'Impressions', 'Engagements', 'Eng Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium"
                    style={{ color: 'var(--color-text-disabled)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {platformRows.map(([platform, stats]) => {
                const engRate = stats.impressions > 0
                  ? ((stats.engagements / stats.impressions) * 100).toFixed(2)
                  : '0.00'
                return (
                  <motion.tr
                    key={platform}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
                    }}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="px-4 py-2.5 capitalize font-medium text-white">{platform}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                      {stats.postCount.toLocaleString('en-AU')}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                      {formatNumber(stats.impressions)}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                      {formatNumber(stats.engagements)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[#00F5FF]">{engRate}%</td>
                  </motion.tr>
                )
              })}
            </motion.tbody>
          </table>
        </div>
      )}

      {/* Top Posts */}
      {!loading && topPosts.length > 0 && (
        <div
          className="rounded-sm border overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-[13px] font-semibold text-white">Top Posts</h2>
          </div>
          <table className="w-full text-[12px]" style={{ background: 'var(--surface-card)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Platform', 'Post ID', 'Date', 'Impressions', 'Engagements', 'Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium"
                    style={{ color: 'var(--color-text-disabled)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="visible"
            >
              {topPosts.map((post) => (
                <motion.tr
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
                  }}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <td className="px-4 py-2.5 capitalize font-medium text-white">{post.platform}</td>
                  <td
                    className="px-4 py-2.5 font-mono max-w-[120px] truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                    title={post.postExternalId}
                  >
                    {post.postExternalId}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(post.metricDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatNumber(post.impressions)}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatNumber(post.engagements)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-[#00F5FF]">
                    {post.engagementRate.toFixed(2)}%
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </div>
  )
}
