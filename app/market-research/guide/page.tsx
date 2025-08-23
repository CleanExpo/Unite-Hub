import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, BookOpen, BarChart3, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Market Research Guide | Unite Group',
  description: 'Complete guide to market research methodologies, tools, and best practices for data-driven business decisions.',
  keywords: 'market research guide, consumer insights, survey design, data analysis, market intelligence',
};

export default function MarketResearchGuidePage() {
  const researchTypes = [
    {
      type: 'Primary Research',
      description: 'Collect original data directly from your target audience',
      methods: [
        'Customer surveys and questionnaires',
        'In-depth interviews',
        'Focus groups',
        'Observational studies'
      ],
      pros: ['Specific to your needs', 'Current and relevant', 'Competitive advantage'],
      cons: ['Time-intensive', 'Higher cost', 'Requires expertise']
    },
    {
      type: 'Secondary Research',
      description: 'Analyze existing data and published research',
      methods: [
        'Industry reports and publications',
        'Government databases',
        'Academic research',
        'Competitor analysis'
      ],
      pros: ['Cost-effective', 'Quick to obtain', 'Broad market insights'],
      cons: ['May be outdated', 'Not tailored', 'Widely available to competitors']
    }
  ];

  const researchProcess = [
    {
      step: 1,
      title: 'Define Research Objectives',
      description: 'Clearly articulate what you need to learn and why.',
      tasks: [
        'Identify key business questions',
        'Set specific, measurable goals',
        'Define target audience',
        'Establish success criteria'
      ]
    },
    {
      step: 2,
      title: 'Choose Research Methodology',
      description: 'Select the most appropriate research methods for your objectives.',
      tasks: [
        'Evaluate quantitative vs qualitative needs',
        'Consider budget and timeline constraints',
        'Assess sample size requirements',
        'Select data collection methods'
      ]
    },
    {
      step: 3,
      title: 'Design Research Instruments',
      description: 'Create surveys, interview guides, or other data collection tools.',
      tasks: [
        'Develop survey questions',
        'Create interview scripts',
        'Design screening criteria',
        'Test instruments with pilot group'
      ]
    },
    {
      step: 4,
      title: 'Collect Data',
      description: 'Execute your research plan and gather quality data.',
      tasks: [
        'Recruit participants',
        'Administer surveys or interviews',
        'Monitor data quality',
        'Maintain response rates'
      ]
    },
    {
      step: 5,
      title: 'Analyze and Report',
      description: 'Transform raw data into actionable business insights.',
      tasks: [
        'Clean and organize data',
        'Perform statistical analysis',
        'Identify key insights',
        'Create executive summary'
      ]
    }
  ];

  const surveyBestPractices = [
    {
      principle: 'Clear and Concise Questions',
      description: 'Use simple language and avoid jargon or complex terminology.',
      example: 'Good: "How satisfied are you with our service?" vs Bad: "What is your satisfaction quotient regarding our service delivery mechanism?"'
    },
    {
      principle: 'Logical Flow',
      description: 'Organize questions in a logical sequence from general to specific.',
      example: 'Start with broad category questions, then drill down into specific features or experiences.'
    },
    {
      principle: 'Balanced Response Options',
      description: 'Provide balanced scales and include neutral options when appropriate.',
      example: 'Use 5-point scales (Very Dissatisfied to Very Satisfied) with a neutral midpoint.'
    },
    {
      principle: 'Avoid Leading Questions',
      description: 'Frame questions neutrally without suggesting a preferred answer.',
      example: 'Good: "How would you rate our service?" vs Bad: "How would you rate our excellent service?"'
    }
  ];

  const analysisTools = [
    { name: 'SPSS', purpose: 'Advanced statistical analysis and modeling' },
    { name: 'Excel/Google Sheets', purpose: 'Basic data analysis and visualization' },
    { name: 'Tableau', purpose: 'Data visualization and dashboard creation' },
    { name: 'R/Python', purpose: 'Statistical computing and data science' },
    { name: 'SurveyMonkey', purpose: 'Survey creation and basic analysis' },
    { name: 'Qualtrics', purpose: 'Advanced survey platform with analytics' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <BarChart3 className="w-16 h-16 text-emerald-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Market Research Guide
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master market research methodologies to gather actionable insights 
            and make data-driven business decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=market-research"
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center"
            >
              Get Expert Help
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href={"/downloads/market-research-guide-2025.pdf" as any}
              className="border border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Download Guide PDF
            </Link>
          </div>
        </div>
      </section>

      {/* Research Types */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Primary vs Secondary Research
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {researchTypes.map((type, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{type.type}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Methods:</h4>
                  <ul className="space-y-1">
                    {type.methods.map((method, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {method}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="font-semibold text-green-800 mb-2">Pros:</h5>
                    <ul className="space-y-1">
                      {type.pros.map((pro, idx) => (
                        <li key={idx} className="text-sm text-green-700">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <h5 className="font-semibold text-red-800 mb-2">Cons:</h5>
                    <ul className="space-y-1">
                      {type.cons.map((con, idx) => (
                        <li key={idx} className="text-sm text-red-700">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Process */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            5-Step Research Process
          </h2>
          <div className="space-y-8">
            {researchProcess.map((step) => (
              <div key={step.step} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold mr-6 flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.tasks.map((task, index) => (
                        <div key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Survey Best Practices */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Survey Design Best Practices
          </h2>
          <div className="space-y-6">
            {surveyBestPractices.map((practice, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{practice.principle}</h3>
                <p className="text-gray-600 mb-3">{practice.description}</p>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm text-emerald-700">
                    <strong>Example:</strong> {practice.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Tools */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Data Analysis Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysisTools.map((tool, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 px-4 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Research Quality Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">85%+</div>
              <h3 className="text-lg font-semibold mb-2">Response Rate</h3>
              <p className="text-emerald-100 text-sm">
                Target completion rate for reliable results
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">±5%</div>
              <h3 className="text-lg font-semibold mb-2">Margin of Error</h3>
              <p className="text-emerald-100 text-sm">
                Maximum acceptable error for most business decisions
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">95%</div>
              <h3 className="text-lg font-semibold mb-2">Confidence Level</h3>
              <p className="text-emerald-100 text-sm">
                Standard confidence level for statistical significance
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">400+</div>
              <h3 className="text-lg font-semibold mb-2">Sample Size</h3>
              <p className="text-emerald-100 text-sm">
                Minimum recommended for representative results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Need Help with Your Market Research?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get expert assistance with survey design, data collection, and analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=market-research"
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center"
            >
              Schedule Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/market-research"
              className="border border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}