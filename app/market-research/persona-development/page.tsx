import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/metadata';
import { SEOHead } from '@/components/seo/SEOHead';
import SubPillarTemplate from '@/components/templates/SubPillarTemplate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Buyer Persona Development Brisbane | Customer Research & Insights',
  description: 'Professional buyer persona development services for Brisbane businesses. Data-driven customer research, behavioral analysis, and persona creation that drives targeted marketing success.',
  keywords: [
    'buyer persona development Brisbane',
    'customer persona research',
    'target audience analysis Brisbane',
    'customer research Brisbane',
    'persona development Australia',
    'customer insights Brisbane',
    'marketing personas Queensland',
    'audience research services',
    'customer segmentation Brisbane',
    'buyer journey mapping'
  ],
  url: '/market-research/persona-development',
  type: 'article',
  publishedTime: '2025-01-01T00:00:00Z',
  modifiedTime: '2025-01-21T00:00:00Z',
  author: 'Unite Group Agency'
});

const PersonaContent = () => (
  <article className="prose prose-invert max-w-none">
    <section id="introduction" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Buyer Persona Development</h2>
      
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed mb-0">
          Effective buyer personas are the foundation of successful marketing. Our data-driven approach combines 
          quantitative research, behavioral analysis, and customer interviews to create detailed personas that 
          drive targeted marketing strategies and improve conversion rates by up to 200%.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">200%</div>
          <div className="text-sm text-gray-400">Conversion Improvement</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">150%</div>
          <div className="text-sm text-gray-400">Email Engagement</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">75%</div>
          <div className="text-sm text-gray-400">Lower CAC</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">3-5</div>
          <div className="text-sm text-gray-400">Personas Optimal</div>
        </div>
      </div>
    </section>

    <section id="methodology" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">DISCOVER Persona Development Methodology</h2>
      
      <p className="text-lg text-gray-300 mb-6">
        Our DISCOVER methodology ensures comprehensive, accurate, and actionable buyer personas:
      </p>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/20 to-transparent border-l-4 border-blue-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Data Collection</h3>
          <p className="text-gray-300 mb-4">Gather quantitative and qualitative data from multiple sources.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Quantitative Sources:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Google Analytics demographics</li>
                <li>• Social media insights</li>
                <li>• Customer database analysis</li>
                <li>• Survey responses and polls</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">Qualitative Sources:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Customer interviews</li>
                <li>• Sales team insights</li>
                <li>• Support ticket analysis</li>
                <li>• User behavior observations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Identify Patterns</h3>
          <p className="text-gray-300 mb-4">Analyze data to identify common characteristics and behavioral patterns.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Demographic Patterns:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Age, gender, income clusters</li>
                <li>• Geographic concentrations</li>
                <li>• Education and profession trends</li>
                <li>• Family and lifestyle factors</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Behavioral Patterns:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Purchase decision processes</li>
                <li>• Content consumption habits</li>
                <li>• Communication preferences</li>
                <li>• Technology adoption rates</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Segment Audiences</h3>
          <p className="text-gray-300 mb-4">Group customers into distinct segments based on shared characteristics.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Segmentation Criteria:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Behavioral similarity</li>
                <li>• Demographic alignment</li>
                <li>• Value proposition fit</li>
                <li>• Customer lifetime value</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-300 mb-2">Validation Methods:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Statistical significance testing</li>
                <li>• Cross-validation analysis</li>
                <li>• Business value assessment</li>
                <li>• Actionability evaluation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Create Personas</h3>
          <p className="text-gray-300 mb-4">Develop detailed, actionable personas with names, stories, and motivations.</p>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h5 className="font-semibold text-white mb-2">Persona Components</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h6 className="text-xs font-semibold text-yellow-300 mb-1">Demographics</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Age, gender, location</li>
                  <li>• Income, education</li>
                  <li>• Job title, industry</li>
                </ul>
              </div>
              <div>
                <h6 className="text-xs font-semibold text-yellow-300 mb-1">Psychographics</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Values and beliefs</li>
                  <li>• Interests and hobbies</li>
                  <li>• Personality traits</li>
                </ul>
              </div>
              <div>
                <h6 className="text-xs font-semibold text-yellow-300 mb-1">Behaviors</h6>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Buying patterns</li>
                  <li>• Media consumption</li>
                  <li>• Decision-making style</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-900/20 to-transparent border-l-4 border-red-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Optimize for Marketing</h3>
          <p className="text-gray-300 mb-4">Tailor personas for specific marketing applications and campaigns.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Marketing Applications:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Content strategy development</li>
                <li>• Advertising targeting</li>
                <li>• Product messaging</li>
                <li>• Channel selection</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-2">Optimization Areas:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Message resonance</li>
                <li>• Channel effectiveness</li>
                <li>• Timing optimization</li>
                <li>• Creative alignment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-900/20 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Validate & Refine</h3>
          <p className="text-gray-300 mb-4">Continuously test and refine personas based on real-world performance.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Validation Methods:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• A/B testing campaigns</li>
                <li>• Customer feedback loops</li>
                <li>• Performance metric analysis</li>
                <li>• Sales team validation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-pink-300 mb-2">Refinement Triggers:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Market changes</li>
                <li>• Product evolution</li>
                <li>• Customer behavior shifts</li>
                <li>• Performance gaps</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-900/20 to-transparent border-l-4 border-cyan-500 p-6 rounded-r-xl">
          <h3 className="text-2xl font-bold text-white mb-3">Roll Out Strategy</h3>
          <p className="text-gray-300 mb-4">Implement personas across all marketing and business functions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">Implementation Areas:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Marketing campaigns</li>
                <li>• Sales processes</li>
                <li>• Product development</li>
                <li>• Customer service</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">Training & Adoption:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Team workshops</li>
                <li>• Documentation creation</li>
                <li>• Usage guidelines</li>
                <li>• Performance tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="example" className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6">Sample Persona: "Marketing Manager Mike"</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              MM
            </div>
            <h3 className="text-xl font-semibold text-white text-center">Marketing Manager Mike</h3>
            <p className="text-gray-400 text-center">35-year-old B2B Marketing Professional</p>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Demographics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>Age: 32-38</div>
                <div>Income: $75K-$95K</div>
                <div>Location: Brisbane, QLD</div>
                <div>Education: Bachelor's Degree</div>
                <div>Job: Marketing Manager</div>
                <div>Company Size: 50-200 employees</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Goals & Motivations</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Increase lead quality and conversion rates</li>
                <li>• Demonstrate clear ROI on marketing spend</li>
                <li>• Stay current with digital marketing trends</li>
                <li>• Build efficient, scalable marketing processes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-300 mb-2">Pain Points</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Limited budget for experimentation</li>
                <li>• Difficulty proving marketing ROI to executives</li>
                <li>• Keeping up with platform changes and new tools</li>
                <li>• Coordinating with sales team on lead quality</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-yellow-300 mb-2">Preferred Channels</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div>• LinkedIn (professional content)</div>
                <div>• Industry newsletters</div>
                <div>• Marketing podcasts</div>
                <div>• Webinars and virtual events</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-12 p-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Create Powerful Buyer Personas?</h2>
      <p className="text-gray-300 text-center mb-6">
        Get data-driven buyer personas that transform your marketing effectiveness and drive better customer engagement.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/contact?service=persona-development"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
        >
          Start Persona Development
        </a>
        <a
          href="/downloads/persona-development-template.pdf"
          className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          Download Template
        </a>
      </div>
    </section>
  </article>
);

