'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CasesTab } from './tabs/CasesTab'
import { NewCaseTab } from './tabs/NewCaseTab'
import { LiveDebateTab } from './tabs/LiveDebateTab'
import { EvidenceTab } from './tabs/EvidenceTab'
import { HistoryTab } from './tabs/HistoryTab'

const TABS = [
  { key: 'cases', label: 'Cases' },
  { key: 'new', label: 'New Case' },
  { key: 'live', label: 'Live Debate' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'history', label: 'History' },
] as const

type TabKey = (typeof TABS)[number]['key']

function renderTab(key: string) {
  switch (key) {
    case 'cases':    return <CasesTab />
    case 'new':      return <NewCaseTab />
    case 'live':     return <LiveDebateTab />
    case 'evidence': return <EvidenceTab />
    case 'history':  return <HistoryTab />
    default:         return <CasesTab />
  }
}

export function AdvisoryWorkbench() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam)
    ? (tabParam as TabKey)
    : 'cases'

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
                      ? 'opacity-100'
                      : 'opacity-50 hover:opacity-75'
                  }
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="advisory-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: '#00F5FF' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="py-4"
        >
          {renderTab(activeTab)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
