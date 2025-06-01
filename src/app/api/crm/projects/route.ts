import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Project schema for validation
const projectSchema = z.object({
  client_id: z.string().uuid(),
  project_name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  project_type: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  actual_cost: z.number().optional(),
  currency: z.string().default('AUD'),
  progress_percentage: z.number().min(0).max(100).default(0),
  team_members: z.array(z.string().uuid()).optional(),
  contract_value: z.number().optional(),
  payment_terms: z.string().optional(),
  deliverables: z.any().optional(),
  risks: z.any().optional(),
  milestones: z.any().optional()
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = new URLSearchParams(url.search)
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Build query with optional filters
    let query = supabase
      .from('projects')
      .select('*')
      
    // Add filters from query parameters
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    
    // Add sorting
    query = query.order('created_at', { ascending: false })
    
    const { data: projects, error } = await query

    if (error) throw error
    return NextResponse.json(projects)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching projects:', message)
    return NextResponse.json(
      { error: `Failed to fetch projects: ${message}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const projectData = await request.json()

  // Validate request body
  const validation = projectSchema.safeParse(projectData)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([validation.data])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating project:', message)
    return NextResponse.json(
      { error: `Failed to create project: ${message}` },
      { status: 500 }
    )
  }
}
