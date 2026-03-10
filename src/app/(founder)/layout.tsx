import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { FounderShell } from '@/components/layout/FounderShell'

// All founder pages require auth — render at request time only
export const dynamic = 'force-dynamic';

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <FounderShell>{children}</FounderShell>
}
