import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/email-service';

/**
 * Subject Access Request (SAR) API
 *
 * Handles privacy requests under Australian Privacy Principles (APP 12 & 13)
 * - POST: Submit new SAR (access, correction, deletion, export)
 * - GET: Check SAR status by request ID
 */

// SAR types matching Australian Privacy Principles
export type SARRequestType =
  | 'access'      // APP 12 - Access to personal information
  | 'correction'  // APP 13 - Correction of personal information
  | 'deletion'    // Right to erasure (subject to legal retention)
  | 'export'      // Data portability
  | 'restriction' // Temporary restriction of processing
  | 'objection';  // Object to certain processing

export type SARStatus =
  | 'pending'     // Awaiting review
  | 'processing'  // In progress
  | 'completed'   // Fulfilled
  | 'rejected';   // Cannot fulfill (with reason)

interface SARRequest {
  email: string;
  requestType: SARRequestType;
  details?: string;
  verificationCode?: string;
}

interface SARStatusResponse {
  id: string;
  email: string;
  requestType: SARRequestType;
  status: SARStatus;
  createdAt: string;
  completedAt?: string;
  rejectionReason?: string;
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SAR confirmation email
 */
async function sendSARConfirmationEmail(
  email: string,
  requestType: SARRequestType,
  requestId: string,
  verificationCode: string
): Promise<void> {
  const requestTypeLabels: Record<SARRequestType, string> = {
    access: 'Access to Personal Information',
    correction: 'Correction of Personal Information',
    deletion: 'Deletion of Personal Information',
    export: 'Data Export',
    restriction: 'Restriction of Processing',
    objection: 'Objection to Processing',
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Subject Access Request Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h1 style="color: #0066cc; margin-top: 0;">Subject Access Request Received</h1>

        <p>Dear Requester,</p>

        <p>We have received your Subject Access Request under the Australian Privacy Principles. Here are the details:</p>

        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Request Type:</strong> ${requestTypeLabels[requestType]}</p>
          <p style="margin: 5px 0;"><strong>Request ID:</strong> ${requestId}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Verification Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #0066cc;">${verificationCode}</span></p>
        </div>

        <h2 style="color: #333; font-size: 18px;">What Happens Next?</h2>

        <ol style="padding-left: 20px;">
          <li><strong>Verification:</strong> We will verify your identity using the code above</li>
          <li><strong>Processing:</strong> Our Privacy Team will process your request within 30 days</li>
          <li><strong>Completion:</strong> You will receive an email when your request is fulfilled</li>
        </ol>

        <h2 style="color: #333; font-size: 18px;">Request Processing Timeline</h2>

        <ul style="padding-left: 20px;">
          <li><strong>Standard Requests:</strong> 30 days from verification</li>
          <li><strong>Complex Requests:</strong> Up to 60 days (we will notify you)</li>
          <li><strong>Urgent Requests:</strong> Contact privacy@unite-hub.com.au</li>
        </ul>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> If you did not submit this request, please contact us immediately at <a href="mailto:privacy@unite-hub.com.au" style="color: #0066cc;">privacy@unite-hub.com.au</a></p>
        </div>

        <h2 style="color: #333; font-size: 18px;">Check Request Status</h2>

        <p>You can check the status of your request at any time:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com.au'}/subject-access-request?id=${requestId}"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Check Status
          </a>
        </p>

        <h2 style="color: #333; font-size: 18px;">Contact Information</h2>

        <p>If you have questions about your request:</p>
        <ul style="padding-left: 20px;">
          <li><strong>Email:</strong> <a href="mailto:privacy@unite-hub.com.au" style="color: #0066cc;">privacy@unite-hub.com.au</a></li>
          <li><strong>Contact:</strong> contact@unite-group.in</li>
          <li><strong>Mail:</strong> Unite-Hub Privacy Team, Level 1, 123 Business Street, Brisbane QLD 4000</li>
        </ul>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>This is an automated confirmation email from Unite-Hub Pty Ltd.</p>
          <p>We are committed to protecting your privacy in accordance with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth).</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Subject Access Request Received

Dear Requester,

We have received your Subject Access Request under the Australian Privacy Principles.

Request Details:
- Request Type: ${requestTypeLabels[requestType]}
- Request ID: ${requestId}
- Email: ${email}
- Verification Code: ${verificationCode}

What Happens Next?
1. Verification: We will verify your identity using the code above
2. Processing: Our Privacy Team will process your request within 30 days
3. Completion: You will receive an email when your request is fulfilled

Request Processing Timeline:
- Standard Requests: 30 days from verification
- Complex Requests: Up to 60 days (we will notify you)
- Urgent Requests: Contact privacy@unite-hub.com.au

IMPORTANT: If you did not submit this request, please contact us immediately at privacy@unite-hub.com.au

Check Request Status:
${process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com.au'}/subject-access-request?id=${requestId}

Contact Information:
- Email: privacy@unite-hub.com.au
- Contact: contact@unite-group.in
- Mail: Unite-Hub Privacy Team, Level 1, 123 Business Street, Brisbane QLD 4000

This is an automated confirmation email from Unite-Hub Pty Ltd.
We are committed to protecting your privacy in accordance with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth).
  `;

  await sendEmail({
    to: email,
    subject: `Subject Access Request Confirmation - ${requestId}`,
    html: htmlContent,
    text: textContent,
    from: 'privacy@unite-hub.com.au',
  });
}

/**
 * POST /api/privacy/subject-access-request
 * Submit a new Subject Access Request
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SARRequest;
    const { email, requestType, details } = body;

    // Validate required fields
    if (!email || !requestType) {
      return NextResponse.json(
        { error: 'Email and request type are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes: SARRequestType[] = ['access', 'correction', 'deletion', 'export', 'restriction', 'objection'];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create SAR record in database
    // Note: We'll need to create a 'subject_access_requests' table
    // For now, we'll use audit_logs to track the request
    const requestId = crypto.randomUUID();

    // Find the user's organization (if they're a registered user)
    let orgId = null;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('email', email)
      .single();

    if (userProfile) {
      orgId = userProfile.org_id;
    }

    // If no org found, use a default system org or create a tracking entry
    // For audit purposes, we need an org_id, so we'll use the first available org
    // or create a special "SAR Requests" org
    if (!orgId) {
      const { data: systemOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'SAR Requests (System)')
        .single();

      if (systemOrg) {
        orgId = systemOrg.id;
      } else {
        // Create system org for tracking SARs from non-users
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'SAR Requests (System)',
            email: 'privacy@unite-hub.com.au',
            plan: 'enterprise',
            status: 'active',
          })
          .select('id')
          .single();

        if (orgError) {
          console.error('Failed to create system org:', orgError);
          return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
          );
        }

        orgId = newOrg.id;
      }
    }

    // Log the SAR in audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        org_id: orgId,
        action: 'subject_access_request_submitted',
        resource: 'privacy',
        resource_id: requestId,
        agent: 'SAR_API',
        status: 'success',
        details: {
          email,
          requestType,
          requestDetails: details || null,
          verificationCode, // Store for verification
          sarStatus: 'pending',
          submittedAt: new Date().toISOString(),
          expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      });

    if (auditError) {
      console.error('Failed to log SAR:', auditError);
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await sendSARConfirmationEmail(email, requestType, requestId, verificationCode);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails - the SAR is still logged
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Your Subject Access Request has been submitted. Please check your email for confirmation.',
      expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('SAR submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/privacy/subject-access-request?id=<requestId>
 * Check the status of a Subject Access Request
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the SAR from audit_logs
    const { data: sarLog, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', requestId)
      .eq('action', 'subject_access_request_submitted')
      .single();

    if (error || !sarLog) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check for any status updates
    const { data: statusUpdates } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', requestId)
      .in('action', [
        'subject_access_request_processing',
        'subject_access_request_completed',
        'subject_access_request_rejected'
      ])
      .order('created_at', { ascending: false })
      .limit(1);

    const latestUpdate = statusUpdates && statusUpdates.length > 0 ? statusUpdates[0] : null;

    let status: SARStatus = 'pending';
    let completedAt: string | undefined;
    let rejectionReason: string | undefined;

    if (latestUpdate) {
      if (latestUpdate.action === 'subject_access_request_completed') {
        status = 'completed';
        completedAt = latestUpdate.created_at;
      } else if (latestUpdate.action === 'subject_access_request_rejected') {
        status = 'rejected';
        rejectionReason = latestUpdate.details?.reason || 'Request could not be fulfilled';
      } else if (latestUpdate.action === 'subject_access_request_processing') {
        status = 'processing';
      }
    }

    const response: SARStatusResponse = {
      id: requestId,
      email: sarLog.details?.email || '',
      requestType: sarLog.details?.requestType || 'access',
      status,
      createdAt: sarLog.created_at,
      completedAt,
      rejectionReason,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('SAR status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
