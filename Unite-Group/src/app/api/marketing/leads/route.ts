import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SendGridClient } from '@/lib/marketing/email/sendgrid-client';

// Basic lead validation schema
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  message: z.string().optional(),
  interests: z.string().optional(),
  referralSource: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  emailListId: z.string().optional(),
  additionalData: z.record(z.any()).optional(),
});

/**
 * API handler for lead submissions
 * Handles form submissions, email list subscriptions, and lead tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request data
    const data = await request.json();
    
    // Validate the data
    const validationResult = leadSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid form data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }
    
    const leadData = validationResult.data;
    
    // Track IP and timestamp for analytics
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();
    
    // Add subscriber to email list if consent was given
    if (leadData.marketingConsent && leadData.emailListId) {
      try {
        const sendGridClient = new SendGridClient({
          apiKey: process.env.SENDGRID_API_KEY || '',
        });
        
        // Add to the specified list
        await sendGridClient.addSubscriber({
          email: leadData.email,
          firstName: leadData.firstName,
          lastName: leadData.lastName || undefined,
          listIds: [leadData.emailListId],
          customFields: {
            company: leadData.company || '',
            job_title: leadData.jobTitle || '',
            interests: leadData.interests || '',
            referral_source: leadData.referralSource || '',
            lead_source: 'website_form',
            ip_address: ipAddress,
            signup_date: timestamp,
          },
        });
      } catch (error) {
        console.error('Error adding subscriber to email list:', error);
        // Continue processing even if email subscription fails
      }
    }
    
    // Store lead in database
    // This would connect to your database to store the lead
    // For example, with Supabase:
    /*
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        job_title: leadData.jobTitle,
        message: leadData.message,
        interests: leadData.interests,
        referral_source: leadData.referralSource,
        marketing_consent: leadData.marketingConsent,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: timestamp,
        additional_data: leadData.additionalData,
      });
      
    if (error) {
      console.error('Error storing lead in database:', error);
      throw error;
    }
    */
    
    // For now, we'll just log the lead data
    console.log('New lead captured:', {
      ...leadData,
      ipAddress,
      userAgent,
      timestamp,
    });
    
    // Track lead in analytics
    // This could connect to a service like Segment, Amplitude, etc.
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Lead successfully captured',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing lead:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process lead',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
