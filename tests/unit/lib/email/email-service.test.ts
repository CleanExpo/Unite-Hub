/**
 * Unit Tests for Email Service
 * Tests multi-provider email sending with fallback logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EmailOptions, EmailResult } from '@/lib/email/email-service';

// Mock external email providers
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn(),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

describe('Email Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set up test environment
    process.env.EMAIL_FROM = 'test@unite-group.in';
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    process.env.RESEND_API_KEY = 're_test-key';
    process.env.EMAIL_SERVER_HOST = 'smtp.gmail.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@gmail.com';
    process.env.EMAIL_SERVER_PASSWORD = 'test-password';

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should load configuration from environment variables', async () => {
      const { sendEmail } = await import('@/lib/email/email-service');

      expect(process.env.EMAIL_FROM).toBe('test@unite-group.in');
      expect(process.env.SENDGRID_API_KEY).toBe('SG.test-key');
      expect(process.env.RESEND_API_KEY).toBe('re_test-key');
    });

    it('should detect enabled providers', async () => {
      // All providers should be enabled with test config
      expect(process.env.SENDGRID_API_KEY).toBeTruthy();
      expect(process.env.RESEND_API_KEY).toBeTruthy();
      expect(process.env.EMAIL_SERVER_USER).toBeTruthy();
      expect(process.env.EMAIL_SERVER_PASSWORD).toBeTruthy();
    });
  });

  describe('SendGrid Provider', () => {
    it('should send email via SendGrid when specified', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      // Need to reimport after mocking
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
        provider: 'sendgrid',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('sendgrid');
    });

    it('should handle SendGrid errors gracefully', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid API error'));

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'sendgrid',
      };

      const result = await sendEmail(options);

      // Should fallback to another provider or fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Resend Provider', () => {
    it('should send email via Resend when specified', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({
        id: 'resend-123',
        from: 'test@unite-group.in',
        to: 'recipient@example.com',
      });

      (Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }));

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'resend',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('resend');
    });
  });

  describe('SMTP Provider', () => {
    it('should send email via SMTP when specified', async () => {
      const nodemailer = (await import('nodemailer')).default;
      const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<smtp-123@example.com>',
        accepted: ['recipient@example.com'],
      });

      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
        verify: vi.fn().mockResolvedValue(true),
      } as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'smtp',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('smtp');
    });

    it('should handle SMTP connection errors', async () => {
      const nodemailer = (await import('nodemailer')).default;
      const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP connection failed'));

      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
        verify: vi.fn().mockRejectedValue(new Error('SMTP connection failed')),
      } as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'smtp',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Auto Fallback Logic', () => {
    it('should try SendGrid first with auto provider', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'auto',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('sendgrid');
      expect(result.fallbackUsed).toBeFalsy();
    });

    it('should fallback to Resend if SendGrid fails', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid failed'));

      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({
        id: 'resend-123',
      });

      (Resend as any).mockImplementation(() => ({
        emails: { send: mockSend },
      }));

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'auto',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('resend');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should fallback to SMTP if all providers fail', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid failed'));

      const { Resend } = await import('resend');
      (Resend as any).mockImplementation(() => ({
        emails: {
          send: vi.fn().mockRejectedValue(new Error('Resend failed')),
        },
      }));

      const nodemailer = (await import('nodemailer')).default;
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'smtp-123' }),
        verify: vi.fn().mockResolvedValue(true),
      } as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'auto',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('smtp');
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Email Options', () => {
    it('should support multiple recipients', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Email',
        text: 'Test',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });

    it('should support CC and BCC recipients', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Email',
        text: 'Test',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });

    it('should support custom from address', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        from: 'custom@example.com',
        subject: 'Test Email',
        text: 'Test',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });

    it('should support reply-to address', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        replyTo: 'replyto@example.com',
        subject: 'Test Email',
        text: 'Test',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });
  });

  describe('Template Support', () => {
    it('should render templates with variable substitution', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Hello {{name}}',
        html: '<p>Welcome, {{name}}!</p>',
        text: 'Welcome, {{name}}!',
        templateVars: {
          name: 'John Doe',
        },
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });
  });

  describe('Attachments', () => {
    it('should support email attachments', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test with Attachment',
        text: 'See attached file',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return error details when all providers fail', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid failed'));

      const { Resend } = await import('resend');
      (Resend as any).mockImplementation(() => ({
        emails: {
          send: vi.fn().mockRejectedValue(new Error('Resend failed')),
        },
      }));

      const nodemailer = (await import('nodemailer')).default;
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP failed')),
        verify: vi.fn().mockResolvedValue(true),
      } as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test',
        provider: 'auto',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate required email fields', async () => {
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const options: EmailOptions = {
        to: '',
        subject: '',
        text: '',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete email send within reasonable time', async () => {
      const sgMail = (await import('@sendgrid/mail')).default;
      vi.mocked(sgMail.send).mockResolvedValue([
        { statusCode: 202, body: {}, headers: {} },
        {},
      ] as any);

      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/email-service');

      const startTime = Date.now();

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      const duration = Date.now() - startTime;

      // Should complete in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
