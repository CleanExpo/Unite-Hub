import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ðŸ‘¨â€ðŸ’¼ STAFF MANAGEMENT API - GET ALL STAFF
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role') || ''
    const department = searchParams.get('department') || ''
    const isActive = searchParams.get('is_active') || ''
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        manager:staff_hierarchy!staff_hierarchy_staff_id_fkey(
          manager:user_profiles!staff_hierarchy_manager_id_fkey(
            id, full_name, email, job_title
          )
        ),
        subordinates:staff_hierarchy!staff_hierarchy_manager_id_fkey(
          staff:user_profiles!staff_hierarchy_staff_id_fkey(
            id, full_name, email, job_title, role
          )
        )
      `)

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }
    
    if (department) {
      query = query.eq('department', department)
    }
    
    if (isActive) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Execute query with pagination
    const { data: staff, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: staff || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Staff API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ðŸ‘¨â€ðŸ’¼ STAFF MANAGEMENT API - CREATE NEW STAFF MEMBER
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    if (!['super_admin', 'admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Validate required fields
    if (!body.email || !body.full_name || !body.role) {
      return NextResponse.json(
        { error: 'Email, full name, and role are required' }, 
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 400 }
      )
    }

    // Create user profile (this would typically involve creating auth user first)
    const staffData = {
      email: body.email,
      full_name: body.full_name,
      phone: body.phone || null,
      job_title: body.job_title || null,
      department: body.department || null,
      role: body.role,
      permissions: body.permissions || {},
      is_active: body.is_active !== false,
      metadata: body.metadata || {}
    }

    const { data: staffMember, error } = await supabase
      .from('user_profiles')
      .insert(staffData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating staff member:', error)
      return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
    }

    // Create hierarchy relationship if manager specified
    if (body.manager_id) {
      await supabase
        .from('staff_hierarchy')
        .insert({
          staff_id: staffMember.id,
          manager_id: body.manager_id,
          level: 1 // You would calculate this based on manager's level
        })
    }

    return NextResponse.json({ data: staffMember }, { status: 201 })

  } catch (error) {
    console.error('Staff Creation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
