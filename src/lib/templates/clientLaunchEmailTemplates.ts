/**
 * Client Launch Email Templates
 * Phase 47: Email sequences for client lifecycle events
 */

export interface EmailTemplateData {
  businessName: string;
  clientName?: string;
  dashboardUrl: string;
  tasksCompleted?: number;
  totalTasks?: number;
}

export const EMAIL_TEMPLATES = {
  welcome: (data: EmailTemplateData) => ({
    subject: `Welcome to Unite-Hub, ${data.businessName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Unite-Hub!</h1>
    </div>

    <p>Hi ${data.clientName || 'there'},</p>

    <p>We're excited to have <strong>${data.businessName}</strong> on board!</p>

    <p>Your personalized welcome pack is ready. It includes:</p>
    <ul>
      <li>Your first 24-hours roadmap</li>
      <li>Visual inspiration tailored to your industry</li>
      <li>Brand positioning starter report</li>
      <li>7 quick-start tasks to get you going</li>
    </ul>

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}/welcome-pack" class="button">View Your Welcome Pack</a>
    </p>

    <p>Most clients complete their setup in under 30 minutes and see their first AI-generated content within 24 hours.</p>

    <p>Have questions? Reply to this email or use the AI assistant in your dashboard.</p>

    <p>Here's to your success!<br>The Unite-Hub Team</p>

    <div class="footer">
      <p>Unite-Hub | AI-Powered Marketing Automation</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Welcome to Unite-Hub!

Hi ${data.clientName || 'there'},

We're excited to have ${data.businessName} on board!

Your personalized welcome pack is ready. It includes:
- Your first 24-hours roadmap
- Visual inspiration tailored to your industry
- Brand positioning starter report
- 7 quick-start tasks to get you going

View your welcome pack: ${data.dashboardUrl}/welcome-pack

Most clients complete their setup in under 30 minutes and see their first AI-generated content within 24 hours.

Have questions? Reply to this email or use the AI assistant in your dashboard.

Here's to your success!
The Unite-Hub Team
    `,
  }),

  day1: (data: EmailTemplateData) => ({
    subject: `How's your first day going, ${data.businessName}?`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .progress { background: #e5e7eb; border-radius: 999px; height: 20px; overflow: hidden; margin: 20px 0; }
    .progress-bar { background: #2563eb; height: 100%; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Day 1 Check-In</h1>

    <p>Hi there,</p>

    <p>It's been 24 hours since you joined Unite-Hub. Here's your progress:</p>

    <div class="progress">
      <div class="progress-bar" style="width: ${data.tasksCompleted && data.totalTasks ? Math.round((data.tasksCompleted / data.totalTasks) * 100) : 0}%"></div>
    </div>
    <p><strong>${data.tasksCompleted || 0} of ${data.totalTasks || 7} tasks completed</strong></p>

    ${(data.tasksCompleted || 0) < 3 ? `
    <p>You're off to a great start! Complete a few more tasks to unlock your full dashboard experience.</p>
    ` : `
    <p>Great progress! You're well on your way to seeing real results.</p>
    `}

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}" class="button">Continue Setup</a>
    </p>

    <p>Tip: Use voice commands to speed things up. Say "What should I do next?" to your AI assistant.</p>

    <p>Best,<br>The Unite-Hub Team</p>

    <div class="footer">
      <p>Unite-Hub | AI-Powered Marketing Automation</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Day 1 Check-In

Hi there,

It's been 24 hours since you joined Unite-Hub. Here's your progress:

${data.tasksCompleted || 0} of ${data.totalTasks || 7} tasks completed

${(data.tasksCompleted || 0) < 3 ?
  "You're off to a great start! Complete a few more tasks to unlock your full dashboard experience." :
  "Great progress! You're well on your way to seeing real results."}

Continue setup: ${data.dashboardUrl}

Tip: Use voice commands to speed things up. Say "What should I do next?" to your AI assistant.

Best,
The Unite-Hub Team
    `,
  }),

  day7: (data: EmailTemplateData) => ({
    subject: `Your first week with Unite-Hub`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>One Week In!</h1>

    <p>Hi there,</p>

    <p>Congratulations on your first week with Unite-Hub! Here's what you've accomplished:</p>

    <ul>
      <li>✅ Completed ${data.tasksCompleted || 0} onboarding tasks</li>
      <li>📊 Initial SEO analysis available</li>
      <li>🎨 Visual inspiration pack reviewed</li>
    </ul>

    <h3>What's Next?</h3>
    <p>Now that your foundation is set, it's time to:</p>
    <ol>
      <li>Review AI-generated content suggestions</li>
      <li>Plan your first campaign</li>
      <li>Set up automated workflows</li>
    </ol>

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
    </p>

    <p>Questions? Your AI assistant is always ready to help.</p>

    <p>Cheers,<br>The Unite-Hub Team</p>

    <div class="footer">
      <p>Unite-Hub | AI-Powered Marketing Automation</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
One Week In!

Hi there,

Congratulations on your first week with Unite-Hub! Here's what you've accomplished:

- Completed ${data.tasksCompleted || 0} onboarding tasks
- Initial SEO analysis available
- Visual inspiration pack reviewed

What's Next?
1. Review AI-generated content suggestions
2. Plan your first campaign
3. Set up automated workflows

Go to Dashboard: ${data.dashboardUrl}

Questions? Your AI assistant is always ready to help.

Cheers,
The Unite-Hub Team
    `,
  }),
};

export function getEmailTemplate(
  templateKey: keyof typeof EMAIL_TEMPLATES,
  data: EmailTemplateData
) {
  const templateFn = EMAIL_TEMPLATES[templateKey];
  if (!templateFn) {
    throw new Error(\`Email template '\${templateKey}' not found\`);
  }
  return templateFn(data);
}
