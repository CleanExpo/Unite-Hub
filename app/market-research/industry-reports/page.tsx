import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Industry Reports & Market Analysis Brisbane | Professional Research',
  description: 'Comprehensive industry reports and market analysis for Brisbane businesses. Professional research, trend analysis, and strategic insights to drive informed business decisions.',
  keywords: [
    'industry reports Brisbane',
    'market analysis Australia',
    'market research reports',
    'industry analysis Brisbane',
    'business intelligence reports',
    'market trends Australia',
    'competitive intelligence Brisbane',
    'market sizing analysis',
    'industry insights Queensland',
    'business research Brisbane'
  ],
  url: '/market-research/industry-reports',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const IndustryReportsContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Industry Reports & Market Analysis</h2>
      
      <div className="bg-gradient-to-r from-teal-500/10 to-green-500/10 border border-teal-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Make informed business decisions with comprehensive industry reports and market analysis. Our research 
          team provides deep insights into market trends, competitive landscapes, and growth opportunities 
          specifically tailored for Australian businesses.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">50+</div>
          <div className="text-sm text-gray-400">Industries Covered</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">95%</div>
          <div className="text-sm text-gray-400">Accuracy Rate</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">72hrs</div>
          <div className="text-sm text-gray-400">Report Delivery</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">500+</div>
          <div className="text-sm text-gray-400">Data Sources</div>
        </div>
      </div>
    </section>

    <section id="report-types" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Types of Industry Reports</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Market Sizing Reports</h3>
          <p className="text-gray-300 mb-4">Comprehensive analysis of total addressable market (TAM) and market opportunities.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Total Addressable Market (TAM) analysis</li>
            <li>• Serviceable Available Market (SAM) calculation</li>
            <li>• Market growth rate projections</li>
            <li>• Geographic market segmentation</li>
            <li>• Revenue opportunity assessment</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Competitive Landscape</h3>
          <p className="text-gray-300 mb-4">Detailed analysis of competitors, market share, and competitive positioning.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Competitor profiling and analysis</li>
            <li>• Market share distribution</li>
            <li>• Competitive positioning maps</li>
            <li>• SWOT analysis of key players</li>
            <li>• Competitive threats assessment</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Trend Analysis</h3>
          <p className="text-gray-300 mb-4">Forward-looking analysis of industry trends and emerging opportunities.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Emerging technology trends</li>
            <li>• Consumer behavior shifts</li>
            <li>• Regulatory and policy changes</li>
            <li>• Seasonal pattern analysis</li>
            <li>• Future market predictions</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Customer Insights</h3>
          <p className="text-gray-300 mb-4">Deep dive into customer behavior, preferences, and purchasing patterns.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Customer segmentation analysis</li>
            <li>• Buying behavior patterns</li>
            <li>• Price sensitivity studies</li>
            <li>• Brand perception research</li>
            <li>• Customer satisfaction metrics</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="methodology" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Research Methodology</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Primary Research</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Executive interviews and surveys</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Customer focus groups</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Industry expert consultations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">Market observation studies</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Secondary Research</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-gray-300">Government statistical data</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span className="text-gray-300">Industry association reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-gray-300">Public company financials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-gray-300">Academic research papers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="featured-reports" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Featured Industry Reports 2025</h2>
      
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Digital Marketing Industry Australia 2025</h3>
              <p className="text-gray-400">Comprehensive analysis of the $8.2B digital marketing market</p>
            </div>
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">NEW</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">$8.2B</div>
              <div className="text-xs text-gray-400">Market Size</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">12.3%</div>
              <div className="text-xs text-gray-400">CAGR</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">2,500+</div>
              <div className="text-xs text-gray-400">Companies</div>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            In-depth analysis covering social media marketing, search advertising, content marketing, 
            and emerging technologies like AI and automation in the Australian market.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Download Executive Summary
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Brisbane Technology Sector Report</h3>
              <p className="text-gray-400">Local technology market analysis and growth opportunities</p>
            </div>
            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">REGIONAL</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">$2.1B</div>
              <div className="text-xs text-gray-400">Market Value</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">15.7%</div>
              <div className="text-xs text-gray-400">Growth Rate</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-white">450+</div>
              <div className="text-xs text-gray-400">Startups</div>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Detailed analysis of Brisbane's technology ecosystem including fintech, healthtech, 
            and emerging sectors with investment trends and growth projections.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Request Full Report
          </button>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-teal-900/30 to-green-900/30 rounded-2xl border border-teal-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Need Custom Industry Research?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get tailored industry reports and market analysis that provide the insights you need to make strategic business decisions.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=industry-reports"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-300"
        >
          Request Custom Report
        </a>
        <a
          href="/downloads/sample-industry-report.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          View Sample Report
        </a>
      </div>
    </section>
  </article>
);

const IndustryReportsSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Report Features</h3>
      <div className="space-y-3 text-sm text-gray-300">
        <div>• Executive summary with key findings</div>
        <div>• Market size and growth projections</div>
        <div>• Competitive landscape analysis</div>
        <div>• Industry trend identification</div>
        <div>• Strategic recommendations</div>
        <div>• Data visualizations and charts</div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-teal-900/30 to-green-900/30 border border-teal-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Get Custom Research</h3>
      <p className="text-gray-300 text-sm mb-4">
        Tailored industry analysis and market research designed specifically for your business needs and market position.
      </p>
      <button className="w-full bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-300">
        Request Quote
      </button>
    </div>
  </div>
);

export default function IndustryReportsPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Market Research', url: '/market-research' },
            { name: 'Industry Reports', url: '/market-research/industry-reports' }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="Industry Reports & Market Analysis"
        subtitle="Professional Research & Strategic Insights"
        description="Comprehensive industry reports and market analysis for informed business decisions. Professional research, competitive intelligence, and trend analysis for Brisbane businesses."
        author="Unite Group Agency"
        publishDate="January 21, 2025"
        readTime="14 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Market Research', href: '/market-research' },
          { name: 'Industry Reports', href: '/market-research/industry-reports' }
        ]}
        parentPage={{ name: 'Market Research', href: '/market-research' }}
        mainContent={<IndustryReportsContent />}
        sidebarContent={<IndustryReportsSidebar />}
        primaryCTA={{
          text: 'Request Custom Report',
          href: '/contact?service=industry-reports'
        }}
        relatedPages={[
          {
            title: 'Buyer Persona Development',
            description: 'Data-driven customer research and insights',
            href: '/market-research/persona-development',
            type: 'guide'
          },
          {
            title: 'Survey Tools',
            description: 'Professional survey design and analysis',
            href: '/market-research/surveys',
            type: 'tool'
          }
        ]}
      />
    </>
  );
}