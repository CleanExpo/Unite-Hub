import { Suspense } from 'react'
import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoicesClient } from '@/components/founder/invoices/InvoicesClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Invoices — Nexus' }

export default async function InvoicesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0] tracking-tight">Invoices</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          Create and manage sales invoices across your Xero accounts.
        </p>
      </div>
      <Suspense>
        <InvoicesClient />
      </Suspense>
    </div>
  )
}
