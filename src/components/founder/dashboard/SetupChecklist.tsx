// src/components/founder/dashboard/SetupChecklist.tsx
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

interface ChecklistItem {
  label: string
  complete: boolean
  href?: string
  linkText?: string
}

async function getSetupStatus(founderId: string): Promise<ChecklistItem[]> {
  const supabase = createServiceClient()

  const [xeroResult, googleResult, advisoryResult, socialResult, contactsResult] =
    await Promise.all([
      supabase
        .from('credentials_vault')
        .select('id', { count: 'exact', head: true })
        .eq('founder_id', founderId)
        .eq('service', 'xero'),
      supabase
        .from('credentials_vault')
        .select('id', { count: 'exact', head: true })
        .eq('founder_id', founderId)
        .eq('service', 'google'),
      supabase
        .from('advisory_cases')
        .select('id', { count: 'exact', head: true })
        .eq('founder_id', founderId),
      supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('founder_id', founderId),
      supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('founder_id', founderId),
    ])

  const linearConnected = !!process.env.LINEAR_API_KEY

  return [
    {
      label: 'Xero connected',
      complete: (xeroResult.count ?? 0) > 0,
      href: '/founder/xero',
      linkText: 'Connect',
    },
    {
      label: 'Google connected',
      complete: (googleResult.count ?? 0) > 0,
      href: '/founder/email',
      linkText: 'Connect',
    },
    {
      label: 'Linear synced',
      complete: linearConnected,
      href: '/founder/kanban',
      linkText: 'Configure',
    },
    {
      label: 'First advisory case',
      complete: (advisoryResult.count ?? 0) > 0,
      href: '/founder/advisory',
      linkText: 'Start',
    },
    {
      label: 'First social post',
      complete: (socialResult.count ?? 0) > 0,
      href: '/founder/social',
      linkText: 'Create',
    },
    {
      label: 'First contact added',
      complete: (contactsResult.count ?? 0) > 0,
      href: '/founder/contacts',
      linkText: 'Add',
    },
  ]
}

export async function SetupChecklist({ founderId }: { founderId: string }) {
  const items = await getSetupStatus(founderId)
  const completedCount = items.filter((i) => i.complete).length
  const totalCount = items.length
  const allComplete = completedCount === totalCount
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <div
      className="rounded-sm border p-5"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2
        className="text-xs font-medium uppercase tracking-wider mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Setup Progress
      </h2>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {completedCount}/{totalCount} complete
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {progressPercent}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-sm w-full overflow-hidden"
          style={{ background: 'var(--surface-elevated)' }}
        >
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm">
            {item.complete ? (
              <span
                className="flex-shrink-0 text-sm font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                ✓
              </span>
            ) : (
              <span
                className="flex-shrink-0 text-sm"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                ○
              </span>
            )}
            <span
              style={{
                color: item.complete
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
              }}
            >
              {item.label}
            </span>
            {!item.complete && item.href && (
              <Link
                href={item.href}
                className="ml-auto text-xs font-medium hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                {item.linkText} →
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Celebration message */}
      {allComplete && (
        <p
          className="mt-4 text-sm font-medium"
          style={{ color: 'var(--color-accent)' }}
        >
          All set — Nexus is fully configured
        </p>
      )}
    </div>
  )
}
