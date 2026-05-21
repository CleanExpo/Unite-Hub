export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getVaultFiles } from '@/lib/integrations/google-drive'
import { NotesPageClient } from '@/components/founder/notes/NotesPageClient'

export default async function NotesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const files = await getVaultFiles(user.id)

  return <NotesPageClient files={files} />
}
