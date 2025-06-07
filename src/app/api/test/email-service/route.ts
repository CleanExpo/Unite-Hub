import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      adminEmail: process.env.ADMIN_EMAIL || 'not-set'
    },
    test: {
      success: false,
      messageId: '',
      error: ''
    }
  };

  try {
    // Check if Resend API key exists
    if (!process.env.RESEND_API_KEY) {
      results.test.error = 'RESEND_API_KEY is not configured';
      return NextResponse.json(results, { status: 500 });
    }

    if (!process.env.ADMIN_EMAIL) {
      results.test.error = 'ADMIN_EMAIL is not configured';
      return NextResponse.json(results, { status: 500 });
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'Unite Group <noreply@unitegroup.com>',
      to: process.env.ADMIN_EMAIL,
      subject: '🧪 Email Service Test - Unite Group',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Email Service Test Successful!</h1>
          <p style="color: #666; line-height: 1.6;">
            This is a test email to verify that the Resend email service is working correctly.
          </p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <h2 style="color: #333;">Test Details:</h2>
          <ul style="color: #666;">
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
            <li><strong>Admin Email:</strong> ${process.env.ADMIN_EMAIL}</li>
          </ul>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated test email from the Unite Group platform.
          </p>
        </div>
      `,
      text: `Email Service Test Successful!
      
This is a test email to verify that the Resend email service is working correctly.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}
- Admin Email: ${process.env.ADMIN_EMAIL}

This is an automated test email from the Unite Group platform.`
    });

    if (error) {
      results.test.error = error.message;
      return NextResponse.json(results, { status: 500 });
    }

    results.test.success = true;
    results.test.messageId = data?.id || 'unknown';

    return NextResponse.json({
      ...results,
      summary: {
        status: 'SUCCESS',
        message: `Test email sent successfully to ${process.env.ADMIN_EMAIL}`,
        recommendations: [
          '✅ Email service is working correctly',
          '✅ Resend API key is valid',
          '✅ Admin email is configured',
          '💡 Check your inbox for the test email'
        ]
      }
    });

  } catch (error: any) {
    results.test.error = error.message || 'Unknown error occurred';
    
    return NextResponse.json({
      ...results,
      summary: {
        status: 'FAILED',
        message: 'Email service test failed',
        recommendations: generateRecommendations(results, error)
      }
    }, { status: 500 });
  }
}

// GET endpoint to check configuration without sending email
export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    environment: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      adminEmail: process.env.ADMIN_EMAIL || 'not-configured'
    },
    ready: false
  };

  config.ready = config.environment.hasResendKey && config.environment.hasAdminEmail;

  return NextResponse.json({
    ...config,
    recommendations: config.ready 
      ? ['✅ Email service is configured and ready'] 
      : generateConfigRecommendations(config.environment)
  });
}

function generateRecommendations(results: any, error: any): string[] {
  const recommendations: string[] = [];

  if (!results.environment.hasResendKey) {
    recommendations.push('❌ Add RESEND_API_KEY to environment variables');
    recommendations.push('💡 Get your API key from https://resend.com/api-keys');
  }

  if (!results.environment.hasAdminEmail) {
    recommendations.push('❌ Add ADMIN_EMAIL to environment variables');
    recommendations.push('💡 This email will receive consultation notifications');
  }

  if (error?.message?.includes('domain')) {
    recommendations.push('❌ Verify your sending domain in Resend dashboard');
    recommendations.push('💡 Or use a verified domain like "onboarding@resend.dev" for testing');
  }

  if (error?.message?.includes('API key')) {
    recommendations.push('❌ Check that your Resend API key is valid');
    recommendations.push('💡 API keys start with "re_"');
  }

  return recommendations;
}

function generateConfigRecommendations(env: any): string[] {
  const recommendations: string[] = [];

  if (!env.hasResendKey) {
    recommendations.push('❌ RESEND_API_KEY is missing');
    recommendations.push('💡 Add it to your .env.local file');
  }

  if (!env.hasAdminEmail) {
    recommendations.push('❌ ADMIN_EMAIL is missing');
    recommendations.push('💡 Add it to your .env.local file');
  }

  return recommendations;
}
