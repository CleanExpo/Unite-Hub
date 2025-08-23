'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, BarChart3, Globe, CheckCircle, ArrowRight, Search, Target, Zap, Eye, Brain, Award } from 'lucide-react';

const reportCategories = [
  {
    title: 'Market Analysis Reports',
    description: 'Comprehensive analysis of market size, growth trends, and opportunities',
    features: [
      'Total addressable market (TAM) sizing',
      'Market growth projections and trends',
      'Segment analysis and opportunities',
      'Geographic market distribution',
      'Regulatory and policy impacts',
      'Investment and funding landscape'
    ],
    deliverables: [
      'Executive summary dashboard',
      'Detailed market sizing model',
      'Growth opportunity matrices',
      'Strategic recommendations'
    ]
  },
  {
    title: 'Competitive Landscape Reports',
    description: 'In-depth analysis of competitive dynamics and market positioning',
    features: [
      'Competitor profiling and analysis',
      'Market share estimation',
      'Competitive positioning maps',
      'SWOT analysis frameworks',
      'Pricing and strategy comparison',
      'Emerging threat identification'
    ],
    deliverables: [
      'Competitive intelligence dashboard',
      'Positioning strategy recommendations',
      'Threat assessment reports',
      'Opportunity gap analysis'
    ]
  },
  {
    title: 'Industry Trend Reports',
    description: 'Forward-looking analysis of industry trends and disruptions',
    features: [
      'Technology adoption patterns',
      'Consumer behavior shifts',
      'Regulatory change impacts',
      'Innovation pipeline analysis',
      'Market disruption scenarios',
      'Future growth predictions'
    ],
    deliverables: [
      'Trend impact assessments',
      'Scenario planning models',
      'Innovation opportunity maps',
      'Strategic planning frameworks'
    ]
  }
];

const australianIndustries = [
  {
    sector: 'Technology & Software',
    marketSize: '$167.2 billion',
    growthRate: '8.3% CAGR',
    keyTrends: [
      'Cloud adoption acceleration',
      'AI and machine learning integration',
      'Cybersecurity investment surge',
      'Remote work technology demand'
    ],
    opportunities: [
      'Enterprise digital transformation',
      'Government digitalization projects',
      'Export to Asia-Pacific markets',
      'Fintech innovation hub development'
    ]
  },
  {
    sector: 'Healthcare & Medical',
    marketSize: '$89.5 billion',
    growthRate: '6.7% CAGR',
    keyTrends: [
      'Telehealth adoption',
      'Aged care expansion',
      'Personalized medicine growth',
      'Mental health awareness'
    ],
    opportunities: [
      'Digital health solutions',
      'Medical device innovation',
      'Pharmaceutical research',
      'Health data analytics'
    ]
  },
  {
    sector: 'Professional Services',
    marketSize: '$156.8 billion',
    growthRate: '4.2% CAGR',
    keyTrends: [
      'Automation and AI adoption',
      'Sustainability consulting growth',
      'Remote service delivery',
      'Specialized expertise demand'
    ],
    opportunities: [
      'Digital transformation consulting',
      'ESG advisory services',
      'Cross-border service expansion',
      'Technology-enabled efficiency'
    ]
  },
  {
    sector: 'E-commerce & Retail',
    marketSize: '$53.7 billion',
    growthRate: '12.1% CAGR',
    keyTrends: [
      'Omnichannel integration',
      'Sustainable product demand',
      'Social commerce growth',
      'Local marketplace preference'
    ],
    opportunities: [
      'D2C brand development',
      'Cross-border e-commerce',
      'Sustainable product lines',
      'Experience-driven retail'
    ]
  }
];

