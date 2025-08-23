import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Competitive Tracker Brisbane | Monitor Competitor Activities & Changes',
  description: 'Advanced competitive tracking tools for Brisbane businesses. Monitor competitor websites, pricing, content, and marketing activities with automated alerts and comprehensive reporting.',
  keywords: [
    'competitive tracker Brisbane',
    'competitor monitoring tool',
    'competitor analysis Brisbane',
    'business intelligence tracking',
    'competitor website tracking',
    'pricing monitor Australia',
    'competitive intelligence Brisbane',
    'competitor tracking software',
    'market monitoring Brisbane',
    'competitor alerts Australia'
  ],
  url: '/competitive-analysis/tracker',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const TrackerContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Competitive Tracker</h2>
      
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Stay ahead of your competition with automated tracking and monitoring. Our competitive tracker provides 
          real-time insights into competitor activities, helping Brisbane businesses make informed strategic decisions 
          and respond quickly to market changes.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">24/7</div>
          <div className="text-sm text-gray-400">Monitoring</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">15min</div>
          <div className="text-sm text-gray-400">Alert Speed</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">50+</div>
          <div className="text-sm text-gray-400">Data Points</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">95%</div>
          <div className="text-sm text-gray-400">Accuracy Rate</div>
        </div>
      </div>
    </section>

    <section id="tracking-capabilities" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Comprehensive Tracking Capabilities</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Website & Content Tracking</h3>
          <p className="text-gray-300 mb-4">Monitor competitor website changes, content updates, and digital presence.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Page content changes and updates</li>
            <li>• New product or service launches</li>
            <li>• Website structure modifications</li>
            <li>• Blog post and content publishing</li>
            <li>• SEO optimization changes</li>
            <li>• Meta tag and title modifications</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Pricing & Promotion Monitoring</h3>
          <p className="text-gray-300 mb-4">Track competitor pricing strategies and promotional activities in real-time.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Product and service pricing changes</li>
            <li>• Discount and promotion launches</li>
            <li>• Package and bundle modifications</li>
            <li>• Seasonal pricing adjustments</li>
            <li>• Terms and conditions updates</li>
            <li>• Payment option changes</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Social Media & Advertising</h3>
          <p className="text-gray-300 mb-4">Monitor competitor social media activity and advertising campaigns.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Social media post frequency and content</li>
            <li>• Paid advertising campaign launches</li>
            <li>• Ad creative and messaging changes</li>
            <li>• Social media engagement metrics</li>
            <li>• Influencer partnerships and collaborations</li>
            <li>• Video and multimedia content releases</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Business Intelligence</h3>
          <p className="text-gray-300 mb-4">Track competitor business developments and strategic initiatives.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Job posting and hiring patterns</li>
            <li>• Press releases and news mentions</li>
            <li>• Partnership and acquisition announcements</li>
            <li>• Executive team changes</li>
            <li>• Award and recognition achievements</li>
            <li>• Industry event participation</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Technical & SEO Monitoring</h3>
          <p className="text-gray-300 mb-4">Track technical changes and SEO strategy modifications.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Search engine ranking changes</li>
            <li>• Keyword targeting modifications</li>
            <li>• Backlink profile changes</li>
            <li>• Website performance improvements</li>
            <li>• Technical SEO implementations</li>
            <li>• Mobile optimization updates</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-pink-900/20 to-transparent border border-pink-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Customer Experience Tracking</h3>
          <p className="text-gray-300 mb-4">Monitor competitor customer service and user experience improvements.</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Website user experience changes</li>
            <li>• Customer support feature updates</li>
            <li>• Review and rating management</li>
            <li>• Chatbot and automation implementations</li>
            <li>• Mobile app updates and features</li>
            <li>• Customer onboarding process changes</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="monitoring-dashboard" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Advanced Monitoring Dashboard</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6">Real-Time Competitive Intelligence</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-cyan-300 mb-4">Live Activity Feed</h4>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-medium">TechCorp Brisbane</span>
                  <span className="text-xs text-gray-400">2 min ago</span>
                </div>
                <p className="text-sm text-gray-300">Price reduction: Cloud hosting packages reduced by 15%</p>
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">High Priority</span>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-medium">Digital Solutions QLD</span>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
                <p className="text-sm text-gray-300">New blog post: "AI Marketing Trends 2025"</p>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Medium Priority</span>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-medium">Brisbane Marketing Co</span>
                  <span className="text-xs text-gray-400">3 hours ago</span>
                </div>
                <p className="text-sm text-gray-300">Social media post: New team member announcement</p>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Low Priority</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-purple-300 mb-4">Trend Analysis</h4>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-2">Pricing Trends (Last 30 Days)</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Average price changes:</span>
                    <span className="text-red-400">-8.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Promotion frequency:</span>
                    <span className="text-green-400">+23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">New service launches:</span>
                    <span className="text-blue-400">12</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-2">Content Activity</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Blog posts published:</span>
                    <span className="text-cyan-400">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Social media posts:</span>
                    <span className="text-purple-400">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Website updates:</span>
                    <span className="text-yellow-400">23</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="alert-system" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Intelligent Alert System</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Alert Types</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-gray-300">Critical business changes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-gray-300">Pricing and promotion updates</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-300">Content and SEO changes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Social media activity</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Technical improvements</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Delivery Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-gray-300">Instant email notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span className="text-gray-300">SMS alerts for urgent changes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
              <span className="text-gray-300">Slack integration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
              <span className="text-gray-300">Weekly summary reports</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
              <span className="text-gray-300">Dashboard notifications</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="competitor-profiles" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Competitor Profile Management</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                TC
              </div>
              <div>
                <h3 className="text-white font-semibold">TechCorp Brisbane</h3>
                <p className="text-gray-400 text-sm">IT Services</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Monitoring since:</span>
                <span className="text-white">Jan 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total changes:</span>
                <span className="text-cyan-400">147</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Priority level:</span>
                <span className="text-red-400">High</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
                DS
              </div>
              <div>
                <h3 className="text-white font-semibold">Digital Solutions</h3>
                <p className="text-gray-400 text-sm">Marketing Agency</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Monitoring since:</span>
                <span className="text-white">Mar 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total changes:</span>
                <span className="text-cyan-400">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Priority level:</span>
                <span className="text-yellow-400">Medium</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                BM
              </div>
              <div>
                <h3 className="text-white font-semibold">Brisbane Marketing</h3>
                <p className="text-gray-400 text-sm">SEO Agency</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Monitoring since:</span>
                <span className="text-white">Feb 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total changes:</span>
                <span className="text-cyan-400">203</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Priority level:</span>
                <span className="text-green-400">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-2xl border border-cyan-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Track Your Competition?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get real-time competitive intelligence with our advanced monitoring tools and stay ahead of market changes.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=competitive-tracker"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300"
        >
          Start Tracking
        </a>
        <a
          href="/downloads/competitive-tracker-demo.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          View Demo
        </a>
      </div>
    </section>
  </article>
);

const TrackerSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tracking Features</h3>
      <div className="space-y-3 text-sm text-gray-300">
        <div>• Real-time website monitoring</div>
        <div>• Pricing and promotion alerts</div>
        <div>• Social media activity tracking</div>
        <div>• SEO and ranking changes</div>
        <div>• Business intelligence updates</div>
        <div>• Custom alert thresholds</div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Start Competitive Tracking</h3>
      <p className="text-gray-300 text-sm mb-4">
        Monitor up to 10 competitors with real-time alerts and comprehensive reporting for strategic advantage.
      </p>
      <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300">
        Get Started
      </button>
    </div>
  </div>
);

export default function TrackerPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Competitive Analysis', url: '/competitive-analysis' },
            { name: 'Tracker', url: '/competitive-analysis/tracker' }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="Competitive Tracker"
        subtitle="Advanced Competitor Monitoring & Intelligence"
        description="Stay ahead with real-time competitive tracking. Monitor competitor activities, pricing changes, and strategic moves with automated alerts and comprehensive reporting."
        author="Unite Group Agency"
        publishDate="January 21, 2025"
        readTime="14 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Competitive Analysis', href: '/competitive-analysis' },
          { name: 'Tracker', href: '/competitive-analysis/tracker' }
        ]}
        parentPage={{ name: 'Competitive Analysis', href: '/competitive-analysis' }}
        mainContent={<TrackerContent />}
        sidebarContent={<TrackerSidebar />}
        primaryCTA={{
          text: 'Start Tracking Competitors',
          href: '/contact?service=competitive-tracker'
        }}
        relatedPages={[
          {
            title: 'Competitive Benchmarking',
            description: 'Strategic market analysis and intelligence',
            href: '/competitive-analysis/benchmarking',
            type: 'guide'
          },
          {
            title: 'SEO Audit',
            description: 'Comprehensive website analysis and optimization',
            href: '/competitive-analysis/seo-audit',
            type: 'tool'
          }
        ]}
      />
    </>
  );
}