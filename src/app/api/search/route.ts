// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export type SearchContact = {
  id: string
  name: string
  email: string
  company: string | null
}

export type SearchPage = {
  id: string
  title: string
}

export type SearchApproval = {
  id: string
  title: string
  status: string
}

export type SearchResults = {
  contacts: SearchContact[]
  pages: SearchPage[]
  approvals: SearchApproval[]
}

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const pattern = `%${q}%`

  const [contactsResult, pagesResult, approvalsResult] = await Promise.allSettled([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company')
      .eq('founder_id', user.id)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`)
      .limit(5),

    supabase
      .from('nexus_pages')
      .select('id, title')
      .eq('founder_id', user.id)
      .ilike('title', pattern)
      .limit(5),

    supabase
      .from('approval_queue')
      .select('id, title, status')
      .eq('founder_id', user.id)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
  ])

  const contacts: SearchContact[] =
    contactsResult.status === 'fulfilled' && contactsResult.value.data
      ? contactsResult.value.data.map((c) => ({
          id: c.id as string,
          name: [c.first_name, c.last_name].filter(Boolean).join(' '),
          email: (c.email as string) ?? '',
          company: (c.company as string | null) ?? null,
        }))
      : []

  const pages: SearchPage[] =
    pagesResult.status === 'fulfilled' && pagesResult.value.data
      ? pagesResult.value.data.map((p) => ({
          id: p.id as string,
          title: p.title as string,
        }))
      : []

  const approvals: SearchApproval[] =
    approvalsResult.status === 'fulfilled' && approvalsResult.value.data
      ? approvalsResult.value.data.map((a) => ({
          id: a.id as string,
          title: a.title as string,
          status: a.status as string,
        }))
      : []

  return NextResponse.json({ contacts, pages, approvals } satisfies SearchResults)
}
