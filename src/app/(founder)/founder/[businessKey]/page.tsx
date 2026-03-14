export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BUSINESSES } from '@/lib/businesses'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { FileText, Plus, Megaphone, Scale, BookOpen, UserPlus } from 'lucide-react'

interface Props {
  params: Promise<{ businessKey: string }>
}

export default async function BusinessHubPage({ params }: Props) {
  const { businessKey } = await params

  // Validate business key against config
  const business = BUSINESSES.find((b) => b.key === businessKey)
  if (!business) {
    redirect('/founder')
  }

  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const supabase = createServiceClient()

  // Look up the DB business record by slug to get the UUID
  const { data: dbBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('founder_id', user.id)
    .eq('slug', businessKey)
    .maybeSingle()

  const businessId = dbBusiness?.id

  // Fetch data in parallel — gracefully handle missing DB business
  const [contactsResult, pagesResult, xeroResult] = await Promise.all([
    businessId
      ? supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', user.id)
          .eq('business_id', businessId)
      : Promise.resolve({ count: 0 }),
    businessId
      ? supabase
          .from('nexus_pages')
          .select('id, title, updated_at')
          .eq('founder_id', user.id)
          .eq('business_id', businessId)
          .order('updated_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    businessId
      ? supabase
          .from('credentials_vault')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', user.id)
          .eq('service', 'xero')
          .eq('business_id', businessId)
      : Promise.resolve({ count: 0 }),
  ])

  const contactCount = ('count' in contactsResult ? contactsResult.count : 0) ?? 0
  const pages = ('data' in pagesResult ? pagesResult.data : []) ?? []
  const xeroConnected = (('count' in xeroResult ? xeroResult.count : 0) ?? 0) > 0

  const quickActions = [
    { label: 'New Post', href: '/founder/social', icon: Megaphone },
    { label: 'Advisory Case', href: '/founder/advisory', icon: Scale },
    { label: 'View Bookkeeper', href: '/founder/bookkeeper', icon: BookOpen },
    { label: 'Add Contact', href: '/founder/contacts', icon: UserPlus },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="rounded-full"
          style={{ width: 10, height: 10, background: business.color, display: 'inline-block' }}
        />
        <h1
          className="text-xl font-light"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {business.name}
        </h1>
        <span
          className="text-[11px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
          style={{
            background: 'rgba(0, 245, 255, 0.08)',
            color: '#00F5FF',
            border: '1px solid rgba(0, 245, 255, 0.15)',
          }}
        >
          {business.status}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-sm p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-disabled)' }}>
            Xero
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: xeroConnected ? '#00F5FF' : 'var(--color-text-muted)' }}
          >
            {xeroConnected ? 'Connected' : 'Not connected'}
          </p>
        </div>
        <div
          className="rounded-sm p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-disabled)' }}>
            Contacts
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {contactCount}
          </p>
        </div>
        <div
          className="rounded-sm p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-disabled)' }}>
            Pages
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {pages.length}
          </p>
        </div>
      </div>

      {/* Nexus Pages */}
      <div>
        <h2
          className="text-sm font-medium mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Nexus Pages
        </h2>
        <div
          className="rounded-sm divide-y"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            borderColor: 'var(--color-border)',
          }}
        >
          {pages.length === 0 && (
            <p
              className="px-4 py-6 text-center text-[13px]"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              No pages yet. Create your first page below.
            </p>
          )}
          {(pages as Array<{ id: string; title: string; updated_at: string }>).map((page) => (
            <Link
              key={page.id}
              href={`/founder/${businessKey}/page/${page.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-100 hover:brightness-110"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <FileText size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
              <span className="text-[13px] flex-1 truncate">{page.title}</span>
              <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                {new Date(page.updated_at).toLocaleDateString('en-AU')}
              </span>
            </Link>
          ))}
          <Link
            href={`/founder/${businessKey}/page/new`}
            className="flex items-center gap-2 px-4 py-3 transition-colors duration-100"
            style={{ color: '#00F5FF' }}
          >
            <Plus size={14} strokeWidth={2} />
            <span className="text-[13px] font-medium">New Page</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          className="text-sm font-medium mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-sm p-4 flex items-center gap-3 transition-colors duration-100 hover:brightness-110"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <action.icon size={16} strokeWidth={1.5} style={{ color: business.color }} />
              <span className="text-[13px] font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
