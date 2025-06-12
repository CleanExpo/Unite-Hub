import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ðŸ“Š GET CRM DASHBOARD DATA
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Get dashboard metrics
    const [
      { count: totalClients },
      { count: totalDeals },
      { count: totalInvoices },
      { count: totalTasks }
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('deals').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      data: {
        metrics: {
          totalClients: totalClients || 0,
          totalDeals: totalDeals || 0,
          totalInvoices: totalInvoices || 0,
          totalTasks: totalTasks || 0
        }
      }
    })

  } catch (error) {
    console.error('CRM Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
