import { Metadata } from 'next';
import { generateSEOMetadata, generateServiceSchema, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import TrainingContent from './components/TrainingContent';
import TrainingSidebar from './components/TrainingSidebar';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Agile Marketing Team Training Brisbane | Build High-Performing Teams',
  description: 'Transform your marketing team with comprehensive agile training programs. Workshops, coaching, and certification for Brisbane marketing professionals.',
  keywords: [
    'agile marketing training Brisbane',
    'marketing team development',
    'agile marketing workshop',
    'scrum marketing training',
    'marketing team coaching',
    'agile marketing certification',
    'Brisbane marketing education',
    'team building workshops',
    'marketing skills development',
    'agile marketing courses'
  ],
  url: '/agile-marketing/team-training',
  type: 'article'
});

const trainingService = generateServiceSchema({
  name: 'Agile Marketing Team Training',
  description: 'Comprehensive training programs to build agile marketing capabilities within your team through workshops, coaching, and hands-on practice.',
  provider: 'Unite Group Agency',
  areaServed: 'Brisbane, Queensland, Australia',
  hasOfferCatalog: {
    name: 'Training Programs',
    itemListElement: [
      {
        name: 'Agile Marketing Fundamentals Workshop',
        description: 'Introduction to agile principles and practices for marketing teams'
      },
      {
        name: 'Scrum Master Certification',
        description: 'Certified training program for marketing Scrum Masters'
      },
      {
        name: 'Team Coaching Program',
        description: 'Ongoing coaching and mentorship for agile marketing adoption'
      },
      {
        name: 'Leadership Training',
        description: 'Training marketing leaders to support agile transformation'
      }
    ]
  }
});

const faqs = generateFAQSchema([
  {
    question: 'What training programs do you offer for agile marketing teams?',
    answer: 'We offer comprehensive training including Agile Marketing Fundamentals workshops, Scrum Master certification, ongoing team coaching, leadership training, and custom programs tailored to your specific needs and industry.'
  },
  {
    question: 'How long does agile marketing training take?',
    answer: 'Training duration varies by program. Our workshops range from half-day sessions to 3-day intensives. Certification programs typically take 2-3 weeks, while ongoing coaching can extend 3-6 months for sustained transformation.'
  },
  {
    question: 'Do you provide certification for agile marketing?',
    answer: 'Yes, we offer certified training programs including Scrum Master for Marketing, Agile Marketing Professional, and custom certifications. Our programs are recognized by industry bodies and include practical assessments.'
  }
]);

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Agile Marketing', url: '/agile-marketing' },
  { name: 'Team Training', url: '/agile-marketing/team-training' }
]);

const relatedPages = [
  {
    title: 'Agile Marketing Frameworks',
    description: 'Learn about Scrum, Kanban, and Lean methodologies for marketing',
    href: '/agile-marketing/frameworks',
    type: 'guide' as const
  },
  {
    title: 'Agile Transformation',
    description: 'Complete organizational change management for agile adoption',
    href: '/agile-marketing/transformation',
    type: 'guide' as const
  },
  {
    title: 'Growth Hacking Workshop',
    description: 'Hands-on training in rapid experimentation techniques',
    href: '/growth-hacking/workshop',
    type: 'resource' as const
  }
];

export default function AgileMarketingTeamTrainingPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          trainingService,
          faqs,
          breadcrumbs
        ]}
      />
      
      <SubPillarTemplate
        title="Agile Marketing Team Training"
        subtitle="Build High-Performing Marketing Teams"
        description="Transform your marketing team with comprehensive agile training programs. From fundamentals to advanced certification, our training builds the skills and mindset needed for agile marketing success."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 10, 2025" readTime="14" />}
        publishDate="January 2025"
        readTime="10 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Agile Marketing', href: '/agile-marketing' },
          { name: 'Team Training', href: '/agile-marketing/team-training' }
        ]}
        parentPage={{ name: 'Agile Marketing', href: '/agile-marketing' }}
        mainContent={<TrainingContent />}
        sidebarContent={<TrainingSidebar />}
        relatedPages={relatedPages}
        primaryCTA={{
          text: 'Book Training Session',
          href: '/contact'
        }}
        secondaryCTA={{
          text: 'View Schedule',
          href: '/agile-marketing/team-training/schedule'
        }}
        showTableOfContents={true}
        showSocialShare={true}
        showDownloadButton={true}
        downloadUrl="/agile-marketing-training-brochure.pdf"
      />
    </>
  );
}