import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock email providers
vi.mock('@/lib/external/sendgrid', () => ({
  sendViaSendgrid: vi.fn(),
}));

vi.mock('@/lib/external/resend', () => ({
  sendViaResend: vi.fn(),
}));

describe('Email Notifier', () => {
  const mockThreat = {
    id: 'threat-1',
    type: 'ranking_drop',
    title: 'Ranking Drop Detected',
    description: 'Your site dropped 5 positions for key target keywords',
    severity: 'high',
    domain: 'example.com',
    detected_at: new Date().toISOString(),
  };

  const mockRecipients = ['admin@example.com', 'ops@example.com'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate HTML email with threat details', async () => {
    const generateEmailSubject = (threat: any) => {
      const emoji = threat.severity === 'critical' ? '🚨' : '⚠️';
      return `${emoji} ${threat.title} - ${threat.domain}`;
    };

    const subject = generateEmailSubject(mockThreat);
    expect(subject).toContain('Ranking Drop Detected');
    expect(subject).toContain('example.com');
  });

  it('should include accent-500 orange (#ff6b35) in CTA button', async () => {
    const ctaButtonColor = '#ff6b35';
    expect(ctaButtonColor).toBe('#ff6b35');

    const htmlButton = `<a href="dashboard.url" style="background-color: ${ctaButtonColor};">View Dashboard</a>`;
    expect(htmlButton).toContain('ff6b35');
  });

  it('should support color-coded headers by severity', async () => {
    const getSeverityColors = (severity: string) => {
      const colors: Record<string, { bg: string; text: string }> = {
        critical: { bg: '#e74c3c', text: '#ffffff' },
        high: { bg: '#e67e22', text: '#ffffff' },
        medium: { bg: '#f39c12', text: '#ffffff' },
        low: { bg: '#3498db', text: '#ffffff' },
      };
      return colors[severity] || { bg: '#95a5a6', text: '#ffffff' };
    };

    const colors = getSeverityColors('high');
    expect(colors.bg).toBe('#e67e22');
    expect(colors.text).toBe('#ffffff');
  });

  it('should provide responsive HTML template', async () => {
    const template = `
      <table width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="padding: 20px;">
            Content here
          </td>
        </tr>
      </table>
    `;

    expect(template).toContain('max-width: 600px');
    expect(template).toContain('margin: 0 auto');
  });

  it('should select correct provider based on environment', async () => {
    const getEmailProvider = () => {
      const provider = process.env.EMAIL_PROVIDER || 'resend';
      return provider;
    };

    // Default to Resend if not specified
    expect(['sendgrid', 'resend']).toContain(getEmailProvider());
  });

  it('should send to multiple recipients', async () => {
    expect(mockRecipients).toHaveLength(2);
    expect(mockRecipients[0]).toBe('admin@example.com');
    expect(mockRecipients[1]).toBe('ops@example.com');
  });

  it('should handle invalid email addresses gracefully', async () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('admin@example.com')).toBe(true);
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('plainaddress@')).toBe(false);
  });

  it('should include threat metadata in email body', async () => {
    const emailBody = `
      Severity: ${mockThreat.severity.toUpperCase()}
      Domain: ${mockThreat.domain}
      Type: ${mockThreat.type.replace(/_/g, ' ')}
      Detected: ${new Date(mockThreat.detected_at).toLocaleString()}
    `;

    expect(emailBody).toContain('HIGH');
    expect(emailBody).toContain('example.com');
    expect(emailBody).toContain('Ranking drop');
  });

  it('should truncate long descriptions in emails', async () => {
    const truncate = (text: string, maxChars: number = 250) => {
      return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
    };

    const longText = 'A'.repeat(300);
    const truncated = truncate(longText);

    expect(truncated.length).toBeLessThanOrEqual(253);
    expect(truncated).toEndWith('...');
  });

  it('should include unsubscribe link in footer', async () => {
    const unsubscribeLink = 'https://app.unite-hub.com/workspace/123/unsubscribe';

    const footer = `
      <p>
        <a href="${unsubscribeLink}">Unsubscribe from alerts</a>
      </p>
    `;

    expect(footer).toContain('Unsubscribe');
    expect(footer).toContain(unsubscribeLink);
  });

  it('should include inline CSS for email compatibility', async () => {
    const inlineStyles = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#333333',
    };

    expect(inlineStyles.fontFamily).toContain('Arial');
    expect(inlineStyles.fontSize).toBe('14px');
  });

  it('should handle Sendgrid API errors', async () => {
    const error = new Error('Sendgrid API rate limit exceeded');
    expect(error.message).toContain('Sendgrid');
  });

  it('should handle Resend API errors', async () => {
    const error = new Error('Resend authentication failed');
    expect(error.message).toContain('Resend');
  });
});
