/**
 * Landing Page Data - Case Studies and Integrations
 */

export interface CaseStudy {
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: {
    label: string;
    before: string;
    after: string;
  }[];
  logoUrl?: string;
  testimonial: string;
  testimonialAuthor: string;
}

export interface Integration {
  name: string;
  description: string;
  iconName: string;
  status: 'Connected' | 'Available' | 'Coming Soon';
  actionText: string;
  badgeText?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    company: 'Brisbane Balustrades',
    industry: 'Manufacturing & Trade Services',
    challenge:
      '50+ leads per month, no way to qualify them. Lost 30% to competitors due to slow response times.',
    solution:
      'Synthex auto-scored every lead based on engagement and intent. Prioritized hot opportunities in real-time.',
    metrics: [
      { label: 'Lead Response Time', before: '3 days', after: '4 hours' },
      { label: 'Close Rate', before: '18%', after: '31%' },
      { label: 'Monthly Revenue', before: '$42K', after: '$89K (+112%)' },
    ],
    testimonial:
      'Finally, our team can focus on closing deals instead of digging through emails. This changed everything.',
    testimonialAuthor: 'Sarah Mitchell, Owner',
  },
  {
    company: 'Digital Agency Midwest',
    industry: 'Creative & Marketing Agency',
    challenge:
      'Managing 25 client social projects. Team drowning in content scheduling, missing deadlines.',
    solution:
      'AI generates platform-specific content for all 8 platforms. Team approves and publishes in one click.',
    metrics: [
      { label: 'Content Turnaround', before: '8 hours', after: '45 minutes' },
      {
        label: 'Time Saved',
        before: '0 hrs/client',
        after: '4.5 hrs/client/month',
      },
      { label: 'Client Satisfaction', before: '7.2/10', after: '9.1/10' },
    ],
    testimonial:
      'We went from scrambling to keep up with client demands to confidently taking on 10 more accounts.',
    testimonialAuthor: 'Marcus Chen, Agency Director',
  },
  {
    company: 'Local Fitness Coaching',
    industry: 'Health & Wellness',
    challenge:
      'No system to nurture leads. Email marketing was manual, inconsistent, and poorly timed.',
    solution:
      'Drip campaigns with AI-triggered follow-ups based on lead score. Personalized content for each prospect.',
    metrics: [
      { label: 'Email Engagement', before: '12%', after: '34%' },
      { label: 'Lead-to-Client Rate', before: '22%', after: '48%' },
      { label: 'Monthly Revenue', before: '$8K', after: '$14.2K (+78%)' },
    ],
    testimonial:
      'Synthex basically doubled our conversion rate. We can now focus on coaching instead of chasing leads.',
    testimonialAuthor: 'Jessica Torres, Head Coach',
  },
];

export const integrations: Integration[] = [
  {
    name: 'Gmail',
    description: 'Email parsing, lead extraction, open/click tracking',
    iconName: 'gmail',
    status: 'Connected',
    actionText: 'Configure',
    badgeText: 'Most Popular',
  },
  {
    name: 'Slack',
    description: 'Real-time alerts, approval notifications, deployment status',
    iconName: 'slack',
    status: 'Connected',
    actionText: 'Configure',
  },
  {
    name: 'Zapier',
    description: 'Workflow automation, trigger webhooks, CRM sync',
    iconName: 'zapier',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'HubSpot',
    description: 'Contact sync, lead scoring feed, pipeline visibility',
    iconName: 'hubspot',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Stripe',
    description: 'Payment processing, invoice tracking, revenue attribution',
    iconName: 'stripe',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Salesforce',
    description: 'Enterprise CRM sync, reporting, forecasting',
    iconName: 'salesforce',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Mailchimp',
    description: 'Email list management, campaign integration',
    iconName: 'mailchimp',
    status: 'Available',
    actionText: 'Connect',
  },
  {
    name: 'Pipedrive',
    description: 'Sales pipeline, deal tracking, revenue forecasting',
    iconName: 'pipedrive',
    status: 'Available',
    actionText: 'Connect',
  },
];
