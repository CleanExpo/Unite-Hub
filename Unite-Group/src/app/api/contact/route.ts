import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { sendContactFormNotification, sendContactFormConfirmation } from '@/lib/email/sendEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, service, message } = body;
    
    // Validate required fields
    if (!name || !email || !service || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Insert contact form submission into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        { 
          name,
          email,
          company: company || null,
          service_interest: service,
          message,
          status: 'new',
          submitted_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) {
      console.error('Error submitting contact form:', error);
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      );
    }
    
    // Send email notification to admin
    const adminNotification = await sendContactFormNotification({
      name,
      email,
      company,
      service,
      message
    });
    
    if (!adminNotification.success) {
      console.warn('Failed to send admin notification:', adminNotification.message);
      // Continue with the process even if admin notification fails
    }
    
    // Send confirmation email to user
    const userConfirmation = await sendContactFormConfirmation({
      name,
      email,
      service
    });
    
    if (!userConfirmation.success) {
      console.warn('Failed to send user confirmation:', userConfirmation.message);
      // Continue with the process even if user confirmation fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
