import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
    try {
        // Test basic connection with a simple query
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)

        if (error) {
            throw error
        }

        return NextResponse.json({ 
            success: true,
            message: 'Supabase connection successful',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        // Log the error for debugging
        console.error('Error checking Supabase connection:', error)

        // Send a JSON response with an error message
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to connect to Supabase',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
