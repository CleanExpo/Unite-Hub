import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ðŸ’° INVOICE MANAGEMENT API - GET ALL INVOICES
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('client_id') || ''
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(
          id, name, email, company
        ),
        created_by_profile:user_profiles!invoices_created_by_fkey(
          id, full_name, email
        ),
        invoice_items(
          id, description, quantity, unit_price, amount
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Execute query with pagination
    const { data: invoices, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: invoices || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Invoices API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ðŸ’° INVOICE MANAGEMENT API - CREATE NEW INVOICE
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Validate required fields
    if (!body.client_id || !body.amount || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Client ID, amount, and items are required' }, 
        { status: 400 }
      )
    }

    // Get user profile for created_by
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Calculate due date (30 days from now by default)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (body.payment_terms || 30))

    // Create invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: body.client_id,
      amount: parseFloat(body.amount),
      currency: body.currency || 'AUD',
      status: 'draft',
      due_date: dueDate.toISOString(),
      payment_terms: body.payment_terms || 30,
      notes: body.notes || null,
      created_by: userProfile.id,
      metadata: body.metadata || {}
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select(`
        *,
        client:clients(id, name, email, company)
      `)
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    if (body.items.length > 0) {
      const invoiceItems = body.items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price),
        amount: parseFloat(item.amount || (item.quantity * item.unit_price))
      }))

      await supabase
        .from('invoice_items')
        .insert(invoiceItems)
    }

    return NextResponse.json({ data: invoice }, { status: 201 })

  } catch (error) {
    console.error('Invoice Creation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
