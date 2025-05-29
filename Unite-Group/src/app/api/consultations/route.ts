import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { sendConsultationBookingNotification, sendConsultationBookingConfirmation } from '@/lib/email/sendEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      client_name, 
      client_email, 
      company,
      phone,
      service_type,
      preferred_date,
      preferred_time,
      alternate_date,
      message
    } = body;
    
    // Validate required fields
    if (!client_name || !client_email || !service_type || !preferred_date || !preferred_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Parse dates
    let parsedPreferredDate;
    let parsedAlternateDate = null;
    
    try {
      parsedPreferredDate = new Date(preferred_date).toISOString();
      if (alternate_date) {
        parsedAlternateDate = new Date(alternate_date).toISOString();
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Insert consultation booking into database
    const { data, error } = await supabase
      .from('consultations')
      .insert([
        { 
          client_name,
          client_email,
          company: company || null,
          phone: phone || null,
          service_type,
          preferred_date: parsedPreferredDate,
          preferred_time,
      alternate_date: parsedAlternateDate || undefined,
          message: message || null,
          status: 'pending',
          payment_status: 'unpaid',
          payment_amount: 550.00 // Default consultation fee
        }
      ])
      .select();
      
    if (error) {
      console.error('Error booking consultation:', error);
      return NextResponse.json(
        { error: 'Failed to book consultation' },
        { status: 500 }
      );
    }
    
    // Send email notification to admin
    const adminNotification = await sendConsultationBookingNotification({
      client_name,
      client_email,
      company,
      phone,
      service_type,
      preferred_date: parsedPreferredDate,
      preferred_time,
      alternate_date: parsedAlternateDate || undefined,
      message
    });
    
    if (!adminNotification.success) {
      console.warn('Failed to send admin notification:', adminNotification.message);
      // Continue with the process even if admin notification fails
    }
    
    // Send confirmation email to client
    const clientConfirmation = await sendConsultationBookingConfirmation({
      client_name,
      client_email,
      service_type,
      preferred_date: parsedPreferredDate,
      preferred_time
    });
    
    if (!clientConfirmation.success) {
      console.warn('Failed to send client confirmation:', clientConfirmation.message);
      // Continue with the process even if client confirmation fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Consultation booked successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error processing consultation booking:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    // Determine if user is admin
    const isAdmin = profile?.role === 'admin';
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('consultations')
      .select('*', { count: 'exact' });
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // If not admin, only show user's own consultations
    if (!isAdmin) {
      query = query.eq('client_email', session.user.email);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1);
    
    // Order by created_at
    query = query.order('created_at', { ascending: false });
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching consultations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consultations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