const researchMethodology = [
  {
    phase: 'Market Scoping',
    description: 'Define market boundaries and research parameters',
    duration: '1-2 weeks',
    activities: [
      'Market definition and segmentation',
      'Research objectives clarification',
      'Data source identification',
      'Methodology framework design',
      'Timeline and milestone planning',
      'Quality assurance protocols'
    ]
  },
  {
    phase: 'Primary Research',
    description: 'Conduct original research with industry participants',
    duration: '4-6 weeks',
    activities: [
      'Industry expert interviews',
      'Customer and prospect surveys',
      'Focus group facilitation',
      'Observational studies',
      'Case study development',
      'Stakeholder consultation'
    ]
  },
  {
    phase: 'Secondary Research',
    description: 'Gather and analyze existing market intelligence',
    duration: '3-4 weeks',
    activities: [
      'Industry database analysis',
      'Government statistics review',
      'Academic research compilation',
      'Trade publication analysis',
      'Financial report examination',
      'Patent and innovation tracking'
    ]
  },
  {
    phase: 'Analysis & Synthesis',
    description: 'Transform data into actionable insights',
    duration: '3-4 weeks',
    activities: [
      'Statistical analysis and modeling',
      'Trend identification and projection',
      'Scenario development',
      'Opportunity assessment',
      'Risk evaluation',
      'Strategic recommendation formulation'
    ]
  },
  {
    phase: 'Report Production',
    description: 'Create comprehensive industry reports',
    duration: '2-3 weeks',
    activities: [
      'Executive summary creation',
      'Data visualization design',
      'Report writing and editing',
      'Quality review and validation',
      'Presentation preparation',
      'Client briefing and handover'
    ]
  }
];

const reportFormats = [
  {
    format: 'Executive Report',
    length: '25-40 pages',
    focus: 'Strategic overview and key insights',
    audience: 'C-level executives and board members',
    features: [
      'Executive summary dashboard',
      'Key finding highlights',
      'Strategic recommendations',
      'High-level data visualizations'
    ]
  },
  {
    format: 'Comprehensive Report',
    length: '80-120 pages',
    focus: 'Detailed analysis and methodology',
    audience: 'Strategy teams and analysts',
    features: [
      'Complete methodology documentation',
      'Detailed market analysis',
      'Comprehensive data sets',
      'Appendices and supporting materials'
    ]
  },
  {
    format: 'Industry Briefing',
    length: '10-15 pages',
    focus: 'Quick insights and trends',
    audience: 'Marketing and product teams',
    features: [
      'Trend summaries',
      'Opportunity snapshots',
      'Competitive updates',
      'Action-oriented insights'
    ]
  }
];

const dataSourcesAndTools = [
  {
    category: 'Primary Data Sources',
    sources: [
      { name: 'Industry Expert Interviews', coverage: '50-100 experts per report' },
      { name: 'Customer Surveys', coverage: '1,000-5,000 respondents' },
      { name: 'Executive Interviews', coverage: '15-30 C-level executives' },
      { name: 'Focus Groups', coverage: '5-8 groups per segment' }
    ]
  },
  {
    category: 'Secondary Data Sources',
    sources: [
      { name: 'Australian Bureau of Statistics', coverage: 'Government economic data' },
      { name: 'IBISWorld Industry Reports', coverage: '700+ Australian industries' },
      { name: 'ASIC Business Registry', coverage: 'Company financial data' },
      { name: 'Trade Association Data', coverage: 'Industry-specific insights' }
    ]
  },
  {
    category: 'Analysis Tools',
    sources: [
      { name: 'SPSS & R Statistical Software', coverage: 'Advanced statistical analysis' },
      { name: 'Tableau & Power BI', coverage: 'Data visualization and modeling' },
      { name: 'Porter\'s Five Forces', coverage: 'Competitive structure analysis' },
      { name: 'PESTLE Framework', coverage: 'Macro-environmental analysis' }
    ]
  }
];

const industryInsights = [
  {
    insight: 'Digital Transformation Acceleration',
    impact: 'High',
    timeframe: '2024-2026',
    description: 'Australian businesses are accelerating digital transformation initiatives, with 78% planning significant technology investments in the next 2 years.',
    implications: [
      'Increased demand for digital consulting services',
      'Cloud infrastructure market expansion',
      'Cybersecurity solutions growth',
      'Workforce reskilling requirements'
    ]
  },
  {
    insight: 'Sustainability Focus Intensification',
    impact: 'Medium-High',
    timeframe: '2024-2028',
    description: 'Environmental and social governance (ESG) considerations are becoming critical business drivers across all industries.',
    implications: [
      'Green technology investment surge',
      'Sustainable supply chain restructuring',
      'ESG reporting and compliance demand',
      'Circular economy business models'
    ]
  },
  {
    insight: 'Asia-Pacific Market Integration',
    impact: 'High',
    timeframe: '2024-2030',
    description: 'Australia is strengthening trade relationships and market integration with Asia-Pacific economies, creating new opportunities.',
    implications: [
      'Export market expansion opportunities',
      'Cross-border partnership growth',
      'Supply chain diversification',
      'Cultural competency requirements'
    ]
  }
];

