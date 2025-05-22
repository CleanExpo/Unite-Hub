import { formatDate } from "@/lib/utils"

interface ErrorNotificationEmailProps {
  errorId: number
  message: string
  severity: string
  category: string
  timestamp: string
  stackTrace?: string
  context?: Record<string, any>
  url?: string
  appUrl: string
}

export function generateErrorNotificationEmail({
  errorId,
  message,
  severity,
  category,
  timestamp,
  stackTrace,
  context,
  url,
  appUrl,
}: ErrorNotificationEmailProps) {
  const errorDetailsUrl = `${appUrl}/admin/errors?errorId=${errorId}`
  const formattedDate = formatDate(new Date(timestamp))

  // Generate HTML email
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Critical Error Alert</title>
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
            background-color: #f44336;
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
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 10px;
            font-family: monospace;
            font-size: 13px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Critical Error Alert</h1>
          </div>
          <div class="content">
            <p>A critical error has been detected in the application:</p>
            
            <div class="error-details">
              <div class="label">Error Message:</div>
              <div class="value">${message}</div>
              
              <div class="label">Severity:</div>
              <div class="value">${severity}</div>
              
              <div class="label">Category:</div>
              <div class="value">${category}</div>
              
              <div class="label">Time:</div>
              <div class="value">${formattedDate}</div>
              
              ${
                url
                  ? `
              <div class="label">URL:</div>
              <div class="value">${url}</div>
              `
                  : ""
              }
              
              ${
                context
                  ? `
              <div class="label">Context:</div>
              <div class="value"><pre>${JSON.stringify(context, null, 2)}</pre></div>
              `
                  : ""
              }
              
              ${
                stackTrace
                  ? `
              <div class="label">Stack Trace:</div>
              <div class="value"><pre>${stackTrace}</pre></div>
              `
                  : ""
              }
            </div>
            
            <p>Please investigate this issue as soon as possible.</p>
            
            <a href="${errorDetailsUrl}" class="button">View Error Details</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Unite Group Error Monitoring System.</p>
            <p>© ${new Date().getFullYear()} Unite Group. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  // Generate plain text version
  const text = `
CRITICAL ERROR ALERT

A critical error has been detected in the application:

Error Message: ${message}
Severity: ${severity}
Category: ${category}
Time: ${formattedDate}
${url ? `URL: ${url}` : ""}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ""}

${stackTrace ? `Stack Trace: ${stackTrace}` : ""}

Please investigate this issue as soon as possible.

View Error Details: ${errorDetailsUrl}

This is an automated message from the Unite Group Error Monitoring System.
© ${new Date().getFullYear()} Unite Group. All rights reserved.
  `

  return { html, text }
}
