import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import GuideContent from './components/GuideContent';
import GuideSidebar from './components/GuideSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Complete Growth Hacking Guide 2025 | Master Exponential Growth',
  description: 'Master growth hacking with our comprehensive guide covering strategies, tools, and frameworks for exponential business growth. Learn AARRR metrics, viral loops, and proven tactics.',
  keywords: [
    'growth hacking guide',
    'growth strategies 2025',
    'startup growth playbook',
    'AARRR framework',
    'pirate metrics',
    'viral marketing guide',
    'growth experimentation',
    'product-market fit',
    'growth loops',
    'Brisbane growth hacking'
  ],
  url: '/growth-hacking/guide',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Growth Hacking', url: '/growth-hacking' },
  { name: 'Complete Guide', url: '/growth-hacking/guide' }
]);

const faqs = generateFAQSchema([
  {
    question: 'What is growth hacking?',
    answer: 'Growth hacking is a data-driven marketing approach that uses rapid experimentation across marketing channels and product development to identify the most efficient ways to grow a business. It combines marketing, data analysis, and engineering to achieve sustainable growth.'
  },
  {
    question: 'How long does it take to see results from growth hacking?',
    answer: 'Initial results from growth hacking experiments can be seen within 2-4 weeks. However, building sustainable growth engines typically takes 3-6 months of continuous experimentation and optimization.'
  },
  {
    question: 'What\'s the difference between growth hacking and traditional marketing?',
    answer: 'Growth hacking focuses on rapid experimentation, data-driven decisions, and scalable tactics with minimal budgets. Traditional marketing often involves longer campaigns, brand building, and higher budgets. Growth hacking prioritizes measurable growth over brand awareness.'
  },
  {
    question: 'What are the AARRR metrics?',
    answer: 'AARRR (Pirate Metrics) stands for Acquisition, Activation, Retention, Revenue, and Referral. These metrics help growth hackers measure and optimize each stage of the customer journey for maximum growth impact.'
  },
  {
    question: 'Can growth hacking work for B2B companies?',
    answer: 'Absolutely! B2B growth hacking focuses on tactics like LinkedIn outreach, content marketing, free tools, webinars, and account-based marketing. Many successful B2B companies like Slack and HubSpot used growth hacking to scale.'
  }
]);

const guideSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Master Growth Hacking',
  description: 'Complete guide to implementing growth hacking strategies for exponential business growth',
  image: 'https://unitegroup.com.au/images/growth-hacking-guide.jpg',
  totalTime: 'PT45M',
  supply: [],
  tool: [],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Understand Growth Fundamentals',
      text: 'Learn the core concepts of growth hacking including AARRR metrics and growth loops',
      url: 'https://unitegroup.com.au/growth-hacking/guide#fundamentals'
    },
    {
      '@type': 'HowToStep',
      name: 'Set Up Analytics',
      text: 'Implement comprehensive analytics to track user behavior and growth metrics',
      url: 'https://unitegroup.com.au/growth-hacking/guide#analytics'
    },
    {
      '@type': 'HowToStep',
      name: 'Run Experiments',
      text: 'Design and execute rapid experiments to test growth hypotheses',
      url: 'https://unitegroup.com.au/growth-hacking/guide#experiments'
    },
    {
      '@type': 'HowToStep',
      name: 'Optimize and Scale',
      text: 'Scale successful experiments and build sustainable growth engines',
      url: 'https://unitegroup.com.au/growth-hacking/guide#scale'
    }
  ]
};

export default function GrowthHackingGuidePage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          breadcrumbs,
          faqs,
          guideSchema
        ]}
      />
      
      <SubPillarTemplate
        title="Complete Growth Hacking Guide 2025"
        subtitle="Master the Art & Science of Exponential Growth"
        description="Everything you need to know about growth hacking - from fundamental concepts to advanced strategies used by unicorn startups."
        authorInfo={<AuthorInfo author={AUTHORS.emmRodriguez} publishDate="January 21, 2025" readTime="15" />}
        publishDate="January 21, 2025"
        readTime="15 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Growth Hacking', href: '/growth-hacking' },
          { name: 'Complete Guide', href: '/growth-hacking/guide' }
        ]}
        parentPage={{ name: 'Growth Hacking', href: '/growth-hacking' }}
        mainContent={<GuideContent />}
        sidebarContent={<GuideSidebar />}
        primaryCTA={{
          text: 'Start Free Consultation',
          href: '/contact?service=growth-hacking'
        }}
        secondaryCTA={{
          text: 'Download PDF Guide',
          href: '/growth-hacking/guide/download'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/growth-hacking-guide-2025.pdf"
        relatedPages={[
          {
            title: 'Growth Hacking Tools',
            description: 'Discover 50+ essential tools for growth hacking',
            href: '/growth-hacking/tools',
            type: 'resource'
          },
          {
            title: 'Growth Workshop',
            description: 'Join our intensive 2-day growth hacking workshop',
            href: '/growth-hacking/workshop',
            type: 'resource'
          },
          {
            title: 'Case Studies',
            description: 'Real growth hacking success stories and metrics',
            href: '/growth-hacking/case-studies',
            type: 'case-study'
          }
        ]}
      />
    </>
  );
}