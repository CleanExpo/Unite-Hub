import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Monitoring Dashboard | Unite Group',
  description: 'Real-time AI system monitoring and insights',
}

export default async function AIDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  // Optional: Check for admin/specific role access
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', session.user.id)
  //   .single()
  
  // if (!profile || profile.role !== 'admin') {
  //   redirect('/dashboard')
  // }
  
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
