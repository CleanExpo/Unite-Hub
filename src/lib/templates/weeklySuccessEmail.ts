/**
 * Weekly Success Email Template
 * Phase 48: Email template for weekly insights
 */

export interface WeeklyEmailData {
  clientName: string;
  businessName?: string;
  overallScore: number;
  scoreChange: number;
  trend: 'rising' | 'stable' | 'declining';
  activeDays: number;
  tasksCompleted: number;
  contentGenerated: number;
  insights: Array<{
    type: string;
    title: string;
    message: string;
  }>;
  dashboardUrl: string;
}

export function generateWeeklySuccessEmail(data: WeeklyEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const trendEmoji = data.trend === 'rising' ? '📈' : data.trend === 'declining' ? '📉' : '➡️';
  const scoreEmoji = data.overallScore >= 80 ? '🌟' : data.overallScore >= 60 ? '👍' : '💪';

  const subject = `Your Week in Review: Score ${data.overallScore}/100 ${trendEmoji}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Success Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Weekly Success Report</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${data.businessName || data.clientName}
              </p>
            </td>
          </tr>

          <!-- Score Section -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 5px;">${scoreEmoji}</div>
              <div style="font-size: 56px; font-weight: bold; color: ${
                data.overallScore >= 80 ? '#10b981' : data.overallScore >= 60 ? '#3b82f6' : '#f59e0b'
              };">
                ${data.overallScore}
              </div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">Success Score</div>
              <div style="font-size: 16px; color: ${
                data.scoreChange > 0 ? '#10b981' : data.scoreChange < 0 ? '#ef4444' : '#6b7280'
              };">
                ${data.scoreChange > 0 ? '+' : ''}${data.scoreChange} from last week ${trendEmoji}
              </div>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align: center; padding: 15px; background-color: #f9fafb; border-radius: 8px 0 0 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${data.activeDays}</div>
                    <div style="font-size: 12px; color: #6b7280;">Active Days</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 15px; background-color: #f9fafb;">
                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${data.tasksCompleted}</div>
                    <div style="font-size: 12px; color: #6b7280;">Tasks Done</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 15px; background-color: #f9fafb; border-radius: 0 8px 8px 0;">
                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${data.contentGenerated}</div>
                    <div style="font-size: 12px; color: #6b7280;">Content Created</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.insights.length > 0 ? `
          <!-- Insights -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #1f2937;">This Week's Insights</h2>
              ${data.insights.map(insight => `
                <div style="padding: 12px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px; margin-bottom: 10px;">
                  <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">
                    ${insight.title}
                  </div>
                  <div style="font-size: 13px; color: #4b5563;">
                    ${insight.message}
                  </div>
                </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Full Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
                You're receiving this because you opted in to weekly insights.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Unite-Hub • Your Marketing Success Partner
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Weekly Success Report - ${data.businessName || data.clientName}

SUCCESS SCORE: ${data.overallScore}/100
Change: ${data.scoreChange > 0 ? '+' : ''}${data.scoreChange} from last week (${data.trend})

THIS WEEK'S STATS:
- Active Days: ${data.activeDays}
- Tasks Completed: ${data.tasksCompleted}
- Content Created: ${data.contentGenerated}

${data.insights.length > 0 ? `
INSIGHTS:
${data.insights.map(i => `• ${i.title}: ${i.message}`).join('\n')}
` : ''}

View your full dashboard: ${data.dashboardUrl}

---
You're receiving this because you opted in to weekly insights.
Unite-Hub • Your Marketing Success Partner
  `.trim();

  return { subject, html, text };
}

export default generateWeeklySuccessEmail;
