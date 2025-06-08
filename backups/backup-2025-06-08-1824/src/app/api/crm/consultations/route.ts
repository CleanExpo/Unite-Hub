import { createApiClient } from '@/lib/supabase/api'
import { NextResponse } from 'next/server'

async function handleGET() {
  try {
    const supabase = await createApiClient()
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching consultations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePOST(request: Request) {
  try {
    const supabase = await createApiClient()
    const consultationData = await request.json()

    const { data, error } = await supabase
      .from('consultations')
      .insert(consultationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating consultation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = handleGET;
export const POST = handlePOST;
