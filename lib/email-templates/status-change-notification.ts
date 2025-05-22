import { formatDate } from "@/lib/utils"

interface StatusChangeNotificationEmailProps {
  errorId: number
  errorMessage: string
  errorSeverity: string
  errorCategory: string
  assignedTo: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
  previousStatus: string
  newStatus: string
  notes?: string
  timestamp: string
  appUrl: string
}

export function generateStatusChangeNotificationEmail({
  errorId,
  errorMessage,
  errorSeverity,
  errorCategory,
  assignedTo,
  updatedBy,
  previousStatus,
  newStatus,
  notes,
  timestamp,
  appUrl,
}: StatusChangeNotificationEmailProps) {
  const errorDetailsUrl = `${appUrl}/admin/errors?errorId=${errorId}`
  const assignmentsUrl = `${appUrl}/admin/errors/assignments`
  const formattedDate = formatDate(new Date(timestamp))

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formattedPreviousStatus = formatStatus(previousStatus)
  const formattedNewStatus = formatStatus(newStatus)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b" // amber
      case "in_progress":
        return "#3b82f6" // blue
      case "completed":
        return "#10b981" // green
      case "rejected":
        return "#ef4444" // red
      default:
        return "#6b7280" // gray
    }
  }

  // Generate HTML email
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error Assignment Status Update</title>
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
          .status-change {
            display: flex;
            align-items: center;
            margin: 20px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            color: white;
          }
          .arrow {
            margin: 0 15px;
            font-size: 20px;
            color: #6b7280;
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
            <h1>Assignment Status Update</h1>
          </div>
          <div class="content">
            <p>Hello ${assignedTo.name},</p>
            
            <p>The status of an error assigned to you has been updated${updatedBy ? ` by ${updatedBy.name}` : ""}.</p>
            
            <div class="status-change">
              <span class="status-badge" style="background-color: ${getStatusColor(previousStatus)}">
                ${formattedPreviousStatus}
              </span>
              <span class="arrow">→</span>
              <span class="status-badge" style="background-color: ${getStatusColor(newStatus)}">
                ${formattedNewStatus}
              </span>
            </div>
            
            <div class="error-details">
              <div class="label">Error Message:</div>
              <div class="value">${errorMessage}</div>
              
              <div class="label">Severity:</div>
              <div class="value">
                <span class="severity-badge severity-${errorSeverity.toLowerCase()}">${errorSeverity}</span>
              </div>
              
              <div class="label">Category:</div>
              <div class="value">${errorCategory}</div>
              
              <div class="label">Updated At:</div>
              <div class="value">${formattedDate}</div>
            </div>
            
            ${
              notes
                ? `
            <div class="label">Update Notes:</div>
            <div class="notes">${notes}</div>
            `
                : ""
            }
            
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
ERROR ASSIGNMENT STATUS UPDATE

Hello ${assignedTo.name},

The status of an error assigned to you has been updated${updatedBy ? ` by ${updatedBy.name}` : ""}.

STATUS CHANGE: ${formattedPreviousStatus} → ${formattedNewStatus}

ERROR DETAILS:
- Message: ${errorMessage}
- Severity: ${errorSeverity}
- Category: ${errorCategory}
- Updated At: ${formattedDate}

${notes ? `UPDATE NOTES:\n${notes}\n` : ""}

View Error Details: ${errorDetailsUrl}
View All Assignments: ${assignmentsUrl}

This is an automated message from the Unite Group Error Management System.
© ${new Date().getFullYear()} Unite Group. All rights reserved.
  `

  return { html, text }
}
