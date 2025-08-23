import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import FacebookAdsContent from './components/FacebookAdsContent';
import FacebookAdsSidebar from './components/FacebookAdsSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Facebook Ads Management Brisbane | Expert Social Advertising',
  description: 'Master Facebook advertising with proven strategies that deliver 400%+ ROAS. Complete guide to Facebook Ads management, targeting, optimization, and scaling for Brisbane businesses.',
  keywords: [
    'Facebook ads Brisbane',
    'Facebook advertising Australia',
    'Facebook ads management',
    'Meta advertising agency',
    'Facebook marketing Brisbane',
    'social media advertising',
    'Facebook campaign optimization',
    'Facebook pixel setup',
    'Facebook ads targeting',
    'Brisbane Facebook marketing',
    'Queensland social advertising',
    'Facebook ads ROI'
  ],
  url: '/social-advertising/facebook-ads',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Social Advertising', url: '/social-advertising' },
  { name: 'Facebook Ads', url: '/social-advertising/facebook-ads' }
]);

const faqs = generateFAQSchema([
  {
    question: 'How much should I spend on Facebook ads?',
    answer: 'Facebook ad spend varies by business size and goals. Start with $500-1000/month for testing, then scale based on performance. We typically see profitable campaigns with $50-100 daily budgets for local Brisbane businesses.'
  },
  {
    question: 'What\'s a good Facebook ads conversion rate?',
    answer: 'Average Facebook conversion rates range from 2-5% depending on industry. E-commerce typically sees 1-2%, while lead generation can achieve 5-10%. Our Brisbane clients average 6-12% conversion rates.'
  },
  {
    question: 'How long does it take to see Facebook ads results?',
    answer: 'Initial data appears within 24-48 hours, but meaningful results typically require 7-14 days. Full optimization and scaling usually take 30-60 days depending on budget and market.'
  },
  {
    question: 'Should I use Facebook\'s automatic or manual bidding?',
    answer: 'Start with automatic bidding for learning, then switch to manual bidding for better control. Automatic bidding works well for new accounts, while manual bidding is better for experienced advertisers with stable performance.'
  },
  {
    question: 'How important is Facebook pixel setup?',
    answer: 'Facebook pixel is crucial for tracking conversions, building custom audiences, and optimizing campaigns. Proper pixel setup can improve campaign performance by 40-60% through better targeting and optimization.'
  },
  {
    question: 'Can you manage Facebook ads for Brisbane businesses remotely?',
    answer: 'Yes! We manage Facebook ads for Brisbane businesses both locally and remotely. We understand the Brisbane market, local events, and seasonal trends that impact Facebook advertising performance.'
  }
]);

const facebookAdsSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Facebook Ads Management Brisbane',
  description: 'Professional Facebook advertising management for Brisbane businesses',
  provider: {
    '@type': 'Organization',
    name: 'Unite Group Agency',
    url: 'https://unitegroup.com.au'
  },
  areaServed: {
    '@type': 'Place',
    name: 'Brisbane, Queensland, Australia'
  },
  offers: {
    '@type': 'Offer',
    description: 'Facebook Ads Strategy and Management Services',
    category: 'Digital Marketing',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30
    }
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Facebook Advertising Services',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Facebook Ads Strategy',
        description: 'Custom Facebook advertising strategy development'
      },
      {
        '@type': 'Offer',
        name: 'Campaign Management',
        description: 'Full-service Facebook ads campaign management'
      },
      {
        '@type': 'Offer',
        name: 'Facebook Pixel Setup',
        description: 'Professional Facebook pixel implementation and tracking'
      }
    ]
  }
};

export default function FacebookAdsPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          breadcrumbs,
          faqs,
          facebookAdsSchema
        ]}
      />
      
      <SubPillarTemplate
        title="Facebook Ads Management"
        subtitle="Expert Social Advertising for Brisbane Businesses"
        description="Master Facebook advertising with proven strategies that consistently deliver 400%+ ROAS. Complete guide to campaign setup, targeting, optimization, and scaling for maximum profitability."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 12, 2025" readTime="22" />}
        publishDate="January 21, 2025"
        readTime="18 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Social Advertising', href: '/social-advertising' },
          { name: 'Facebook Ads', href: '/social-advertising/facebook-ads' }
        ]}
        parentPage={{ name: 'Social Advertising', href: '/social-advertising' }}
        mainContent={<FacebookAdsContent />}
        sidebarContent={<FacebookAdsSidebar />}
        primaryCTA={{
          text: 'Get Facebook Ads Audit',
          href: '/contact?service=facebook-ads-audit'
        }}
        secondaryCTA={{
          text: 'Download Facebook Ads Guide',
          href: '/downloads/facebook-ads-guide-2025.pdf'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/facebook-ads-playbook.pdf"
        relatedPages={[
          {
            title: 'LinkedIn B2B Advertising',
            description: 'Professional B2B advertising strategies for LinkedIn',
            href: '/social-advertising/linkedin-b2b',
            type: 'guide'
          },
          {
            title: 'ROI Calculator',
            description: 'Calculate your social advertising return on investment',
            href: '/social-advertising/roi-calculator',
            type: 'tool'
          },
          {
            title: 'Growth Hacking Tools',
            description: 'Essential tools for growth-driven advertising',
            href: '/growth-hacking/tools',
            type: 'resource'
          }
        ]}
      />
    </>
  );
}