import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Market Research Surveys Brisbane | Professional Survey Design & Analysis',
  description: 'Professional market research surveys and analysis for Brisbane businesses. Custom survey design, data collection, statistical analysis, and actionable insights for strategic decisions.',
  keywords: [
    'market research surveys Brisbane',
    'survey design Australia',
    'customer research surveys',
    'market research tools Brisbane',
    'survey analysis Brisbane',
    'customer feedback surveys',
    'market research methodology',
    'survey data analysis',
    'Brisbane market research',
    'professional surveys Australia'
  ],
  url: '/market-research/surveys',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const SurveysContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Market Research Surveys</h2>
      
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Gather actionable customer insights with professionally designed market research surveys. Our comprehensive 
          survey solutions provide the data you need to make informed business decisions and understand your market better.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">85%</div>
          <div className="text-sm text-gray-400">Avg Response Rate</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">48hrs</div>
          <div className="text-sm text-gray-400">Setup Time</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">1000+</div>
          <div className="text-sm text-gray-400">Surveys Completed</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">95%</div>
          <div className="text-sm text-gray-400">Data Accuracy</div>
        </div>
      </div>
    </section>

    <section id="survey-types" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Survey Types & Applications</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Customer Satisfaction Surveys</h3>
          <p className="text-gray-300 mb-4">Measure customer satisfaction and identify improvement opportunities.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Net Promoter Score (NPS) measurement</li>
            <li>• Customer effort score analysis</li>
            <li>• Service quality evaluation</li>
            <li>• Product satisfaction assessment</li>
            <li>• Loyalty and retention insights</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Market Entry Research</h3>
          <p className="text-gray-300 mb-4">Assess market viability before launching new products or services.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Market demand validation</li>
            <li>• Price sensitivity analysis</li>
            <li>• Competitive positioning research</li>
            <li>• Target audience identification</li>
            <li>• Channel preference studies</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Brand Perception Studies</h3>
          <p className="text-gray-300 mb-4">Understand how your brand is perceived in the marketplace.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Brand awareness measurement</li>
            <li>• Brand association analysis</li>
            <li>• Competitive brand comparison</li>
            <li>• Brand equity assessment</li>
            <li>• Message effectiveness testing</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Product Development Research</h3>
          <p className="text-gray-300 mb-4">Gather insights to guide product development and innovation.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Feature importance ranking</li>
            <li>• Concept testing and validation</li>
            <li>• User experience feedback</li>
            <li>• Product improvement suggestions</li>
            <li>• Innovation opportunity identification</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="methodology" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">SURVEY Design Methodology</h2>
      
      <p className="text-lg text-gray-300 mb-6">
        Our SURVEY methodology ensures high-quality data collection and actionable insights:
      </p>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/20 to-transparent border-l-4 border-blue-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Strategy Development</h3>
          <p className="text-gray-300 mb-4">Define research objectives and survey strategy aligned with business goals.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Planning Phase:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Research objectives definition</li>
                <li>• Target audience identification</li>
                <li>• Sample size calculation</li>
                <li>• Timeline and budget planning</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Success Metrics:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Response rate targets</li>
                <li>• Data quality standards</li>
                <li>• Statistical significance levels</li>
                <li>• Actionability requirements</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">User-Centered Design</h3>
          <p className="text-gray-300 mb-4">Create surveys that are engaging and easy to complete for higher response rates.</p>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h5 className="font-semibold text-white mb-2">Design Principles</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h6 className="text-xs font-semibold text-purple-300 mb-1">Clarity</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Simple language</li>
                  <li>• Clear instructions</li>
                  <li>• Logical flow</li>
                </ul>
              </div>
              <div>
                <h6 className="text-xs font-semibold text-purple-300 mb-1">Engagement</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Visual elements</li>
                  <li>• Progress indicators</li>
                  <li>• Interactive features</li>
                </ul>
              </div>
              <div>
                <h6 className="text-xs font-semibold text-purple-300 mb-1">Efficiency</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Optimal length</li>
                  <li>• Smart branching</li>
                  <li>• Mobile optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Response Collection</h3>
          <p className="text-gray-300 mb-4">Deploy surveys across multiple channels to maximize response rates.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Distribution Channels:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Email campaigns</li>
                <li>• Social media platforms</li>
                <li>• Website integration</li>
                <li>• Mobile applications</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Optimization Tactics:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Timing optimization</li>
                <li>• Reminder sequences</li>
                <li>• Incentive programs</li>
                <li>• A/B tested invitations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Validation & Quality Control</h3>
          <p className="text-gray-300 mb-4">Ensure data quality through comprehensive validation and cleaning processes.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">Data Validation:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Response consistency checks</li>
                <li>• Completion time analysis</li>
                <li>• Duplicate response detection</li>
                <li>• Quality score assignment</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">Cleaning Process:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Outlier identification</li>
                <li>• Missing data handling</li>
                <li>• Bias correction</li>
                <li>• Statistical weighting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-900/20 to-transparent border-l-4 border-red-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Expert Analysis</h3>
          <p className="text-gray-300 mb-4">Transform raw data into actionable insights through professional analysis.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Statistical Analysis:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Descriptive statistics</li>
                <li>• Correlation analysis</li>
                <li>• Regression modeling</li>
                <li>• Significance testing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Insight Generation:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Pattern identification</li>
                <li>• Trend analysis</li>
                <li>• Segmentation insights</li>
                <li>• Recommendation development</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-900/20 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Yield Actionable Results</h3>
          <p className="text-gray-300 mb-4">Deliver comprehensive reports with clear recommendations and next steps.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Report Components:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Executive summary</li>
                <li>• Key findings highlights</li>
                <li>• Data visualizations</li>
                <li>• Detailed methodology</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Action Planning:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Strategic recommendations</li>
                <li>• Implementation roadmap</li>
                <li>• Success metrics</li>
                <li>• Follow-up research plans</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="tools" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Survey Tools & Technologies</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Survey Platforms</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Qualtrics Enterprise</span>
              <span className="text-green-400 text-sm">Advanced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SurveyMonkey Premier</span>
              <span className="text-blue-400 text-sm">Professional</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Typeform Pro</span>
              <span className="text-purple-400 text-sm">Engaging</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Google Forms</span>
              <span className="text-yellow-400 text-sm">Basic</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Analysis Tools</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SPSS Statistical Suite</span>
              <span className="text-green-400 text-sm">Advanced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">R Programming</span>
              <span className="text-blue-400 text-sm">Flexible</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tableau Visualization</span>
              <span className="text-purple-400 text-sm">Visual</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Excel Advanced Analytics</span>
              <span className="text-yellow-400 text-sm">Accessible</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-2xl border border-emerald-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Gather Customer Insights?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get professional market research surveys that deliver actionable insights for your Brisbane business.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=market-research-surveys"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
        >
          Start Survey Project
        </a>
        <a
          href="/downloads/survey-design-guide.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          Download Guide
        </a>
      </div>
    </section>
  </article>
);

const SurveysSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">SURVEY Method</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
          <span className="text-gray-300 text-sm">Strategy Development</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">U</div>
          <span className="text-gray-300 text-sm">User-Centered Design</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
          <span className="text-gray-300 text-sm">Response Collection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
          <span className="text-gray-300 text-sm">Validation & Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">E</div>
          <span className="text-gray-300 text-sm">Expert Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Y</div>
          <span className="text-gray-300 text-sm">Yield Results</span>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Get Survey Quote</h3>
      <p className="text-gray-300 text-sm mb-4">
        Custom market research survey design and analysis tailored to your specific research objectives and budget.
      </p>
      <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300">
        Request Quote
      </button>
    </div>
  </div>
);

export default function SurveysPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Market Research', url: '/market-research' },
            { name: 'Surveys', url: '/market-research/surveys' }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="Market Research Surveys"
        subtitle="Professional Survey Design & Analysis"
        description="Professional market research surveys that deliver actionable customer insights. Custom survey design, data collection, statistical analysis, and strategic recommendations."
        author="Unite Group Agency"
        publishDate="January 21, 2025"
        readTime="16 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Market Research', href: '/market-research' },
          { name: 'Surveys', href: '/market-research/surveys' }
        ]}
        parentPage={{ name: 'Market Research', href: '/market-research' }}
        mainContent={<SurveysContent />}
        sidebarContent={<SurveysSidebar />}
        primaryCTA={{
          text: 'Start Survey Project',
          href: '/contact?service=market-research-surveys'
        }}
        relatedPages={[
          {
            title: 'Buyer Persona Development',
            description: 'Data-driven customer research and insights',
            href: '/market-research/persona-development',
            type: 'guide'
          },
          {
            title: 'Industry Reports',
            description: 'Comprehensive market analysis and intelligence',
            href: '/market-research/industry-reports',
            type: 'resource'
          }
        ]}
      />
    </>
  );
}