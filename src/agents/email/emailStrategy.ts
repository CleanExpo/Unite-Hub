/**
 * Email Strategy
 *
 * Strategy layer for building email content dynamically.
 * Composes emails from templates and personalization data.
 *
 * Used by: Email agent, automation workflows, campaigns
 */

import { getEmailTemplate, type EmailTemplate } from './emailTemplates';
import type { BrandId } from '@/lib/brands/brandRegistry';

export interface PersonalizationData {
  name: string;
  company?: string;
  role?: string;
  previousInteraction?: {
    date: string;
    topic: string;
  };
}

/**
 * Email Strategy Class
 * Dynamically builds email content with personalization and context
 */
export class EmailStrategy {
  /**
   * Build a follow-up email
   */
  buildFollowUp(brand: BrandId, personalization: PersonalizationData): EmailTemplate | null {
    return getEmailTemplate(brand, 'followUp', personalization.name);
  }

  /**
   * Build an introduction email
   */
  buildIntroduction(brand: BrandId, personalization: PersonalizationData): EmailTemplate | null {
    return getEmailTemplate(brand, 'introduction', personalization.name);
  }

  /**
   * Build a re-engagement email
   */
  buildReengagement(brand: BrandId, personalization: PersonalizationData): EmailTemplate | null {
    return getEmailTemplate(brand, 'reengagement', personalization.name);
  }

  /**
   * Build an educational email
   */
  buildEducational(brand: BrandId, personalization: PersonalizationData): EmailTemplate | null {
    return getEmailTemplate(brand, 'educational', personalization.name);
  }

  /**
   * Personalize email body with additional context
   */
  personalize(email: EmailTemplate, data: PersonalizationData): string {
    let body = email.body;

    if (data.company) {
      body = body.replace('[COMPANY]', data.company);
    }

    if (data.role) {
      body = body.replace('[ROLE]', data.role);
    }

    if (data.previousInteraction) {
      body = body.replace(
        '[LAST_INTERACTION]',
        `your message on ${data.previousInteraction.date}`
      );
    }

    return body;
  }

  /**
   * Get email with full personalization
   */
  getPersonalizedEmail(
    brand: BrandId,
    context: 'followup' | 'intro' | 'reengagement' | 'educational',
    personalization: PersonalizationData
  ): EmailTemplate | null {
    let template: EmailTemplate | null = null;

    switch (context) {
      case 'followup':
        template = this.buildFollowUp(brand, personalization);
        break;
      case 'intro':
        template = this.buildIntroduction(brand, personalization);
        break;
      case 'reengagement':
        template = this.buildReengagement(brand, personalization);
        break;
      case 'educational':
        template = this.buildEducational(brand, personalization);
        break;
    }

    if (!template) {
return null;
}

    return {
      ...template,
      body: this.personalize(template, personalization),
    };
  }

  /**
   * Build a custom email from scratch
   * (for dynamic generation beyond templates)
   */
  buildCustom(
    brand: BrandId,
    subject: string,
    body: string,
    personalization: PersonalizationData
  ): EmailTemplate {
    return {
      subject: subject.replace('[NAME]', personalization.name),
      body: this.personalize({ subject, body, context: 'custom', brand }, personalization),
      context: 'custom',
      brand,
    };
  }
}

/**
 * Singleton instance
 */
export const emailStrategy = new EmailStrategy();
