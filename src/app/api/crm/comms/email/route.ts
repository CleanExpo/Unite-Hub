import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';
import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to send emails
  if (!await checkPermission(user, 'crm.comms.email')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const emailData = await req.json();
  
  // Validate required fields
  if (!emailData.client_id || !emailData.subject || !emailData.content) {
    return NextResponse.json({ 
      error: 'Client ID, subject and content are required' 
    }, { status: 400 });
  }

  try {
    // Get client email
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email, company_name, contact_person')
      .eq('id', emailData.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Send email
    const resendClient = getResendClient();
    const { data: emailResponse, error: emailError } = await resendClient.emails.send({
      from: 'noreply@unitegroup.au',
      to: client.email,
      subject: emailData.subject,
      html: emailData.content,
      replyTo: user.email  // Fixed property name
    });

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('crm_activities').insert({
      client_id: emailData.client_id,
      interaction_type: 'email',
      subject: emailData.subject,
      summary: `Email sent to ${client.contact_person} at ${client.company_name}`,
      performed_by: user.id,
      email_direction: 'outbound'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      emailId: emailResponse?.id
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      error: 'Failed to send email' 
    }, { status: 500 });
  }
}
