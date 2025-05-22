import { formatDate } from "@/lib/utils"

interface AssignmentNotificationEmailProps {
  errorId: number
  errorMessage: string
  errorSeverity: string
  errorCategory: string
  assignedBy: {
    name: string
    email: string
  }
  assignedTo: {
    name: string
    email: string
  }
  notes?: string
  timestamp: string
  appUrl: string
}

export function generateAssignmentNotificationEmail({
  errorId,
  errorMessage,
  errorSeverity,
  errorCategory,
  assignedBy,
  assignedTo,
  notes,
  timestamp,
  appUrl,
}: AssignmentNotificationEmailProps) {
  const errorDetailsUrl = `${appUrl}/admin/errors?errorId=${errorId}`
  const assignmentsUrl = `${appUrl}/admin/errors/assignments`
  const formattedDate = formatDate(new Date(timestamp))

  // Generate HTML email
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error Assignment Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e1e1e1;
            border-radius: 5px;
            overflow: hidden;
          }
          .header {
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .error-details {
            background-color: #f9f9f9;
            border: 1px solid #e1e1e1;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
          }
          .label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .value {
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .severity-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
          }
          .severity-critical {
            background-color: #dc2626;
          }
          .severity-error {
            background-color: #f97316;
          }
          .severity-warning {
            background-color: #f59e0b;
          }
          .severity-info {
            background-color: #3b82f6;
          }
          .severity-debug {
            background-color: #6b7280;
          }
          .notes {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 10px 15px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Error Assignment</h1>
          </div>
          <div class="content">
            <p>Hello ${assignedTo.name},</p>
            
            <p>An error has been assigned to you by ${assignedBy.name} (${assignedBy.email}).</p>
            
            <div class="error-details">
              <div class="label">Error Message:</div>
              <div class="value">${errorMessage}</div>
              
              <div class="label">Severity:</div>
              <div class="value">
                <span class="severity-badge severity-${errorSeverity.toLowerCase()}">${errorSeverity}</span>
              </div>
              
              <div class="label">Category:</div>
              <div class="value">${errorCategory}</div>
              
              <div class="label">Assigned At:</div>
              <div class="value">${formattedDate}</div>
            </div>
            
            ${
              notes
                ? `
            <div class="label">Assignment Notes:</div>
            <div class="notes">${notes}</div>
            `
                : ""
            }
            
            <p>Please review and address this error at your earliest convenience.</p>
            
            <div style="margin-top: 20px;">
              <a href="${errorDetailsUrl}" class="button">View Error Details</a>
              <a href="${assignmentsUrl}" class="button" style="margin-left: 10px;">View All Assignments</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the Unite Group Error Management System.</p>
            <p>© ${new Date().getFullYear()} Unite Group. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  // Generate plain text version
  const text = `
ERROR ASSIGNMENT NOTIFICATION

Hello ${assignedTo.name},

An error has been assigned to you by ${assignedBy.name} (${assignedBy.email}).

ERROR DETAILS:
- Message: ${errorMessage}
- Severity: ${errorSeverity}
- Category: ${errorCategory}
- Assigned At: ${formattedDate}

${notes ? `ASSIGNMENT NOTES:\n${notes}\n` : ""}

Please review and address this error at your earliest convenience.

View Error Details: ${errorDetailsUrl}
View All Assignments: ${assignmentsUrl}

This is an automated message from the Unite Group Error Management System.
© ${new Date().getFullYear()} Unite Group. All rights reserved.
  `

  return { html, text }
}
