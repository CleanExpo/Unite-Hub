// src/components/layout/SidebarBusinessItem.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Business } from '@/lib/businesses'
import { useUIStore } from '@/store/ui'

interface SidebarBusinessItemProps {
  business: Business
  collapsed: boolean
}

export function SidebarBusinessItem({ business, collapsed }: SidebarBusinessItemProps) {
  const pathname = usePathname()
  const expandedBusinesses = useUIStore((s) => s.expandedBusinesses)
  const toggleBusiness = useUIStore((s) => s.toggleBusiness)
  const isExpanded = expandedBusinesses.includes(business.key)
  const isActive = pathname.startsWith(`/founder/${business.key}`)

  return (
    <div>
      <button
        onClick={() => toggleBusiness(business.key)}
        aria-expanded={isExpanded}
        className={cn(
          'nav-item-hover w-full flex items-center gap-2 px-2 h-8 rounded-sm text-[13px] font-medium transition-colors duration-100',
        )}
        style={isActive
          ? { color: 'var(--color-text-primary)', background: 'var(--surface-elevated)' }
          : { color: 'var(--color-text-muted)' }
        }
      >
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: business.color }}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{business.name}</span>
            {business.status === 'planning' && (
              <span
                className="text-[10px] font-medium tracking-widest uppercase"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                plan
              </span>
            )}
            <ChevronRight
              size={12}
              strokeWidth={2}
              className={cn('shrink-0 transition-transform duration-150', isExpanded && 'rotate-90')}
              style={{ color: 'var(--color-text-disabled)' }}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-6 py-0.5 flex flex-col gap-0.5">
              <Link
                href={`/founder/${business.key}/page/new`}
                className="nav-item-hover flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] transition-colors duration-100"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <FileText size={12} strokeWidth={1.75} />
                <span>New Page</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
