import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import CaseStudiesContent from './components/CaseStudiesContent';
import CaseStudiesSidebar from './components/CaseStudiesSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Growth Hacking Case Studies | Real Success Stories & Metrics',
  description: 'Explore detailed growth hacking case studies from successful companies. Learn from real metrics, strategies, and tactics that drove exponential growth for startups and enterprises.',
  keywords: [
    'growth hacking case studies',
    'startup growth stories',
    'viral marketing examples',
    'growth metrics analysis',
    'unicorn growth strategies',
    'B2B growth case studies',
    'SaaS growth examples',
    'ecommerce growth tactics',
    'Australian startup growth',
    'Brisbane growth success',
    'real growth data',
    'growth experiment results'
  ],
  url: '/growth-hacking/case-studies',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Growth Hacking', url: '/growth-hacking' },
  { name: 'Case Studies', url: '/growth-hacking/case-studies' }
]);

const faqs = generateFAQSchema([
  {
    question: 'How were these growth metrics verified?',
    answer: 'All metrics presented in our case studies are sourced from public company reports, verified interviews with growth teams, published case studies, or direct collaboration with the companies. We only include verifiable data points.'
  },
  {
    question: 'Can these strategies work for small businesses?',
    answer: 'Absolutely! While the scale may differ, the fundamental growth principles and tactics used by these companies can be adapted for businesses of all sizes. We provide scaling guidelines for each strategy.'
  },
  {
    question: 'How often are these case studies updated?',
    answer: 'We update our case studies quarterly with new examples and refresh existing data annually. The growth landscape evolves rapidly, so we ensure our insights remain current and actionable.'
  },
  {
    question: 'Are there Australian company examples?',
    answer: 'Yes! We feature several Australian and Asia-Pacific companies including Canva, Atlassian, and local Brisbane startups that have achieved significant growth using these strategies.'
  },
  {
    question: 'Can you implement these strategies for my business?',
    answer: 'Absolutely! Our growth team specializes in adapting proven strategies for different industries and business models. We offer consultation to help you implement similar tactics tailored to your specific situation.'
  }
]);

const caseStudiesSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Growth Hacking Case Studies',
  description: 'Real-world growth hacking success stories with verified metrics and actionable insights',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'Article',
        name: 'Dropbox: 3900% Growth Through Viral Referrals',
        description: 'How Dropbox grew from 100K to 4M users in 15 months using viral referral loops',
        url: 'https://unitegroup.com.au/growth-hacking/case-studies#dropbox'
      },
      {
        '@type': 'Article',
        name: 'Airbnb: From Zero to $1B Through Creative Growth Hacks',
        description: 'Airbnb\'s journey using Craigslist integration and professional photography',
        url: 'https://unitegroup.com.au/growth-hacking/case-studies#airbnb'
      },
      {
        '@type': 'Article',
        name: 'Slack: B2B Viral Growth and Product-Led Growth',
        description: 'How Slack achieved 500% year-over-year growth through team collaboration mechanics',
        url: 'https://unitegroup.com.au/growth-hacking/case-studies#slack'
      }
    ]
  }
};

export default function GrowthHackingCaseStudiesPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          breadcrumbs,
          faqs,
          caseStudiesSchema
        ]}
      />
      
      <SubPillarTemplate
        title="Growth Hacking Case Studies"
        subtitle="Real Success Stories with Verified Metrics"
        description="Learn from the world's fastest-growing companies. Explore detailed case studies with real metrics, actionable strategies, and step-by-step breakdowns of viral growth tactics."
        authorInfo={<AuthorInfo author={AUTHORS.emmRodriguez} publishDate="January 21, 2025" readTime="25" />}
        publishDate="January 21, 2025"
        readTime="25 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Growth Hacking', href: '/growth-hacking' },
          { name: 'Case Studies', href: '/growth-hacking/case-studies' }
        ]}
        parentPage={{ name: 'Growth Hacking', href: '/growth-hacking' }}
        mainContent={<CaseStudiesContent />}
        sidebarContent={<CaseStudiesSidebar />}
        primaryCTA={{
          text: 'Get Growth Strategy Review',
          href: '/contact?service=growth-strategy'
        }}
        secondaryCTA={{
          text: 'Download Case Study Pack',
          href: '/downloads/growth-case-studies.pdf'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/growth-case-studies-detailed.pdf"
        relatedPages={[
          {
            title: 'Complete Growth Guide',
            description: 'Master growth hacking fundamentals and frameworks',
            href: '/growth-hacking/guide',
            type: 'guide'
          },
          {
            title: 'Growth Workshop',
            description: 'Hands-on 2-day growth hacking training in Brisbane',
            href: '/growth-hacking/workshop',
            type: 'resource'
          },
          {
            title: 'Growth Tools',
            description: 'Essential tools and software for growth teams',
            href: '/growth-hacking/tools',
            type: 'resource'
          }
        ]}
      />
    </>
  );
}