export default function IndustryReportsContent() {
  return (
    <div className="space-y-16">
      {/* Overview */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Comprehensive Industry Intelligence Reports
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Gain deep insights into Australian market dynamics with our comprehensive industry reports. 
            From market sizing and competitive analysis to trend forecasting and opportunity identification, 
            our research provides the intelligence you need to make strategic decisions with confidence.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: FileText, label: 'Report Depth', value: '100+ pages' },
            { icon: BarChart3, label: 'Data Points', value: '500+ metrics' },
            { icon: Target, label: 'Accuracy Rate', value: '96%+' },
            { icon: Globe, label: 'Market Coverage', value: '25+ industries' }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-6 text-center"
            >
              <benefit.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">{benefit.label}</p>
              <p className="text-xl font-bold text-white">{benefit.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Report Categories */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Industry Report Categories</h2>
        <div className="space-y-8">
          {reportCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{category.title}</h3>
              <p className="text-gray-300 mb-6">{category.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Research Features</h4>
                  <ul className="space-y-2">
                    {category.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Deliverables</h4>
                  <ul className="space-y-2">
                    {category.deliverables.map((deliverable, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Industry Overview */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Industry Landscape</h2>
        <div className="space-y-6">
          {australianIndustries.map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{industry.sector}</h3>
                  <div className="flex gap-6">
                    <span className="text-green-400 font-semibold">Market: {industry.marketSize}</span>
                    <span className="text-blue-400 font-semibold">Growth: {industry.growthRate}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Trends</h4>
                  <ul className="space-y-2">
                    {industry.keyTrends.map((trend, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <TrendingUp className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Growth Opportunities</h4>
                  <ul className="space-y-2">
                    {industry.opportunities.map((opportunity, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Zap className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Research Methodology */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Research Methodology</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {researchMethodology.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex gap-6 items-start"
              >
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{phase.description}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Activities:</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {phase.activities.map((activity, i) => (
                        <div key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Formats */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Report Formats & Delivery</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {reportFormats.map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{format.format}</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Length:</span>
                  <span className="text-white font-semibold">{format.length}</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Focus:</p>
                  <p className="text-white">{format.focus}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Target Audience:</p>
                  <p className="text-white">{format.audience}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Key Features:</h4>
                <ul className="space-y-2">
                  {format.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Data Sources & Analysis Tools</h2>
        <div className="space-y-8">
          {dataSourcesAndTools.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">{category.category}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {category.sources.map((source, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">{source.name}</h4>
                    <p className="text-sm text-gray-400">{source.coverage}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Industry Insights */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Current Industry Insights</h2>
        <div className="space-y-6">
          {industryInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{insight.insight}</h3>
                <div className="flex gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    insight.impact === 'High' ? 'bg-red-500/20 text-red-300' :
                    insight.impact === 'Medium-High' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {insight.impact} Impact
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                    {insight.timeframe}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">{insight.description}</p>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Strategic Implications</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {insight.implications.map((implication, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-300">
                      <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{implication}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Research Services */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Custom Research Capabilities</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Specialized Industries</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• FinTech and financial services</li>
                <li>• Renewable energy and cleantech</li>
                <li>• AgTech and food production</li>
                <li>• MedTech and biotechnology</li>
                <li>• Education and EdTech</li>
                <li>• Mining and resources</li>
                <li>• Tourism and hospitality</li>
                <li>• Construction and infrastructure</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Research Specializations</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Market entry strategy analysis</li>
                <li>• Regulatory impact assessments</li>
                <li>• Technology adoption forecasting</li>
                <li>• Consumer behavior deep dives</li>
                <li>• Supply chain optimization</li>
                <li>• Investment opportunity mapping</li>
                <li>• Risk and scenario planning</li>
                <li>• Merger & acquisition support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Delivery Options</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• One-time comprehensive reports</li>
                <li>• Quarterly industry updates</li>
                <li>• Annual subscription services</li>
                <li>• Real-time market monitoring</li>
                <li>• Custom dashboard creation</li>
                <li>• Executive briefing sessions</li>
                <li>• Workshop facilitation</li>
                <li>• Ongoing strategic consulting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}