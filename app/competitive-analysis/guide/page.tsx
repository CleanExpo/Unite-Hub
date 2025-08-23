import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, BookOpen, BarChart3, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Competitive Analysis Guide | Unite Group',
  description: 'Master competitive analysis with our comprehensive guide. Learn proven strategies, frameworks, and tools to outperform your competition.',
  keywords: 'competitive analysis guide, competitor research, market intelligence, business strategy',
};

export default function CompetitiveAnalysisGuidePage() {
  const guideSteps = [
    {
      step: 1,
      title: 'Identify Your Competitors',
      description: 'Learn how to find and categorize direct, indirect, and aspirational competitors.',
      topics: [
        'Direct vs indirect competitors',
        'Market mapping techniques',
        'Competitor discovery tools',
        'Industry research methods'
      ]
    },
    {
      step: 2,
      title: 'Analyze Competitor Strategies',
      description: 'Deep dive into competitor business models, pricing, and positioning.',
      topics: [
        'Business model analysis',
        'Pricing strategy evaluation',
        'Value proposition mapping',
        'Brand positioning assessment'
      ]
    },
    {
      step: 3,
      title: 'Digital Presence Audit',
      description: 'Evaluate competitor websites, SEO, and digital marketing efforts.',
      topics: [
        'Website user experience analysis',
        'SEO performance comparison',
        'Content strategy evaluation',
        'Social media presence audit'
      ]
    },
    {
      step: 4,
      title: 'SWOT Analysis Framework',
      description: 'Apply systematic SWOT analysis to identify opportunities and threats.',
      topics: [
        'Strengths identification',
        'Weakness discovery',
        'Opportunity mapping',
        'Threat assessment'
      ]
    },
    {
      step: 5,
      title: 'Actionable Insights',
      description: 'Transform analysis into strategic recommendations and action plans.',
      topics: [
        'Gap analysis methodology',
        'Strategic recommendations',
        'Implementation roadmap',
        'Performance tracking'
      ]
    }
  ];

  const frameworks = [
    {
      name: 'Porter\'s Five Forces',
      description: 'Analyze industry competition and market dynamics',
      useCase: 'Market entry and competitive positioning'
    },
    {
      name: 'SWOT Analysis',
      description: 'Evaluate strengths, weaknesses, opportunities, and threats',
      useCase: 'Strategic planning and positioning'
    },
    {
      name: 'Competitive Benchmarking',
      description: 'Compare performance metrics against competitors',
      useCase: 'Performance improvement and goal setting'
    },
    {
      name: 'Blue Ocean Strategy',
      description: 'Identify uncontested market spaces',
      useCase: 'Innovation and differentiation strategies'
    }
  ];

  const tools = [
    { name: 'SEMrush', purpose: 'SEO and PPC competitor analysis' },
    { name: 'Ahrefs', purpose: 'Backlink and content analysis' },
    { name: 'SimilarWeb', purpose: 'Website traffic and engagement metrics' },
    { name: 'SpyFu', purpose: 'Competitor PPC and SEO history' },
    { name: 'BuzzSumo', purpose: 'Content performance analysis' },
    { name: 'Social Blade', purpose: 'Social media analytics' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="w-16 h-16 text-orange-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Competitive Analysis Guide
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master the art of competitive intelligence with our step-by-step guide. 
            Learn proven frameworks and tools used by leading strategists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=competitive-analysis"
              className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center"
            >
              Get Expert Help
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href={"/downloads/competitive-analysis-guide-2025.pdf" as any}
              className="border border-orange-600 text-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors"
            >
              Download Guide PDF
            </Link>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What You'll Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guideSteps.map((step) => (
              <div key={step.step} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.topics.map((topic, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Frameworks */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Strategic Frameworks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {frameworks.map((framework, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{framework.name}</h3>
                <p className="text-gray-600 mb-3">{framework.description}</p>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm text-orange-700">
                    <strong>Best for:</strong> {framework.useCase}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools and Resources */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Essential Tools & Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-4 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Competitive Analysis Matters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Market Intelligence</h3>
              <p className="text-orange-100">
                Gain deep insights into market trends, customer preferences, and competitive dynamics.
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Strategic Advantage</h3>
              <p className="text-orange-100">
                Identify gaps in the market and opportunities for differentiation and growth.
              </p>
            </div>
            <div className="text-center">
              <Check className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Better Decisions</h3>
              <p className="text-orange-100">
                Make informed strategic decisions based on comprehensive competitive intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Analyze Your Competition?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get expert help implementing these strategies for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=competitive-analysis"
              className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center"
            >
              Schedule Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/competitive-analysis"
              className="border border-orange-600 text-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors"
            >
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}