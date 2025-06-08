import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handle GET requests (return method info)
export async function GET() {
  return NextResponse.json({
    message: 'Contact API endpoint',
    methods: ['POST'],
    description: 'Submit contact form data via POST request'
  }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Store contact form submission
    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        service: data.service,
        budget: data.budget,
        timeline: data.timeline,
        message: data.message,
        status: 'new',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving contact submission:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    // Send email notification (you can implement this later)
    // await sendNotificationEmail(data)

    return NextResponse.json(
      { success: true, message: 'Contact form submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
