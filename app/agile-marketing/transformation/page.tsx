import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import TransformationContent from './components/TransformationContent';
import TransformationSidebar from './components/TransformationSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Agile Marketing Transformation | Complete Implementation Guide',
  description: 'Transform your marketing team with agile methodologies. Learn frameworks, processes, and tools to increase marketing velocity by 300% while improving campaign effectiveness.',
  keywords: [
    'agile marketing transformation',
    'marketing team transformation',
    'agile marketing methodology',
    'marketing process optimization',
    'scrum for marketing teams',
    'kanban marketing boards',
    'marketing sprint planning',
    'Brisbane agile marketing',
    'marketing team efficiency',
    'digital marketing agility',
    'marketing operations transformation',
    'Australian agile marketing'
  ],
  url: '/agile-marketing/transformation',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Agile Marketing', url: '/agile-marketing' },
  { name: 'Transformation', url: '/agile-marketing/transformation' }
]);

const faqs = generateFAQSchema([
  {
    question: 'How long does an agile marketing transformation take?',
    answer: 'A typical agile marketing transformation takes 3-6 months for full implementation. You\'ll see initial improvements in efficiency and collaboration within 2-4 weeks of starting the process.'
  },
  {
    question: 'What size teams benefit most from agile marketing?',
    answer: 'Agile marketing works for teams of all sizes, from solo marketers to large departments. Teams of 5-12 people see the most dramatic improvements, but we\'ve successfully transformed teams of 50+ members.'
  },
  {
    question: 'Do we need special tools for agile marketing?',
    answer: 'While specialized tools help, you can start with basic project management software like Trello or Asana. Advanced teams often use tools like Jira, Monday.com, or specialized agile marketing platforms.'
  },
  {
    question: 'How does agile marketing differ from traditional marketing?',
    answer: 'Agile marketing emphasizes rapid iteration, data-driven decisions, cross-functional collaboration, and customer feedback over long-term campaigns, hierarchical approval, and assumptions-based planning.'
  },
  {
    question: 'What are the main challenges in transformation?',
    answer: 'Common challenges include resistance to change, lack of data infrastructure, siloed departments, and inadequate training. Our transformation framework addresses each of these systematically.'
  },
  {
    question: 'Can agile marketing work with long-term brand campaigns?',
    answer: 'Absolutely! Agile marketing doesn\'t mean abandoning strategy. It means executing long-term strategies through shorter sprints with regular review points and adaptation opportunities.'
  }
]);

const transformationSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Transform Your Marketing Team with Agile Methodologies',
  description: 'Complete guide to implementing agile marketing practices for increased efficiency and better results',
  image: 'https://unitegroup.com.au/images/agile-marketing-transformation.jpg',
  totalTime: 'P3M',
  supply: [
    'Project management tools',
    'Analytics platforms',
    'Communication software',
    'Team collaboration tools'
  ],
  tool: [
    'Scrum framework',
    'Kanban boards',
    'Sprint planning templates',
    'Retrospective formats'
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Assess Current State',
      text: 'Evaluate existing marketing processes, team structure, and performance metrics',
      url: 'https://unitegroup.com.au/agile-marketing/transformation#assessment'
    },
    {
      '@type': 'HowToStep',
      name: 'Design Agile Framework',
      text: 'Create customized agile processes that fit your team and business needs',
      url: 'https://unitegroup.com.au/agile-marketing/transformation#framework'
    },
    {
      '@type': 'HowToStep',
      name: 'Implement Pilot Program',
      text: 'Start with a small team or specific campaign to test agile processes',
      url: 'https://unitegroup.com.au/agile-marketing/transformation#pilot'
    },
    {
      '@type': 'HowToStep',
      name: 'Scale and Optimize',
      text: 'Expand successful practices across the entire marketing organization',
      url: 'https://unitegroup.com.au/agile-marketing/transformation#scale'
    }
  ]
};

export default function AgileMarketingTransformationPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          breadcrumbs,
          faqs,
          transformationSchema
        ]}
      />
      
      <SubPillarTemplate
        title="Agile Marketing Transformation"
        subtitle="Complete Implementation Guide for Modern Marketing Teams"
        description="Transform your marketing organization with proven agile methodologies. Increase team velocity by 300%, improve campaign effectiveness, and build more responsive marketing operations."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 8, 2025" readTime="16" />}
        publishDate="January 21, 2025"
        readTime="20 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Agile Marketing', href: '/agile-marketing' },
          { name: 'Transformation', href: '/agile-marketing/transformation' }
        ]}
        parentPage={{ name: 'Agile Marketing', href: '/agile-marketing' }}
        mainContent={<TransformationContent />}
        sidebarContent={<TransformationSidebar />}
        primaryCTA={{
          text: 'Start Transformation Consultation',
          href: '/contact?service=agile-transformation'
        }}
        secondaryCTA={{
          text: 'Download Transformation Kit',
          href: '/downloads/agile-marketing-transformation-kit.pdf'
        }}
        showDownloadButton={true}
        downloadUrl="/downloads/agile-transformation-playbook.pdf"
        relatedPages={[
          {
            title: 'Agile Marketing Frameworks',
            description: 'Learn Scrum, Kanban, and hybrid methodologies for marketing',
            href: '/agile-marketing/frameworks',
            type: 'guide'
          },
          {
            title: 'Team Training Program',
            description: 'Comprehensive agile marketing training for your team',
            href: '/agile-marketing/team-training',
            type: 'resource'
          },
          {
            title: 'Growth Hacking Guide',
            description: 'Combine agile methods with growth strategies',
            href: '/growth-hacking/guide',
            type: 'guide'
          }
        ]}
      />
    </>
  );
}