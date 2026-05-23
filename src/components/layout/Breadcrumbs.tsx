// src/components/layout/Breadcrumbs.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function labelFor(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-1">
      <Link href="/dashboard/overview" className="hover:text-slate-300 transition-colors">
        Dashboard
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`
        const isLast = index === segments.length - 1
        return (
          <span key={href} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            {isLast ? (
              <span className="text-slate-300">{labelFor(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-slate-300 transition-colors">
                {labelFor(segment)}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
