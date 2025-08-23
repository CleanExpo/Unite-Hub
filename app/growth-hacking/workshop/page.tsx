import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import WorkshopContent from './components/WorkshopContent';
import WorkshopSidebar from './components/WorkshopSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Growth Hacking Workshop Brisbane | 2-Day Intensive Training',
  description: 'Join our hands-on growth hacking workshop in Brisbane. Learn proven strategies, tools, and frameworks used by unicorn startups. Small groups, practical exercises, certificate included.',
  keywords: [
    'growth hacking workshop Brisbane',
    'growth marketing training',
    'startup growth course',
    'digital marketing workshop',
    'growth experimentation training',
    'AARRR framework workshop',
    'viral marketing course',
    'Brisbane marketing training',
    'growth hacking certification',
    'startup marketing workshop',
    'Queensland growth training',
    'hands-on marketing course'
  ],
  url: '/growth-hacking/workshop',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Growth Hacking', url: '/growth-hacking' },
  { name: 'Workshop', url: '/growth-hacking/workshop' }
]);

const faqs = generateFAQSchema([
  {
    question: 'Who should attend the growth hacking workshop?',
    answer: 'Our workshop is designed for startup founders, marketing managers, product managers, digital marketers, and business owners looking to scale their companies using data-driven growth strategies. No prior growth hacking experience required.'
  },
  {
    question: 'What will I learn in the 2-day workshop?',
    answer: 'You\'ll master the AARRR framework, learn 20+ proven growth tactics, set up analytics dashboards, design experiments, build viral loops, and create a 90-day growth plan for your business. All with hands-on exercises using real data.'
  },
  {
    question: 'Is this workshop suitable for beginners?',
    answer: 'Yes! We start with fundamentals and build up to advanced strategies. Our instructors provide personalized guidance, and all materials are provided. You\'ll leave with practical skills you can implement immediately.'
  },
  {
    question: 'Do you provide a certificate?',
    answer: 'Yes, all participants receive a verified Growth Hacking Professional certificate from Unite Group Agency, recognized by industry professionals and can be added to your LinkedIn profile.'
  },
  {
    question: 'What tools and software will we use?',
    answer: 'We\'ll work with Google Analytics, Facebook Ads Manager, LinkedIn Campaign Manager, Mixpanel, Hotjar, Typeform, and other popular growth tools. All accounts and access are provided during the workshop.'
  },
  {
    question: 'Is there ongoing support after the workshop?',
    answer: 'Yes! Workshop participants get 3 months of free access to our private Slack community, monthly Q&A sessions, and a library of growth hacking resources and templates.'
  }
]);

const workshopSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationEvent',
  name: 'Growth Hacking Workshop - 2-Day Intensive Training',
  description: 'Hands-on growth hacking workshop covering proven strategies, tools, and frameworks for exponential business growth',
  startDate: '2025-02-15T09:00:00+10:00',
  endDate: '2025-02-16T17:00:00+10:00',
  location: {
    '@type': 'Place',
    name: 'Unite Group Agency Training Center',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Queen Street',
      addressLocality: 'Brisbane',
      addressRegion: 'QLD',
      postalCode: '4000',
      addressCountry: 'AU'
    }
  },
  organizer: {
    '@type': 'Organization',
    name: 'Unite Group Agency',
    url: 'https://unitegroup.com.au'
  },
  offers: {
    '@type': 'Offer',
    price: '1497',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
    url: 'https://unitegroup.com.au/growth-hacking/workshop',
    validFrom: '2025-01-01T00:00:00+10:00'
  },
  performer: {
    '@type': 'Person',
    name: 'Growth Hacking Expert Team',
    description: 'Certified growth professionals with 50+ successful growth projects'
  }
};

export default function GrowthHackingWorkshopPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          breadcrumbs,
          faqs,
          workshopSchema
        ]}
      />
      
      <SubPillarTemplate
        title="Growth Hacking Workshop"
        subtitle="2-Day Intensive Training in Brisbane"
        description="Master growth hacking with hands-on training from industry experts. Learn proven strategies, tools, and frameworks used by unicorn startups to achieve exponential growth."
        authorInfo={<AuthorInfo author={AUTHORS.emmRodriguez} publishDate="January 18, 2025" readTime="8" />}
        publishDate="January 21, 2025"
        readTime="2-day workshop"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Growth Hacking', href: '/growth-hacking' },
          { name: 'Workshop', href: '/growth-hacking/workshop' }
        ]}
        parentPage={{ name: 'Growth Hacking', href: '/growth-hacking' }}
        mainContent={<WorkshopContent />}
        sidebarContent={<WorkshopSidebar />}
        primaryCTA={{
          text: 'Book Your Spot - $1,497',
          href: '/contact?service=growth-workshop'
        }}
        secondaryCTA={{
          text: 'Download Curriculum',
          href: '/downloads/growth-workshop-curriculum.pdf'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/growth-workshop-details.pdf"
        relatedPages={[
          {
            title: 'Complete Growth Guide',
            description: 'Master growth hacking fundamentals and advanced strategies',
            href: '/growth-hacking/guide',
            type: 'guide'
          },
          {
            title: 'Growth Hacking Tools',
            description: 'Essential tools and software for growth teams',
            href: '/growth-hacking/tools',
            type: 'resource'
          },
          {
            title: 'Case Studies',
            description: 'Real growth hacking success stories with metrics',
            href: '/growth-hacking/case-studies',
            type: 'case-study'
          }
        ]}
      />
    </>
  );
}