const PersonaSidebar = () => (
  <div className="space-y-6">
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">DISCOVER Method</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
          <span className="text-gray-300 text-sm">Data Collection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
          <span className="text-gray-300 text-sm">Identify Patterns</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
          <span className="text-gray-300 text-sm">Segment Audiences</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
          <span className="text-gray-300 text-sm">Create Personas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">O</div>
          <span className="text-gray-300 text-sm">Optimize for Marketing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
          <span className="text-gray-300 text-sm">Validate & Refine</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">E</div>
          <span className="text-gray-300 text-sm">Execute & Roll Out</span>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Get Persona Development</h3>
      <p className="text-gray-300 text-sm mb-4">
        Professional buyer persona development with data analysis, customer interviews, and actionable marketing insights.
      </p>
      <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
        Start Project
      </button>
    </div>
  </div>
);

export default function PersonaDevelopmentPage() {
  return (
    <>
      <SEOHead 
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Market Research', url: '/market-research' },
            { name: 'Persona Development', url: '/market-research/persona-development' }
          ]),
          generateFAQSchema([
            {
              question: 'How many buyer personas should my business have?',
              answer: 'Most businesses benefit from 3-5 detailed buyer personas. Too few and you miss important segments; too many and your marketing becomes diluted and unfocused.'
            }
          ])
        ]}
      />
      
      <SubPillarTemplate
        title="Buyer Persona Development"
        subtitle="Data-Driven Customer Research & Insights"
        description="Professional buyer persona development that drives targeted marketing success. Comprehensive customer research, behavioral analysis, and actionable persona creation for Brisbane businesses."
        author="Unite Group Agency"
        publishDate="January 21, 2025"
        readTime="18 min"
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Market Research', href: '/market-research' },
          { name: 'Persona Development', href: '/market-research/persona-development' }
        ]}
        parentPage={{ name: 'Market Research', href: '/market-research' }}
        mainContent={<PersonaContent />}
        sidebarContent={<PersonaSidebar />}
        primaryCTA={{
          text: 'Start Persona Development',
          href: '/contact?service=persona-development'
        }}
        relatedPages={[
          {
            title: 'Industry Reports',
            description: 'Comprehensive market research and analysis',
            href: '/market-research/industry-reports',
            type: 'resource'
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