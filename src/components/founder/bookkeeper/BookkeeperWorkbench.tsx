'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OverviewTab } from './tabs/OverviewTab'
import { RunHistoryTab } from './tabs/RunHistoryTab'
import { ReconciliationTab } from './tabs/ReconciliationTab'
import { ReceivablesTab } from './tabs/ReceivablesTab'
import { PayablesTab } from './tabs/PayablesTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { BASTab } from './tabs/BASTab'
import { PLTab } from './tabs/PLTab'
import { AIAnalysisTab } from './tabs/AIAnalysisTab'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'runs', label: 'Run History' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'receivables', label: 'Receivables' },
  { key: 'payables', label: 'Payables' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'bas', label: 'BAS' },
  { key: 'pl', label: 'P&L' },
  { key: 'ai-analysis', label: 'AI Analysis' },
] as const

type TabKey = (typeof TABS)[number]['key']

function renderTab(key: string) {
  switch (key) {
    case 'overview':
      return <OverviewTab />
    case 'runs':
      return <RunHistoryTab />
    case 'reconciliation':
      return <ReconciliationTab />
    case 'receivables':
      return <ReceivablesTab />
    case 'payables':
      return <PayablesTab />
    case 'expenses':
      return <ExpensesTab />
    case 'bas':
      return <BASTab />
    case 'pl':
      return <PLTab />
    case 'ai-analysis':
      return <AIAnalysisTab />
    default:
      return <OverviewTab />
  }
}

export function BookkeeperWorkbench() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam)
    ? (tabParam as TabKey)
    : 'overview'

  function setActiveTab(key: TabKey) {
    router.replace(pathname + '?tab=' + key, { scroll: false })
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="overflow-x-auto">
        <div className="flex gap-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="text-[12px] font-medium tracking-wide uppercase px-4 py-3 relative cursor-pointer transition-colors shrink-0"
                style={{ color: isActive ? '#00F5FF' : undefined }}
              >
                <span
                  className={
                    isActive
                      ? ''
                      : 'hover:text-white/60 transition-colors'
                  }
                  style={isActive ? undefined : { color: 'var(--color-text-secondary)' }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00F5FF]"
                    style={{ boxShadow: '0 2px 4px rgba(0,245,255,0.3)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {renderTab(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
