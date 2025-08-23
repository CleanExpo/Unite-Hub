import { Metadata } from 'next';
import { generateSEOMetadata, generateServiceSchema, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import FrameworksContent from './components/FrameworksContent';
import FrameworksSidebar from './components/FrameworksSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Agile Marketing Frameworks Brisbane | Scrum, Kanban & Lean Marketing',
  description: 'Master agile marketing frameworks including Scrum, Kanban, and Lean methodologies. Implementation guides, best practices, and templates for Brisbane marketing teams.',
  keywords: [
    'agile marketing frameworks',
    'scrum marketing methodology',
    'kanban marketing boards',
    'lean marketing principles',
    'agile marketing implementation',
    'marketing sprint planning',
    'agile marketing tools Brisbane',
    'marketing team frameworks',
    'agile marketing best practices',
    'marketing workflow optimization'
  ],
  url: '/agile-marketing/frameworks',
  type: 'article'
});

const frameworksService = generateServiceSchema({
  name: 'Agile Marketing Frameworks Training',
  description: 'Comprehensive training on agile marketing frameworks including Scrum, Kanban, and Lean methodologies for marketing teams.',
  provider: 'Unite Group Agency',
  areaServed: 'Brisbane, Queensland, Australia',
  hasOfferCatalog: {
    name: 'Framework Training Services',
    itemListElement: [
      {
        name: 'Scrum for Marketing Training',
        description: 'Learn to implement Scrum methodology specifically adapted for marketing teams and campaigns'
      },
      {
        name: 'Kanban Marketing Workshop',
        description: 'Visual workflow management and continuous improvement techniques for marketing teams'
      },
      {
        name: 'Lean Marketing Principles',
        description: 'Eliminate waste and optimize value delivery in marketing processes and campaigns'
      }
    ]
  }
});

const faqs = generateFAQSchema([
  {
    question: 'Which agile framework is best for marketing teams?',
    answer: 'The best framework depends on your team size, campaign types, and organizational culture. Scrum works well for campaign-focused teams, Kanban is great for continuous marketing activities, and Lean principles apply universally for waste reduction and value optimization.'
  },
  {
    question: 'How do marketing sprints differ from development sprints?',
    answer: 'Marketing sprints typically run 1-4 weeks and focus on campaign deliverables, content creation, and performance goals rather than software features. They include marketing-specific ceremonies like campaign retrospectives and customer feedback reviews.'
  },
  {
    question: 'Can we combine multiple agile frameworks in marketing?',
    answer: 'Yes, many successful marketing teams use hybrid approaches. For example, using Scrum for campaign planning with Kanban boards for ongoing tasks, all while applying Lean principles to eliminate waste and improve efficiency.'
  }
]);

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Agile Marketing', url: '/agile-marketing' },
  { name: 'Frameworks', url: '/agile-marketing/frameworks' }
]);

const relatedPages = [
  {
    title: 'Team Training Programs',
    description: 'Comprehensive training programs to build agile marketing capabilities',
    href: '/agile-marketing/team-training',
    type: 'guide' as const
  },
  {
    title: 'Agile Transformation',
    description: 'End-to-end organizational change management for agile adoption',
    href: '/agile-marketing/transformation',
    type: 'guide' as const
  },
  {
    title: 'Growth Hacking Guide',
    description: 'Rapid experimentation and growth strategies using agile principles',
    href: '/growth-hacking/guide',
    type: 'resource' as const
  }
];

export default function AgileMarketingFrameworksPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          frameworksService,
          faqs,
          breadcrumbs
        ]}
      />
      
      <SubPillarTemplate
        title="Agile Marketing Frameworks"
        subtitle="Scrum, Kanban & Lean for Marketing Teams"
        description="Master the most effective agile frameworks adapted specifically for marketing teams. From sprint planning to continuous improvement, learn how to implement Scrum, Kanban, and Lean methodologies to transform your marketing operations."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 15, 2025" readTime="18" />}
        publishDate="January 2025"
        readTime="12 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Agile Marketing', href: '/agile-marketing' },
          { name: 'Frameworks', href: '/agile-marketing/frameworks' }
        ]}
        parentPage={{ name: 'Agile Marketing', href: '/agile-marketing' }}
        mainContent={<FrameworksContent />}
        sidebarContent={<FrameworksSidebar />}
        relatedPages={relatedPages}
        primaryCTA={{
          text: 'Get Framework Training',
          href: '/contact'
        }}
        secondaryCTA={{
          text: 'Download Templates',
          href: '/agile-marketing/frameworks/templates'
        }}
        showTableOfContents={true}
        showSocialShare={true}
        showDownloadButton={true}
        downloadUrl="/agile-marketing-frameworks-guide.pdf"
      />
    </>
  );
}