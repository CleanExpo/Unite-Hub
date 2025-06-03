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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const projectId = params.id

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return NextResponse.json(project)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching project:', message)
    return NextResponse.json(
      { error: `Failed to fetch project: ${message}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const projectId = params.id
  const projectData = await request.json()

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

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
      .update(validation.data)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating project:', message)
    return NextResponse.json(
      { error: `Failed to update project: ${message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const projectId = params.id

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting project:', message)
    return NextResponse.json(
      { error: `Failed to delete project: ${message}` },
      { status: 500 }
    )
  }
}
