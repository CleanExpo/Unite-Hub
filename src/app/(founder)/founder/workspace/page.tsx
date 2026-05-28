import { redirect } from 'next/navigation'

export default function LegacyWorkspaceRedirectPage() {
  redirect('/founder/dashboard')
}
