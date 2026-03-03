import { QuestionnaireData } from '@/types/questionnaire'

export const agencyQuestionnaireData: QuestionnaireData = {
  id: 'agency-onboarding',
  title: 'Agency Services Onboarding',
  description: 'Let\'s learn about your business to create a personalized service plan',
  startQuestionId: 'company-name',
  sections: [
    {
      id: 'company-info',
      title: 'Company Information',
      description: 'Basic information about your company',
      questions: [
        {
          id: 'company-name',
          title: 'What is your company name?',
          type: 'text',
          required: true,
          placeholder: 'Enter your company name',
          defaultNext: 'industry'
        },
        {
          id: 'industry',
          title: 'What industry are you in?',
          type: 'select',
          required: true,
          options: [
            { value: 'ecommerce', label: 'E-commerce', nextQuestionId: 'ecommerce-platform' },
            { value: 'saas', label: 'SaaS', nextQuestionId: 'saas-model' },
            { value: 'healthcare', label: 'Healthcare', nextQuestionId: 'healthcare-compliance' },
            { value: 'finance', label: 'Finance', nextQuestionId: 'finance-regulations' },
            { value: 'retail', label: 'Retail', nextQuestionId: 'retail-locations' },
            { value: 'manufacturing', label: 'Manufacturing', nextQuestionId: 'company-size' },
            { value: 'education', label: 'Education', nextQuestionId: 'education-type' },
            { value: 'other', label: 'Other', nextQuestionId: 'industry-other' }
          ]
        },
        {
          id: 'industry-other',
          title: 'Please specify your industry',
          type: 'text',
          required: true,
          placeholder: 'Enter your industry',
          defaultNext: 'company-size'
        },
        {
          id: 'ecommerce-platform',
          title: 'Which e-commerce platform do you use?',
          type: 'radio',
          required: true,
          options: [
            { value: 'shopify', label: 'Shopify' },
            { value: 'woocommerce', label: 'WooCommerce' },
            { value: 'magento', label: 'Magento' },
            { value: 'custom', label: 'Custom Platform' },
            { value: 'none', label: 'Not yet established' }
          ],
          defaultNext: 'monthly-revenue'
        },
        {
          id: 'saas-model',
          title: 'What is your SaaS business model?',
          type: 'radio',
          required: true,
          options: [
            { value: 'b2b', label: 'B2B' },
            { value: 'b2c', label: 'B2C' },
            { value: 'b2b2c', label: 'B2B2C' }
          ],
          defaultNext: 'monthly-recurring-revenue'
        },
        {
          id: 'healthcare-compliance',
          title: 'Do you need HIPAA compliance?',
          type: 'radio',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'Not sure' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'finance-regulations',
          title: 'Which financial regulations apply to you?',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'sec', label: 'SEC' },
            { value: 'finra', label: 'FINRA' },
            { value: 'pci', label: 'PCI DSS' },
            { value: 'sox', label: 'SOX' },
            { value: 'other', label: 'Other' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'retail-locations',
          title: 'How many retail locations do you have?',
          type: 'select',
          required: true,
          options: [
            { value: '1', label: 'Single location' },
            { value: '2-5', label: '2-5 locations' },
            { value: '6-20', label: '6-20 locations' },
            { value: '20+', label: 'More than 20' },
            { value: 'online-only', label: 'Online only' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'education-type',
          title: 'What type of educational institution?',
          type: 'radio',
          required: true,
          options: [
            { value: 'k12', label: 'K-12' },
            { value: 'higher-ed', label: 'Higher Education' },
            { value: 'vocational', label: 'Vocational/Trade School' },
            { value: 'online-learning', label: 'Online Learning Platform' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'monthly-revenue',
          title: 'What is your average monthly revenue?',
          type: 'select',
          required: true,
          options: [
            { value: '<10k', label: 'Less than $10,000' },
            { value: '10k-50k', label: '$10,000 - $50,000' },
            { value: '50k-200k', label: '$50,000 - $200,000' },
            { value: '200k-1m', label: '$200,000 - $1M' },
            { value: '1m+', label: 'More than $1M' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'monthly-recurring-revenue',
          title: 'What is your monthly recurring revenue (MRR)?',
          type: 'select',
          required: true,
          options: [
            { value: '<5k', label: 'Less than $5,000' },
            { value: '5k-25k', label: '$5,000 - $25,000' },
            { value: '25k-100k', label: '$25,000 - $100,000' },
            { value: '100k-500k', label: '$100,000 - $500,000' },
            { value: '500k+', label: 'More than $500,000' }
          ],
          defaultNext: 'company-size'
        },
        {
          id: 'company-size',
          title: 'How many employees do you have?',
          type: 'select',
          required: true,
          options: [
            { value: '1-5', label: '1-5 employees', nextQuestionId: 'startup-stage' },
            { value: '6-20', label: '6-20 employees', nextQuestionId: 'growth-stage' },
            { value: '21-50', label: '21-50 employees', nextQuestionId: 'scaling-challenges' },
            { value: '51-200', label: '51-200 employees', nextQuestionId: 'enterprise-needs' },
            { value: '200+', label: 'More than 200', nextQuestionId: 'enterprise-needs' }
          ]
        },
        {
          id: 'startup-stage',
          title: 'What stage is your startup in?',
          type: 'radio',
          required: true,
          options: [
            { value: 'idea', label: 'Idea/Concept' },
            { value: 'mvp', label: 'MVP Development' },
            { value: 'early-customers', label: 'Early Customers' },
            { value: 'growth', label: 'Growth Phase' }
          ],
          defaultNext: 'website-status'
        },
        {
          id: 'growth-stage',
          title: 'What is your primary growth challenge?',
          type: 'radio',
          required: true,
          options: [
            { value: 'lead-generation', label: 'Lead Generation' },
            { value: 'conversion', label: 'Conversion Rate' },
            { value: 'retention', label: 'Customer Retention' },
            { value: 'operations', label: 'Operations & Scaling' }
          ],
          defaultNext: 'website-status'
        },
        {
          id: 'scaling-challenges',
          title: 'What are your main scaling challenges?',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'technology', label: 'Technology Infrastructure' },
            { value: 'processes', label: 'Business Processes' },
            { value: 'marketing', label: 'Marketing & Sales' },
            { value: 'talent', label: 'Talent Acquisition' },
            { value: 'funding', label: 'Funding' }
          ],
          defaultNext: 'website-status'
        },
        {
          id: 'enterprise-needs',
          title: 'What enterprise features do you need?',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'sso', label: 'Single Sign-On (SSO)' },
            { value: 'api', label: 'API Integration' },
            { value: 'compliance', label: 'Compliance & Security' },
            { value: 'custom-reporting', label: 'Custom Reporting' },
            { value: 'dedicated-support', label: 'Dedicated Support' }
          ],
          defaultNext: 'website-status'
        },
        {
          id: 'website-status',
          title: 'Do you have a website?',
          type: 'radio',
          required: true,
          options: [
            { value: 'yes', label: 'Yes', nextQuestionId: 'website-url' },
            { value: 'no', label: 'No', nextQuestionId: 'services-needed' },
            { value: 'building', label: 'Currently building one', nextQuestionId: 'services-needed' }
          ]
        },
        {
          id: 'website-url',
          title: 'What is your website URL?',
          type: 'url',
          required: false,
          placeholder: 'https://www.example.com',
          defaultNext: 'website-satisfaction'
        },
        {
          id: 'website-satisfaction',
          title: 'How satisfied are you with your current website?',
          type: 'radio',
          required: true,
          options: [
            { value: 'very-satisfied', label: 'Very Satisfied' },
            { value: 'satisfied', label: 'Satisfied' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'unsatisfied', label: 'Unsatisfied' },
            { value: 'very-unsatisfied', label: 'Very Unsatisfied' }
          ],
          conditionalNext: [
            {
              condition: (value) => value === 'unsatisfied' || value === 'very-unsatisfied',
              nextQuestionId: 'website-problems'
            }
          ],
          defaultNext: 'services-needed'
        },
        {
          id: 'website-problems',
          title: 'What are the main issues with your website?',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'design', label: 'Outdated Design' },
            { value: 'performance', label: 'Slow Performance' },
            { value: 'mobile', label: 'Not Mobile-Friendly' },
            { value: 'seo', label: 'Poor SEO' },
            { value: 'conversion', label: 'Low Conversion Rate' },
            { value: 'content', label: 'Content Management' },
            { value: 'functionality', label: 'Missing Features' }
          ],
          defaultNext: 'services-needed'
        }
      ]
    },
    {
      id: 'services',
      title: 'Services Needed',
      description: 'What services are you looking for?',
      questions: [
        {
          id: 'services-needed',
          title: 'Which services are you interested in?',
          type: 'checkbox',
          required: true,
          options: [
            { value: 'web-development', label: 'Web Development' },
            { value: 'mobile-app', label: 'Mobile App Development' },
            { value: 'seo', label: 'SEO & Search Marketing' },
            { value: 'social-media', label: 'Social Media Marketing' },
            { value: 'content-marketing', label: 'Content Marketing' },
            { value: 'email-marketing', label: 'Email Marketing' },
            { value: 'branding', label: 'Branding & Design' },
            { value: 'consulting', label: 'Business Consulting' },
            { value: 'training', label: 'Training & Workshops' },
            { value: 'automation', label: 'Process Automation' }
          ],
          defaultNext: 'primary-goal'
        },
        {
          id: 'primary-goal',
          title: 'What is your primary business goal?',
          type: 'radio',
          required: true,
          options: [
            { value: 'increase-revenue', label: 'Increase Revenue' },
            { value: 'reduce-costs', label: 'Reduce Costs' },
            { value: 'improve-efficiency', label: 'Improve Efficiency' },
            { value: 'expand-market', label: 'Expand Market Reach' },
            { value: 'brand-awareness', label: 'Build Brand Awareness' },
            { value: 'customer-experience', label: 'Improve Customer Experience' }
          ],
          defaultNext: 'timeline'
        },
        {
          id: 'timeline',
          title: 'When do you need to start?',
          type: 'radio',
          required: true,
          options: [
            { value: 'immediately', label: 'Immediately' },
            { value: '1-month', label: 'Within 1 month' },
            { value: '3-months', label: 'Within 3 months' },
            { value: '6-months', label: 'Within 6 months' },
            { value: 'planning', label: 'Just planning ahead' }
          ],
          defaultNext: 'budget'
        },
        {
          id: 'budget',
          title: 'What is your budget range for these services?',
          type: 'select',
          required: true,
          options: [
            { value: '<5k', label: 'Less than $5,000' },
            { value: '5k-15k', label: '$5,000 - $15,000' },
            { value: '15k-50k', label: '$15,000 - $50,000' },
            { value: '50k-100k', label: '$50,000 - $100,000' },
            { value: '100k+', label: 'More than $100,000' },
            { value: 'unsure', label: 'Not sure yet' }
          ],
          defaultNext: 'current-challenges'
        },
        {
          id: 'current-challenges',
          title: 'What are your biggest challenges right now?',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your main pain points and challenges...',
          defaultNext: 'contact-name'
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'How can we reach you?',
      questions: [
        {
          id: 'contact-name',
          title: 'What is your name?',
          type: 'text',
          required: true,
          placeholder: 'John Doe',
          defaultNext: 'contact-email'
        },
        {
          id: 'contact-email',
          title: 'What is your email address?',
          type: 'email',
          required: true,
          placeholder: 'john@example.com',
          defaultNext: 'contact-phone'
        },
        {
          id: 'contact-phone',
          title: 'What is your phone number?',
          type: 'tel',
          required: false,
          placeholder: '+1 (555) 123-4567',
          defaultNext: 'preferred-contact'
        },
        {
          id: 'preferred-contact',
          title: 'How do you prefer to be contacted?',
          type: 'radio',
          required: true,
          options: [
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'both', label: 'Either is fine' }
          ],
          defaultNext: 'additional-info'
        },
        {
          id: 'additional-info',
          title: 'Is there anything else you\'d like us to know?',
          type: 'textarea',
          required: false,
          placeholder: 'Any additional information or special requirements...',
          defaultNext: 'complete'
        }
      ]
    }
  ]
}