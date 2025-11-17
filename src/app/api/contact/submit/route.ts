import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting store (in-memory for MVP, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting: 5 submissions per 15 minutes per IP
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { firstName, lastName, email, company, subject, message } = body;

    // Validation
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, subject, message' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured. Email not sent.');
      return NextResponse.json(
        {
          success: true,
          message: 'Form submitted successfully (email service not configured)'
        },
        { status: 200 }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Unite-Hub Contact Form <noreply@unite-hub.com>',
      to: [process.env.CONTACT_EMAIL || 'hello@unite-hub.com'],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${firstName} ${lastName}</div>
              </div>

              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>

              ${company ? `
              <div class="field">
                <div class="label">Company:</div>
                <div class="value">${company}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>

              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>

            <div class="footer">
              <p>This message was sent via the Unite-Hub contact form.</p>
              <p>You can reply directly to this email to reach ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${firstName} ${lastName}
Email: ${email}
${company ? `Company: ${company}\n` : ''}Subject: ${subject}

Message:
${message}

---
This message was sent via the Unite-Hub contact form.
You can reply directly to this email to reach ${email}
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('Contact form submission successful:', { id: data?.id, email });

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully! We\'ll get back to you soon.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
