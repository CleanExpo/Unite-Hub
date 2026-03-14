// src/components/founder/dashboard/CapabilityMap.tsx
import Link from 'next/link'
import {
  Receipt,
  Mail,
  LayoutGrid,
  Sparkles,
} from 'lucide-react'

interface Feature {
  name: string
  description: string
  href?: string
  hint?: string
}

interface Category {
  name: string
  icon: React.ReactNode
  features: Feature[]
}

const CATEGORIES: Category[] = [
  {
    name: 'Finance',
    icon: <Receipt className="h-4 w-4" />,
    features: [
      {
        name: 'Bookkeeper',
        description: 'AI-powered transaction categorisation',
        href: '/founder/bookkeeper',
      },
      {
        name: 'Xero',
        description: 'Live revenue from connected accounts',
        href: '/founder/xero',
      },
      {
        name: 'Advisory',
        description: '4 AI firms debate your tax strategy',
        href: '/founder/advisory',
      },
    ],
  },
  {
    name: 'Communication',
    icon: <Mail className="h-4 w-4" />,
    features: [
      {
        name: 'Email',
        description: 'Gmail threads grouped by business',
        href: '/founder/email',
      },
      {
        name: 'Social',
        description: 'Multi-platform content calendar',
        href: '/founder/social',
      },
      {
        name: 'Contacts',
        description: 'CRM across all businesses',
        href: '/founder/contacts',
      },
    ],
  },
  {
    name: 'Planning',
    icon: <LayoutGrid className="h-4 w-4" />,
    features: [
      {
        name: 'Kanban',
        description: 'Synced with Linear in real time',
        href: '/founder/kanban',
      },
      {
        name: 'Calendar',
        description: 'Events from Google Calendars',
        href: '/founder/calendar',
      },
      {
        name: 'Strategy',
        description: 'Deep analysis with Claude Opus',
        href: '/founder/strategy',
      },
    ],
  },
  {
    name: 'AI Assistants',
    icon: <Sparkles className="h-4 w-4" />,
    features: [
      {
        name: 'Bron AI',
        description: 'Your AI business assistant',
        hint: '\u2318\u21e7B',
      },
      {
        name: 'Idea Capture',
        description: 'Quick thought capture',
        hint: '\u2318I',
      },
      {
        name: 'Command Bar',
        description: 'Jump anywhere instantly',
        hint: '\u2318K',
      },
    ],
  },
]

export function CapabilityMap() {
  return (
    <div className="space-y-4">
      <h2
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        What Nexus Can Do
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <div
            key={category.name}
            className="rounded-sm border p-4"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {/* Category header */}
            <div
              className="flex items-center gap-2 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <span style={{ color: 'var(--color-accent)' }}>
                {category.icon}
              </span>
              <span className="text-sm font-medium">{category.name}</span>
            </div>

            {/* Features list */}
            <ul className="space-y-2">
              {category.features.map((feature) => (
                <li
                  key={feature.name}
                  className="flex items-baseline justify-between gap-2"
                >
                  <div className="min-w-0">
                    {feature.href ? (
                      <Link
                        href={feature.href}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        {feature.name}
                      </Link>
                    ) : (
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {feature.name}
                      </span>
                    )}
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  {feature.hint && (
                    <span
                      className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-sm"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text-muted)',
                        background: 'var(--surface-elevated)',
                      }}
                    >
                      {feature.hint}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
