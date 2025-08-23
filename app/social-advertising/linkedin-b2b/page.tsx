import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'LinkedIn B2B Advertising Brisbane | Professional Lead Generation',
  description: 'Master LinkedIn B2B advertising with proven strategies for Brisbane businesses. Advanced targeting, campaign optimization, and lead generation tactics that deliver qualified prospects.',
  keywords: [
    'LinkedIn B2B advertising Brisbane',
    'LinkedIn ads Australia',
    'B2B lead generation Brisbane',
    'LinkedIn marketing Brisbane',
    'professional advertising Brisbane',
    'B2B social advertising',
    'LinkedIn campaign management',
    'Queensland B2B marketing',
    'LinkedIn targeting strategies',
    'business lead generation'
  ],
  url: '/social-advertising/linkedin-b2b',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const LinkedInContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">LinkedIn B2B Advertising Mastery</h2>
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          LinkedIn is the ultimate platform for B2B advertising, offering unparalleled professional targeting 
          capabilities. With our proven strategies, Brisbane businesses achieve 5x higher conversion rates 
          compared to other social platforms for B2B campaigns.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">5x</div>
          <div className="text-sm text-gray-400">Higher B2B Conv Rate</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">80%</div>
          <div className="text-sm text-gray-400">B2B Marketers Use LinkedIn</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">3x</div>
          <div className="text-sm text-gray-400">Lower CPA for B2B</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">90%</div>
          <div className="text-sm text-gray-400">Lead Quality Score</div>
        </div>
      </div>
    </section>

    <section id="targeting" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Advanced B2B Targeting Strategies</h2>
      
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Professional Targeting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Job Function Targeting</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• C-level executives and decision makers</li>
                <li>• Department heads and managers</li>
                <li>• Specific job titles and seniority levels</li>
                <li>• Years of experience ranges</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Company Targeting</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Industry and company size filters</li>
                <li>• Fortune 500 and growth companies</li>
                <li>• Geographic and location targeting</li>
                <li>• Technology stack and tools used</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Account-Based Marketing (ABM)</h3>
          <p className="text-gray-300 mb-4">
            LinkedIn's Matched Audiences feature enables precise ABM campaigns targeting specific companies 
            and contact lists with personalized messaging.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-blue-300 mb-2">Contact Targeting</h5>
              <p className="text-sm text-gray-400">Upload specific contact lists for precision targeting</p>
            </div>
            <div className="bg-purple-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-purple-300 mb-2">Website Retargeting</h5>
              <p className="text-sm text-gray-400">Target visitors who engaged with your content</p>
            </div>
            <div className="bg-green-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-green-300 mb-2">Lookalike Audiences</h5>
              <p className="text-sm text-gray-400">Find similar professionals to your best customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="campaigns" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">High-Converting Campaign Types</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Sponsored Content</h3>
          <p className="text-gray-300 mb-4">Native advertising that appears in LinkedIn feeds with high engagement rates.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Single image ads for brand awareness</li>
            <li>• Video ads for thought leadership</li>
            <li>• Carousel ads for product showcases</li>
            <li>• Event ads for webinar promotion</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Sponsored InMail</h3>
          <p className="text-gray-300 mb-4">Direct messaging campaigns with personalized content delivery.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Personalized sales outreach</li>
            <li>• Event invitations and webinars</li>
            <li>• Content downloads and whitepapers</li>
            <li>• Meeting booking and consultations</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Lead Gen Forms</h3>
          <p className="text-gray-300 mb-4">Pre-filled forms that capture leads without leaving LinkedIn.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Auto-populated contact information</li>
            <li>• Custom questions for qualification</li>
            <li>• CRM integration for instant follow-up</li>
            <li>• Mobile-optimized form experience</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Dynamic Ads</h3>
          <p className="text-gray-300 mb-4">Personalized ads that adapt to each viewer's profile information.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Follower ads for company page growth</li>
            <li>• Spotlight ads for personalized offers</li>
            <li>• Job ads for recruitment campaigns</li>
            <li>• Content ads for engagement</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-blue-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Generate Quality B2B Leads?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get expert LinkedIn B2B advertising management that delivers qualified prospects for your Brisbane business.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=linkedin-b2b"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          Start B2B Campaign
        </a>
        <a
          href="/downloads/linkedin-b2b-guide.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          Download B2B Guide
        </a>
      </div>
    </section>
  </article>
);

const LinkedInSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">LinkedIn B2B Stats</h3>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Avg B2B Conv Rate:</span>
          <span className="text-blue-400 font-semibold">6.1%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg CPC:</span>
          <span className="text-green-400 font-semibold">$5.26</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Lead Quality:</span>
          <span className="text-purple-400 font-semibold">90%+</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">B2B Reach:</span>
          <span className="text-yellow-400 font-semibold">900M+</span>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Get B2B Campaign Audit</h3>
      <p className="text-gray-300 text-sm mb-4">
        Free analysis of your current LinkedIn advertising performance with improvement recommendations.
      </p>
      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
        Request Free Audit
      </button>
    </div>
  </div>
);

export default function LinkedInB2BPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Social Advertising', url: '/social-advertising' },
            { name: 'LinkedIn B2B', url: '/social-advertising/linkedin-b2b' }
          ]),
          generateFAQSchema([
            {
              question: 'What makes LinkedIn better for B2B advertising?',
              answer: 'LinkedIn offers precise professional targeting, higher B2B conversion rates, and access to decision-makers that other platforms cannot match.'
            }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="LinkedIn B2B Advertising"
        subtitle="Professional Lead Generation for Brisbane Businesses"
        description="Master LinkedIn B2B advertising with proven strategies that generate qualified prospects. Advanced targeting, campaign optimization, and lead generation tactics for maximum ROI."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 10, 2025" readTime="18" />}
        publishDate="January 21, 2025"
        readTime="16 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Social Advertising', href: '/social-advertising' },
          { name: 'LinkedIn B2B', href: '/social-advertising/linkedin-b2b' }
        ]}
        parentPage={{ name: 'Social Advertising', href: '/social-advertising' }}
        mainContent={<LinkedInContent />}
        sidebarContent={<LinkedInSidebar />}
        primaryCTA={{
          text: 'Start B2B Campaign',
          href: '/contact?service=linkedin-b2b'
        }}
        relatedPages={[
          {
            title: 'Facebook Ads Management',
            description: 'Expert Facebook advertising strategies',
            href: '/social-advertising/facebook-ads',
            type: 'guide'
          },
          {
            title: 'ROI Calculator',
            description: 'Calculate social advertising ROI',
            href: '/social-advertising/roi-calculator',
            type: 'tool'
          }
        ]}
      />
    </>
  );
}