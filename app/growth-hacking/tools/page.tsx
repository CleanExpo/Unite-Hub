import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import ToolsContent from './components/ToolsContent';
import ToolsSidebar from './components/ToolsSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Best Growth Hacking Tools 2025 | 50+ Essential Marketing Tools',
  description: 'Discover the top 50+ growth hacking tools for analytics, automation, A/B testing, and optimization. Compare features, pricing, and use cases.',
  keywords: [
    'growth hacking tools',
    'marketing automation tools',
    'A/B testing tools',
    'analytics tools Brisbane',
    'growth marketing software',
    'conversion optimization tools',
    'email marketing tools',
    'social media tools',
    'SEO tools',
    'product analytics'
  ],
  url: '/growth-hacking/tools'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Growth Hacking', url: '/growth-hacking' },
  { name: 'Tools', url: '/growth-hacking/tools' }
]);

const faqs = generateFAQSchema([
  {
    question: 'What are the essential growth hacking tools for startups?',
    answer: 'Essential growth hacking tools for startups include Google Analytics for tracking, Hotjar for user behavior, Mailchimp for email marketing, Buffer for social media, and Optimizely for A/B testing. Start with free tiers and upgrade as you grow.'
  },
  {
    question: 'How much should I budget for growth hacking tools?',
    answer: 'Startups typically spend $200-500/month on growth tools, while established businesses invest $1000-5000/month. Start with free tools and gradually add paid tools as you validate their ROI.'
  },
  {
    question: 'What\'s the best analytics tool for growth hacking?',
    answer: 'Google Analytics is the foundation, but combine it with Mixpanel for product analytics, Amplitude for user behavior, and Segment for data integration. The best tool depends on your specific needs and technical capabilities.'
  },
  {
    question: 'Which A/B testing tool should I use?',
    answer: 'For beginners, Google Optimize (free) or VWO are great. Advanced users prefer Optimizely or AB Tasty. Consider your traffic volume, technical skills, and budget when choosing.'
  },
  {
    question: 'Are there free alternatives to expensive growth tools?',
    answer: 'Yes! Use Google Analytics instead of paid analytics, Mailchimp free tier for email, Buffer free for social media, Google Optimize for A/B testing, and Hotjar free for heatmaps. Many premium tools offer generous free tiers.'
  }
]);

export default function GrowthHackingToolsPage() {
  return (
    <>
      <SEOHead 
        structuredData={[breadcrumbs, faqs]}
      />
      
      <SubPillarTemplate
        title="50+ Best Growth Hacking Tools for 2025"
        subtitle="Your Complete Toolkit for Exponential Growth"
        description="Discover, compare, and choose the perfect growth hacking tools for your business. From analytics to automation, we've tested them all."
        authorInfo={<AuthorInfo author={AUTHORS.emmRodriguez} publishDate="January 20, 2025" readTime="12" />}
        publishDate="January 2025"
        readTime="12 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Growth Hacking', href: '/growth-hacking' },
          { name: 'Tools', href: '/growth-hacking/tools' }
        ]}
        parentPage={{ name: 'Growth Hacking', href: '/growth-hacking' }}
        mainContent={<ToolsContent />}
        sidebarContent={<ToolsSidebar />}
        primaryCTA={{
          text: 'Get Tool Recommendations',
          href: '/contact?service=growth-tools-consultation'
        }}
        secondaryCTA={{
          text: 'Download Tools Comparison',
          href: '/downloads/growth-tools-comparison.pdf'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/growth-hacking-tools-guide.pdf"
        relatedPages={[
          {
            title: 'Growth Hacking Guide',
            description: 'Master growth hacking fundamentals',
            href: '/growth-hacking/guide',
            type: 'guide'
          },
          {
            title: 'Growth Calculator',
            description: 'Calculate your growth metrics',
            href: '/growth-hacking/calculator',
            type: 'tool'
          },
          {
            title: 'Case Studies',
            description: 'See tools in action',
            href: '/growth-hacking/case-studies',
            type: 'case-study'
          }
        ]}
      />
    </>
  );
}