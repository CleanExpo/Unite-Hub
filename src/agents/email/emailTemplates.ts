/**
 * Email Templates
 *
 * Reusable email templates for common scenarios across all brands.
 * Each template is brand-safe and follows tone guidelines.
 *
 * Used by: Email agent, email strategy, campaign automation
 */

export interface EmailTemplate {
  subject: string;
  body: string;
  context: string;
  brand: string;
}

export const emailTemplates = {
  /**
   * Follow-up email template
   * Used when reaching out after initial contact
   */
  followUp: {
    disaster_recovery_au: (name: string): EmailTemplate => ({
      subject: 'Following Up – 24/7 Restoration Support Available',
      body: `Hi ${name},

I wanted to follow up on my previous message about our water, fire, and mould restoration services.

At Disaster Recovery Australia, we're available 24/7 to respond quickly when emergencies strike. Our certified team can have equipment on-site within hours.

If you'd like to discuss how we can help prepare your property or respond to damage, I'm here to help.

Best regards,
Disaster Recovery Australia Team
24/7 Emergency Response: 1300-RESTORE`,
      context: 'followup',
      brand: 'disaster_recovery_au',
    }),

    carsi: (name: string): EmailTemplate => ({
      subject: 'Professional Training That Prepares You for Real-World Work',
      body: `Hi ${name},

I wanted to follow up about CARSI's professional certification and training programs.

Our science-based curriculum combines classroom learning with practical field experience, so graduates are truly ready from day one.

If you're looking to advance your career in cleaning and restoration, I'd love to discuss how our programs can help.

Best regards,
CARSI Training Team`,
      context: 'followup',
      brand: 'carsi',
    }),

    synthex: (name: string): EmailTemplate => ({
      subject: 'Results-Driven Marketing Built on Data',
      body: `Hi ${name},

Following up on our conversation about your marketing goals.

At Synthex, we don't believe in flashy claims. We focus on measurable results: more leads, lower customer acquisition cost, better conversion rates.

Our team uses data-driven strategies and automation to deliver consistent results for service businesses.

Would love to explore what's possible for your business.

Best regards,
Synthex Team`,
      context: 'followup',
      brand: 'synthex',
    }),

    unite_hub: (name: string): EmailTemplate => ({
      subject: 'Streamline Your Operations – Let's Talk',
      body: `Hi ${name},

Following up on my previous email about Unite-Hub's operations platform.

We help trade businesses automate daily tasks, manage contacts, and coordinate teams from one place—saving hours per week.

I'd be happy to walk you through a quick demo of how other businesses are using Unite-Hub.

Best regards,
Unite-Hub Team`,
      context: 'followup',
      brand: 'unite_hub',
    }),
  },

  /**
   * Introduction email template
   * Used for cold outreach and initial contact
   */
  introduction: {
    disaster_recovery_au: (name: string): EmailTemplate => ({
      subject: '24/7 Water & Fire Restoration – Local to Brisbane & Gold Coast',
      body: `Hi ${name},

I'm reaching out because property managers and business owners in your area frequently need rapid restoration services when water, fire, or mould damage occurs.

Disaster Recovery Australia specializes in:
- Water damage restoration (24/7 response)
- Fire and smoke cleanup
- Mould remediation
- IICRC certified and insured

We respond within hours, not days. Many of our clients have us on speed-dial.

If you ever need immediate support or want to discuss emergency preparedness, we're here.

Best regards,
Disaster Recovery Australia
Available 24/7`,
      context: 'intro',
      brand: 'disaster_recovery_au',
    }),

    carsi: (name: string): EmailTemplate => ({
      subject: 'Industry-Leading Training for Cleaning & Restoration Professionals',
      body: `Hi ${name},

I'm reaching out to let you know about CARSI – the Cleaning & Restoration Science Institute.

We provide professional certification and training for technicians and contractors. Our curriculum is science-based and covers both classroom theory and practical field work.

CARSI graduates are trusted by restoration companies across Australia because they're actually prepared for the work.

If you're involved in training or hiring in the restoration industry, I'd love to discuss what we offer.

Best regards,
CARSI Team`,
      context: 'intro',
      brand: 'carsi',
    }),

    synthex: (name: string): EmailTemplate => ({
      subject: 'Marketing That Delivers Results for Service Businesses',
      body: `Hi ${name},

I'm Synthex, a done-for-you and done-with-you marketing agency for service businesses.

We specialize in:
- SEO and organic search visibility
- Content strategy aligned with your expertise
- Automated lead generation
- Conversion optimization

Unlike traditional agencies with big retainers, we focus on measurable results: lead volume, cost per lead, conversion rates.

If you're looking to grow predictably without wasting money on ads, let's talk.

Best regards,
Synthex`,
      context: 'intro',
      brand: 'synthex',
    }),

    unite_hub: (name: string): EmailTemplate => ({
      subject: 'Run Your Trade Business from One Platform',
      body: `Hi ${name},

I'm reaching out because we've built something specifically for trade business owners like you.

Unite-Hub is an operations platform that:
- Centralizes contact management, jobs, and invoicing
- Automates routine admin tasks
- Coordinates your team in real-time
- Integrates with your existing tools

Most of our customers save 8-10 hours per week on admin alone.

If you'd like to see how it could help your business run smoother, I'd be happy to show you a quick demo.

Best regards,
Unite-Hub Team`,
      context: 'intro',
      brand: 'unite_hub',
    }),
  },

  /**
   * Re-engagement email template
   * Used when reaching out to inactive contacts
   */
  reengagement: {
    disaster_recovery_au: (name: string): EmailTemplate => ({
      subject: 'Quick Check-In – Emergency Services Available When You Need',
      body: `Hi ${name},

It's been a while since we last connected. I wanted to check in and remind you that Disaster Recovery Australia is always available for emergency response.

Whether you're due for an inspection, emergency preparedness planning, or if an emergency has already occurred, our team is ready to help 24/7.

No pressure – just wanted to stay on your radar.

Best regards,
Disaster Recovery Australia`,
      context: 'reengagement',
      brand: 'disaster_recovery_au',
    }),
  },

  /**
   * Educational email template
   * Used for providing value and building authority
   */
  educational: {
    carsi: (name: string): EmailTemplate => ({
      subject: 'The Science Behind Proper Water Damage Restoration',
      body: `Hi ${name},

Many property managers don't realize that water damage restoration is a science, not just "drying things out."

Proper restoration requires understanding:
- Moisture dynamics and humidity control
- Material science (what can be salvaged vs replaced)
- Mould growth prevention
- IICRC standards

This is why hiring certified professionals makes a difference. They know the science.

At CARSI, we train technicians in these principles so they can handle complex damage scenarios correctly.

Would you like to learn more about what proper training looks like in this industry?

Best regards,
CARSI`,
      context: 'educational',
      brand: 'carsi',
    }),
  },
};

/**
 * Get template by brand and context
 */
export function getEmailTemplate(
  brand: string,
  context: string,
  name: string
): EmailTemplate | null {
  const templates = emailTemplates as any;

  if (templates[context] && templates[context][brand]) {
    return templates[context][brand](name);
  }

  return null;
}

/**
 * List available templates
 */
export function listAvailableTemplates() {
  return {
    followUp: ['disaster_recovery_au', 'carsi', 'synthex', 'unite_hub'],
    introduction: ['disaster_recovery_au', 'carsi', 'synthex', 'unite_hub'],
    reengagement: ['disaster_recovery_au'],
    educational: ['carsi'],
  };
}
