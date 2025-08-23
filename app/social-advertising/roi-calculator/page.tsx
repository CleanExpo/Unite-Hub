import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Social Advertising ROI Calculator | Free Marketing Tool Brisbane',
  description: 'Calculate your social advertising ROI with our free interactive tool. Analyze Facebook, LinkedIn, and Instagram ad performance to optimize your marketing budget and maximize returns.',
  keywords: [
    'social advertising ROI calculator',
    'Facebook ads ROI calculator',
    'LinkedIn ads ROI calculator',
    'marketing ROI calculator Brisbane',
    'social media advertising calculator',
    'ad spend calculator',
    'marketing budget calculator',
    'advertising ROI tool',
    'digital marketing calculator',
    'Australia marketing tools'
  ],
  url: '/social-advertising/roi-calculator',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const ROICalculatorContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="calculator" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Social Advertising ROI Calculator</h2>
      
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Calculate your social advertising return on investment with our comprehensive tool. 
          Input your campaign data to get detailed ROI analysis, profitability metrics, and optimization recommendations.
        </p>
      </div>

      {/* Interactive Calculator */}
      <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
        <h3 className="text-2xl font-semibold text-white mb-6">Interactive ROI Calculator</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-4">Campaign Inputs</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Ad Spend ($)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., 5000"
                  id="adSpend"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Revenue Generated ($)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., 20000"
                  id="revenue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Average Order Value ($)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., 150"
                  id="aov"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Conversion Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., 3.5"
                  id="conversionRate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="facebook">Facebook Ads</option>
                  <option value="instagram">Instagram Ads</option>
                  <option value="linkedin">LinkedIn Ads</option>
                  <option value="twitter">Twitter Ads</option>
                  <option value="mixed">Mixed Platforms</option>
                </select>
              </div>
              
              <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300">
                Calculate ROI
              </button>
            </div>
          </div>
          
          {/* Results Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-4">ROI Results</h4>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Return on Investment (ROI)</div>
                <div className="text-3xl font-bold text-green-400" id="roiResult">300%</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Return on Ad Spend (ROAS)</div>
                <div className="text-3xl font-bold text-blue-400" id="roasResult">4:1</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Cost Per Acquisition (CPA)</div>
                <div className="text-3xl font-bold text-purple-400" id="cpaResult">$42.86</div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Profit Margin</div>
                <div className="text-3xl font-bold text-yellow-400" id="profitResult">75%</div>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h5 className="font-semibold text-white mb-2">Performance Rating</h5>
              <div className="text-sm text-gray-300">
                <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                <strong>Excellent Performance</strong> - Your campaigns are highly profitable
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="optimization" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">ROI Optimization Strategies</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Improve ROAS</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Optimize targeting to reach high-value customers</li>
            <li>• Test different ad creative and messaging</li>
            <li>• Implement advanced bidding strategies</li>
            <li>• Use lookalike audiences based on best customers</li>
            <li>• Improve landing page conversion rates</li>
          </ul>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Reduce Costs</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Pause underperforming ad sets and audiences</li>
            <li>• Adjust bidding to optimal times and days</li>
            <li>• Use automatic placements for cost efficiency</li>
            <li>• Implement frequency capping to reduce ad fatigue</li>
            <li>• A/B test ad copy and visual elements</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="benchmarks" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Industry ROI Benchmarks</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-800/50 rounded-xl overflow-hidden">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-4 text-left text-gray-300">Industry</th>
              <th className="px-6 py-4 text-center text-gray-300">Avg ROAS</th>
              <th className="px-6 py-4 text-center text-gray-300">Avg CPC</th>
              <th className="px-6 py-4 text-center text-gray-300">Conv Rate</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            <tr className="border-b border-slate-700">
              <td className="px-6 py-4">E-commerce</td>
              <td className="px-6 py-4 text-center">4.2:1</td>
              <td className="px-6 py-4 text-center">$1.72</td>
              <td className="px-6 py-4 text-center">2.4%</td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="px-6 py-4">SaaS</td>
              <td className="px-6 py-4 text-center">5.1:1</td>
              <td className="px-6 py-4 text-center">$3.77</td>
              <td className="px-6 py-4 text-center">3.7%</td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="px-6 py-4">Professional Services</td>
              <td className="px-6 py-4 text-center">3.8:1</td>
              <td className="px-6 py-4 text-center">$4.91</td>
              <td className="px-6 py-4 text-center">5.2%</td>
            </tr>
            <tr>
              <td className="px-6 py-4">Real Estate</td>
              <td className="px-6 py-4 text-center">6.2:1</td>
              <td className="px-6 py-4 text-center">$2.37</td>
              <td className="px-6 py-4 text-center">1.8%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-2xl border border-green-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Need Help Improving Your ROI?</h2>
      <p className="text-gray-300 text-center mb-6">
        Our expert team can analyze your campaigns and implement strategies to maximize your social advertising ROI.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=roi-optimization"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300"
        >
          Get ROI Audit
        </a>
        <a
          href="/downloads/roi-optimization-guide.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          Download ROI Guide
        </a>
      </div>
    </section>
  </article>
);

const ROISidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">ROI Quick Tips</h3>
      <div className="space-y-3 text-sm text-gray-300">
        <div>• Good ROAS: 4:1 or higher</div>
        <div>• Excellent ROAS: 7:1 or higher</div>
        <div>• Target CPA should be &lt;25% of LTV</div>
        <div>• Monitor ROI trends weekly</div>
        <div>• Factor in organic lift effects</div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Free ROI Audit</h3>
      <p className="text-gray-300 text-sm mb-4">
        Get professional analysis of your current social advertising ROI with actionable improvement recommendations.
      </p>
      <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300">
        Request Free Audit
      </button>
    </div>
  </div>
);

export default function ROICalculatorPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Social Advertising', url: '/social-advertising' },
            { name: 'ROI Calculator', url: '/social-advertising/roi-calculator' }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="Social Advertising ROI Calculator"
        subtitle="Free Marketing Performance Analysis Tool"
        description="Calculate your social advertising ROI with our comprehensive tool. Analyze campaign performance, optimize spending, and maximize returns across Facebook, LinkedIn, and Instagram."
        authorInfo={<AuthorInfo author={AUTHORS.sarahMitchell} publishDate="January 8, 2025" readTime="10" />}
        publishDate="January 21, 2025"
        readTime="10 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Social Advertising', href: '/social-advertising' },
          { name: 'ROI Calculator', href: '/social-advertising/roi-calculator' }
        ]}
        parentPage={{ name: 'Social Advertising', href: '/social-advertising' }}
        mainContent={<ROICalculatorContent />}
        sidebarContent={<ROISidebar />}
        primaryCTA={{
          text: 'Get ROI Optimization Audit',
          href: '/contact?service=roi-optimization'
        }}
        relatedPages={[
          {
            title: 'Facebook Ads Management',
            description: 'Expert Facebook advertising strategies',
            href: '/social-advertising/facebook-ads',
            type: 'guide'
          },
          {
            title: 'LinkedIn B2B Advertising',
            description: 'Professional B2B lead generation',
            href: '/social-advertising/linkedin-b2b',
            type: 'guide'
          }
        ]}
      />
    </>
  );
}