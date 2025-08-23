import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SEO Audit Brisbane | Comprehensive Website Analysis & Optimization',
  description: 'Professional SEO audit services in Brisbane. Comprehensive website analysis, technical SEO review, content optimization, and actionable recommendations to improve search rankings.',
  keywords: [
    'SEO audit Brisbane',
    'website SEO analysis',
    'SEO audit services Australia',
    'technical SEO audit',
    'Brisbane SEO consultant',
    'website optimization audit',
    'SEO analysis Brisbane',
    'search engine optimization audit',
    'Queensland SEO services',
    'SEO audit report'
  ],
  url: '/competitive-analysis/seo-audit',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const SEOAuditContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Comprehensive SEO Audit</h2>
      
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Unlock your website's full potential with our comprehensive SEO audit. We analyze over 200 ranking factors 
          to identify opportunities for improvement, providing actionable recommendations that drive measurable results 
          for Brisbane businesses.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">200+</div>
          <div className="text-sm text-gray-400">Factors Analyzed</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">48hrs</div>
          <div className="text-sm text-gray-400">Report Delivery</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">90%</div>
          <div className="text-sm text-gray-400">Issues Identified</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">150%</div>
          <div className="text-sm text-gray-400">Avg Traffic Increase</div>
        </div>
      </div>
    </section>

    <section id="audit-components" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">OPTIMIZE Audit Framework</h2>
      
      <p className="text-lg text-gray-300 mb-6">
        Our OPTIMIZE framework ensures comprehensive analysis of all SEO factors that impact search performance:
      </p>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/20 to-transparent border-l-4 border-blue-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">On-Page SEO Analysis</h3>
          <p className="text-gray-300 mb-4">Comprehensive review of on-page optimization elements and content quality.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Content Analysis:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Title tag optimization</li>
                <li>• Meta description effectiveness</li>
                <li>• Header tag structure (H1-H6)</li>
                <li>• Keyword density and placement</li>
                <li>• Content quality and relevance</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Page Elements:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Image alt text optimization</li>
                <li>• Internal linking structure</li>
                <li>• URL structure analysis</li>
                <li>• Schema markup implementation</li>
                <li>• User experience signals</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Performance Testing</h3>
          <p className="text-gray-300 mb-4">Technical performance analysis including speed, mobile-friendliness, and core web vitals.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Speed Analysis:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Page load speed testing</li>
                <li>• Core Web Vitals assessment</li>
                <li>• Image optimization review</li>
                <li>• CSS and JavaScript minification</li>
                <li>• Caching implementation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Mobile & UX:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Mobile-first indexing readiness</li>
                <li>• Responsive design testing</li>
                <li>• Touch-friendly navigation</li>
                <li>• Viewport configuration</li>
                <li>• Mobile page speed</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Technical Infrastructure</h3>
          <p className="text-gray-300 mb-4">Deep technical analysis of website architecture and crawlability.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Crawlability:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• XML sitemap analysis</li>
                <li>• Robots.txt configuration</li>
                <li>• URL structure optimization</li>
                <li>• Canonical tag implementation</li>
                <li>• Redirect chain analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Technical Health:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 404 error detection</li>
                <li>• Broken link identification</li>
                <li>• SSL certificate status</li>
                <li>• Server response codes</li>
                <li>• Website security scan</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Indexing Assessment</h3>
          <p className="text-gray-300 mb-4">Analysis of how search engines discover, crawl, and index your website content.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">Search Console Data:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Index coverage analysis</li>
                <li>• Search query performance</li>
                <li>• Click-through rate optimization</li>
                <li>• Mobile usability issues</li>
                <li>• Manual action penalties</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">Visibility Metrics:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Keyword ranking positions</li>
                <li>• Featured snippet opportunities</li>
                <li>• Local search visibility</li>
                <li>• Brand search presence</li>
                <li>• SERP feature eligibility</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-900/20 to-transparent border-l-4 border-red-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Market Intelligence</h3>
          <p className="text-gray-300 mb-4">Competitive analysis and market opportunity identification.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Competitor Analysis:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Top competitor identification</li>
                <li>• Keyword gap analysis</li>
                <li>• Backlink profile comparison</li>
                <li>• Content strategy review</li>
                <li>• Technical implementation comparison</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Opportunity Mapping:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• High-value keyword opportunities</li>
                <li>• Content gap identification</li>
                <li>• Link building prospects</li>
                <li>• Local SEO opportunities</li>
                <li>• Voice search optimization</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-900/20 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Implementation Roadmap</h3>
          <p className="text-gray-300 mb-4">Prioritized action plan with clear implementation steps and timeline.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Priority Matrix:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• High impact, low effort fixes</li>
                <li>• Critical technical issues</li>
                <li>• Content optimization priorities</li>
                <li>• Long-term strategic initiatives</li>
                <li>• Resource allocation guidance</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Action Plan:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 30-day quick wins</li>
                <li>• 90-day improvement plan</li>
                <li>• 6-month strategic roadmap</li>
                <li>• Success metrics definition</li>
                <li>• Progress tracking guidelines</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-900/20 to-transparent border-l-4 border-cyan-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Excellence Benchmarking</h3>
          <p className="text-gray-300 mb-4">Performance benchmarking against industry standards and best practices.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">Performance Scoring:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Overall SEO health score</li>
                <li>• Technical performance grade</li>
                <li>• Content quality assessment</li>
                <li>• User experience rating</li>
                <li>• Competitive positioning</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">Industry Benchmarks:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Industry average comparisons</li>
                <li>• Best practice alignment</li>
                <li>• Performance percentile ranking</li>
                <li>• Improvement potential calculation</li>
                <li>• ROI projections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="tools" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">SEO Audit Tools & Technologies</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Professional Tools</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Screaming Frog SEO Spider</span>
              <span className="text-green-400 text-sm">Technical</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SEMrush Site Audit</span>
              <span className="text-blue-400 text-sm">Comprehensive</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Ahrefs Site Explorer</span>
              <span className="text-purple-400 text-sm">Backlinks</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Google Search Console</span>
              <span className="text-yellow-400 text-sm">Official</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">PageSpeed Insights</span>
              <span className="text-orange-400 text-sm">Performance</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Analysis Capabilities</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Technical SEO Issues</span>
              <span className="text-green-400 text-sm">200+ Checks</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Content Analysis</span>
              <span className="text-blue-400 text-sm">AI-Powered</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Competitor Research</span>
              <span className="text-purple-400 text-sm">Multi-Domain</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Keyword Tracking</span>
              <span className="text-yellow-400 text-sm">Real-Time</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Performance Monitoring</span>
              <span className="text-orange-400 text-sm">Continuous</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="sample-findings" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Sample Audit Findings</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6">Brisbane Law Firm Case Study</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="text-3xl font-bold text-red-400 mb-2">23</div>
            <div className="text-sm text-gray-400">Critical Issues Found</div>
          </div>
          <div className="text-center p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="text-3xl font-bold text-yellow-400 mb-2">67</div>
            <div className="text-sm text-gray-400">Optimization Opportunities</div>
          </div>
          <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="text-3xl font-bold text-green-400 mb-2">180%</div>
            <div className="text-sm text-gray-400">Projected Traffic Increase</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-red-300 mb-2">Critical Issues Identified:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Missing title tags on 15 key practice area pages</li>
              <li>• 3.2 second page load speed (industry standard: under 2 seconds)</li>
              <li>• 45 pages with duplicate meta descriptions</li>
              <li>• No schema markup for attorney profiles and reviews</li>
              <li>• Missing local business optimization</li>
            </ul>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-green-300 mb-2">High-Impact Recommendations:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Implement attorney and law firm schema markup (estimated 40% CTR increase)</li>
              <li>• Optimize Core Web Vitals (projected 25% ranking improvement)</li>
              <li>• Create practice area landing pages for high-value keywords</li>
              <li>• Develop local citation strategy for Brisbane legal market</li>
              <li>• Implement FAQ schema for common legal questions</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-2xl border border-orange-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Optimize Your Website?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get a comprehensive SEO audit that reveals hidden opportunities and provides a clear roadmap to improve your search rankings.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=seo-audit"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-300"
        >
          Get SEO Audit
        </a>
        <a
          href="/downloads/seo-audit-sample.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          View Sample Report
        </a>
      </div>
    </section>
  </article>
);

const SEOAuditSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">OPTIMIZE Framework</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">O</div>
          <span className="text-gray-300 text-sm">On-Page Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>
          <span className="text-gray-300 text-sm">Performance Testing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
          <span className="text-gray-300 text-sm">Technical Infrastructure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
          <span className="text-gray-300 text-sm">Indexing Assessment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
          <span className="text-gray-300 text-sm">Market Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
          <span className="text-gray-300 text-sm">Implementation Plan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Z</div>
          <span className="text-gray-300 text-sm">Zero-to-Excellence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">E</div>
          <span className="text-gray-300 text-sm">Excellence Benchmarking</span>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 border border-orange-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Free SEO Audit</h3>
      <p className="text-gray-300 text-sm mb-4">
        Get a comprehensive SEO audit report with actionable recommendations to improve your Brisbane website's search performance.
      </p>
      <button className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-300">
        Get Free Audit
      </button>
    </div>
  </div>
);

export default function SEOAuditPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Competitive Analysis', url: '/competitive-analysis' },
            { name: 'SEO Audit', url: '/competitive-analysis/seo-audit' }
          ]),
          generateFAQSchema([
            {
              question: 'How long does an SEO audit take?',
              answer: 'A comprehensive SEO audit typically takes 48-72 hours to complete. We analyze over 200 ranking factors and provide a detailed report with prioritized recommendations.'
            },
            {
              question: 'What\'s included in the SEO audit report?',
              answer: 'Our audit includes technical analysis, on-page optimization review, performance testing, competitor analysis, and a prioritized action plan with implementation timelines.'
            }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="SEO Audit"
        subtitle="Comprehensive Website Analysis & Optimization"
        description="Professional SEO audit services that identify optimization opportunities and provide actionable recommendations to improve your website's search engine performance and rankings."
        author="Unite Group Agency"
        publishDate="January 21, 2025"
        readTime="18 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Competitive Analysis', href: '/competitive-analysis' },
          { name: 'SEO Audit', href: '/competitive-analysis/seo-audit' }
        ]}
        parentPage={{ name: 'Competitive Analysis', href: '/competitive-analysis' }}
        mainContent={<SEOAuditContent />}
        sidebarContent={<SEOAuditSidebar />}
        primaryCTA={{
          text: 'Get Free SEO Audit',
          href: '/contact?service=seo-audit'
        }}
        relatedPages={[
          {
            title: 'Competitive Benchmarking',
            description: 'Strategic market analysis and intelligence',
            href: '/competitive-analysis/benchmarking',
            type: 'guide'
          },
          {
            title: 'Competitive Tracker',
            description: 'Monitor competitor activities and changes',
            href: '/competitive-analysis/tracker',
            type: 'tool'
          }
        ]}
      />
    </>
  );
}