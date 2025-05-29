import nodemailer from 'nodemailer';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: any[];
};

// Default environment variable for email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'user@example.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'password';
const DEFAULT_FROM = process.env.DEFAULT_FROM || 'no-reply@unite-group.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@unite-group.com';

/**
 * Send an email using nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  try {
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

/**
 * Send a notification email to admin about a new contact form submission
 */
export async function sendContactFormNotification(formData: {
  name: string;
  email: string;
  company?: string;
  service: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const { name, email, company, service, message } = formData;
  
  const html = `
    <h1>New Contact Form Submission</h1>
    <p><strong>From:</strong> ${name} (${email})</p>
    ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
    <p><strong>Service Interest:</strong> ${service}</p>
    <p><strong>Message:</strong></p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
      ${message.replace(/\n/g, '<br />')}
    </div>
    <hr />
    <p>This is an automated notification from the UNITE Group website.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Contact Form: ${name} - ${service}`,
    html,
    replyTo: email,
  });
}

/**
 * Send a confirmation email to the user who submitted the contact form
 */
export async function sendContactFormConfirmation(formData: {
  name: string;
  email: string;
  service: string;
}): Promise<{ success: boolean; message: string }> {
  const { name, email, service } = formData;
  
  const html = `
    <h1>Thank You for Contacting UNITE Group</h1>
    <p>Dear ${name},</p>
    <p>Thank you for reaching out to us regarding <strong>${service}</strong>. We've received your message and will get back to you within 24 hours.</p>
    <p>If you need immediate assistance, please call us at <strong>0457 123 005</strong>.</p>
    <br />
    <p>Best regards,</p>
    <p><strong>UNITE Group Team</strong></p>
    <hr />
    <p style="font-size: 12px; color: #666;">This is an automated confirmation. Please do not reply to this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'We\'ve Received Your Message - UNITE Group',
    html,
  });
}

/**
 * Send a consultation booking confirmation to the admin
 */
export async function sendConsultationBookingNotification(bookingData: {
  client_name: string;
  client_email: string;
  company?: string;
  phone?: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  alternate_date?: string;
  message?: string;
}): Promise<{ success: boolean; message: string }> {
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
  } = bookingData;
  
  // Format dates for display
  const formattedPreferredDate = new Date(preferred_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let formattedAlternateDate = '';
  if (alternate_date) {
    formattedAlternateDate = new Date(alternate_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  const html = `
    <h1>New Consultation Booking</h1>
    <p><strong>Client:</strong> ${client_name} (${client_email})</p>
    ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    <p><strong>Service Type:</strong> ${service_type}</p>
    <p><strong>Preferred Date:</strong> ${formattedPreferredDate} at ${preferred_time}</p>
    ${formattedAlternateDate ? `<p><strong>Alternate Date:</strong> ${formattedAlternateDate}</p>` : ''}
    
    ${message ? `
    <p><strong>Additional Information:</strong></p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
      ${message.replace(/\n/g, '<br />')}
    </div>
    ` : ''}
    
    <hr />
    <p>Please confirm this booking with the client as soon as possible.</p>
    <p>This is an automated notification from the UNITE Group website.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Consultation Booking: ${client_name} - ${service_type}`,
    html,
    replyTo: client_email,
  });
}

/**
 * Send a consultation booking confirmation to the client
 */
export async function sendConsultationBookingConfirmation(bookingData: {
  client_name: string;
  client_email: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
}): Promise<{ success: boolean; message: string }> {
  const { client_name, client_email, service_type, preferred_date, preferred_time } = bookingData;
  
  // Format date for display
  const formattedPreferredDate = new Date(preferred_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `
    <h1>Your Consultation Booking Confirmation</h1>
    <p>Dear ${client_name},</p>
    <p>Thank you for booking a consultation with UNITE Group. We've received your booking request for a <strong>${service_type}</strong> on <strong>${formattedPreferredDate}</strong> at <strong>${preferred_time}</strong>.</p>
    <p>Our team will review your preferred time and confirm your appointment within 24 hours. If your preferred time is unavailable, we'll contact you to arrange an alternative.</p>
    <p>If you need to make any changes to your booking, please contact us at <strong>support@unite-group.com</strong> or call us at <strong>0457 123 005</strong>.</p>
    <br />
    <p>We look forward to speaking with you!</p>
    <p>Best regards,</p>
    <p><strong>UNITE Group Team</strong></p>
    <hr />
    <p style="font-size: 12px; color: #666;">This is an automated confirmation. Please do not reply to this email.</p>
  `;

  return sendEmail({
    to: client_email,
    subject: 'Your Consultation Booking Confirmation - UNITE Group',
    html,
  });
}
