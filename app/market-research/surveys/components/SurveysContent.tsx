'use client';

import { motion } from 'framer-motion';
import { Users, BarChart3, Target, Brain, CheckCircle, ArrowRight, Search, Zap, Eye, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';

const surveyTypes = [
  {
    title: 'Customer Satisfaction Surveys',
    description: 'Measure customer satisfaction, identify pain points, and improve service quality',
    applications: [
      'Service quality assessment',
      'Product satisfaction measurement',
      'Customer loyalty evaluation',
      'Support experience analysis',
      'Brand perception tracking',
      'Retention factor identification'
    ],
    metrics: [
      'Net Promoter Score (NPS)',
      'Customer Satisfaction Score (CSAT)',
      'Customer Effort Score (CES)',
      'Overall satisfaction ratings',
      'Feature-specific ratings',
      'Recommendation likelihood'
    ]
  },
  {
    title: 'Market Research Surveys',
    description: 'Understand market dynamics, customer needs, and growth opportunities',
    applications: [
      'Market size estimation',
      'Demand forecasting',
      'Price sensitivity analysis',
      'Product-market fit assessment',
      'Customer segmentation',
      'Competitive positioning'
    ],
    metrics: [
      'Purchase intent scores',
      'Price tolerance thresholds',
      'Feature importance rankings',
      'Brand awareness levels',
      'Market share indicators',
      'Unmet needs identification'
    ]
  },
  {
    title: 'Employee Engagement Surveys',
    description: 'Assess workforce satisfaction, engagement, and organizational culture',
    applications: [
      'Employee satisfaction tracking',
      'Engagement level measurement',
      'Culture assessment',
      'Leadership effectiveness',
      'Training needs analysis',
      'Retention risk evaluation'
    ],
    metrics: [
      'Employee Net Promoter Score (eNPS)',
      'Engagement index scores',
      'Job satisfaction ratings',
      'Cultural alignment measures',
      'Leadership confidence scores',
      'Turnover intention indicators'
    ]
  }
];

const australianSurveyConsiderations = [
  {
    factor: 'Cultural Sensitivity',
    description: 'Australia\'s diverse population requires culturally appropriate survey design',
    considerations: [
      'Language accessibility and translation needs',
      'Cultural context in question framing',
      'Religious and cultural celebration awareness',
      'Indigenous perspectives and protocols',
      'Multicultural representation in sampling',
      'Bias-free question development'
    ]
  },
  {
    factor: 'Geographic Representation',
    description: 'Ensuring representative sampling across urban and regional areas',
    considerations: [
      'Metro vs regional response patterns',
      'State and territory representation',
      'Remote area accessibility challenges',
      'Time zone considerations for live surveys',
      'Local market variations',
      'Infrastructure and connectivity factors'
    ]
  },
  {
    factor: 'Privacy and Compliance',
    description: 'Adherence to Australian privacy laws and ethical research standards',
    considerations: [
      'Australian Privacy Principles compliance',
      'GDPR considerations for EU citizens',
      'Informed consent requirements',
      'Data storage and security protocols',
      'Right to withdraw participation',
      'Anonymization and de-identification'
    ]
  }
];

const surveyMethodology = [
  {
    phase: 'Survey Design & Planning',
    description: 'Develop comprehensive survey strategy and questionnaire design',
    duration: '1-2 weeks',
    activities: [
      'Research objectives definition',
      'Target audience identification',
      'Survey methodology selection',
      'Questionnaire development',
      'Pilot testing and refinement',
      'Sampling strategy design'
    ]
  },
  {
    phase: 'Data Collection',
    description: 'Execute survey deployment and manage response collection',
    duration: '2-4 weeks',
    activities: [
      'Survey platform setup',
      'Participant recruitment',
      'Data collection monitoring',
      'Response rate optimization',
      'Quality control implementation',
      'Follow-up management'
    ]
  },
  {
    phase: 'Analysis & Reporting',
    description: 'Analyze survey data and generate actionable insights',
    duration: '2-3 weeks',
    activities: [
      'Statistical analysis execution',
      'Data visualization creation',
      'Pattern and trend identification',
      'Insight development',
      'Report compilation',
      'Presentation preparation'
    ]
  }
];

const surveyChannels = [
  {
    channel: 'Online Surveys',
    description: 'Web-based questionnaires accessible via email links or QR codes',
    advantages: [
      'Cost-effective for large samples',
      'Real-time data collection',
      'Automated data processing',
      'Rich media integration',
      'Logic branching capabilities',
      'Mobile-optimized responses'
    ],
    bestFor: 'General population, tech-savvy audiences, cost-sensitive projects'
  },
  {
    channel: 'Phone Surveys',
    description: 'Computer-assisted telephone interviews (CATI) with trained interviewers',
    advantages: [
      'Higher response rates',
      'Complex question handling',
      'Immediate clarification',
      'Better sample control',
      'Reduced non-response bias',
      'Personal connection'
    ],
    bestFor: 'Older demographics, complex topics, sensitive subjects'
  },
  {
    channel: 'In-Person Surveys',
    description: 'Face-to-face interviews in controlled or natural environments',
    advantages: [
      'Highest response quality',
      'Visual aid integration',
      'Non-verbal cue capture',
      'Complex concept explanation',
      'Relationship building',
      'Cultural sensitivity'
    ],
    bestFor: 'Deep insights, sensitive topics, complex products'
  },
  {
    channel: 'Hybrid Approaches',
    description: 'Multi-channel methodology combining different survey methods',
    advantages: [
      'Broader reach and representation',
      'Method triangulation',
      'Response rate optimization',
      'Cost-effectiveness balance',
      'Data quality enhancement',
      'Bias reduction'
    ],
    bestFor: 'Comprehensive studies, diverse populations, maximum accuracy'
  }
];

const questionTypes = [
  {
    type: 'Multiple Choice',
    description: 'Closed-ended questions with predefined response options',
    examples: [
      'Which of the following best describes your role?',
      'How often do you use our product?',
      'What is your primary reason for choosing our service?'
    ],
    bestFor: 'Quantitative analysis, easy comparison, statistical testing'
  },
  {
    type: 'Rating Scales',
    description: 'Numerical or descriptive scales for measuring attitudes and satisfaction',
    examples: [
      'Rate your satisfaction from 1-10',
      'How likely are you to recommend us? (0-10 NPS scale)',
      'Rate the importance: Very Important to Not Important'
    ],
    bestFor: 'Satisfaction measurement, importance ranking, comparison analysis'
  },
  {
    type: 'Open-Ended',
    description: 'Free-text responses allowing detailed, qualitative feedback',
    examples: [
      'What improvements would you like to see?',
      'Describe your experience with our customer service',
      'What other solutions have you considered?'
    ],
    bestFor: 'Qualitative insights, unexpected discoveries, voice of customer'
  },
  {
    type: 'Matrix Questions',
    description: 'Multiple items rated on the same scale for efficient comparison',
    examples: [
      'Rate each feature: Price, Quality, Service, Support',
      'How important vs. how satisfied are you with each aspect?',
      'Likelihood to purchase each product variant'
    ],
    bestFor: 'Comparative analysis, feature evaluation, efficiency'
  }
];

const australianSampleSizes = [
  {
    population: 'National Consumer Survey',
    targetPopulation: '25.7 million Australians',
    recommendedSample: '1,200-2,000 responses',
    marginOfError: '±2.5-3.0%',
    considerations: 'Representative of age, gender, location, income'
  },
  {
    population: 'Brisbane Metro Market',
    targetPopulation: '2.6 million residents',
    recommendedSample: '400-800 responses',
    marginOfError: '±3.5-5.0%',
    considerations: 'Inner city vs suburban representation'
  },
  {
    population: 'Business Decision Makers',
    targetPopulation: '500,000 business leaders',
    recommendedSample: '300-600 responses',
    marginOfError: '±4.0-6.0%',
    considerations: 'Industry, company size, role level distribution'
  },
  {
    population: 'Specialized Industries',
    targetPopulation: '50,000-100,000 professionals',
    recommendedSample: '200-400 responses',
    marginOfError: '±5.0-7.0%',
    considerations: 'Professional networks, industry associations'
  }
];

const surveyBestPractices = [
  {
    category: 'Question Design',
    practices: [
      'Use clear, simple language',
      'Avoid leading or biased questions',
      'Keep questions focused and specific',
      'Test for cultural appropriateness',
      'Limit response burden',
      'Include validation questions'
    ]
  },
  {
    category: 'Survey Structure',
    practices: [
      'Start with easy, engaging questions',
      'Group related topics together',
      'Use logical flow and transitions',
      'Limit total survey length',
      'Include progress indicators',
      'End with demographics'
    ]
  },
  {
    category: 'Response Optimization',
    practices: [
      'Optimize for mobile devices',
      'Provide clear instructions',
      'Use incentives appropriately',
      'Send reminder communications',
      'Monitor response quality',
      'Provide multiple contact options'
    ]
  }
];

export default function SurveysContent() {
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
            Professional Survey Research Services
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Gather reliable, actionable insights through professionally designed and executed surveys. 
            Our comprehensive survey research services help Australian businesses make data-driven 
            decisions with confidence, from customer satisfaction measurement to market research.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Users, label: 'Response Quality', value: '95%+ valid' },
            { icon: BarChart3, label: 'Statistical Accuracy', value: '±3% margin' },
            { icon: Target, label: 'Sample Representativeness', value: '99% confidence' },
            { icon: Brain, label: 'Actionable Insights', value: '85%+ useful' }
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

      {/* Survey Types */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Survey Research Specializations</h2>
        <div className="space-y-8">
          {surveyTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{type.title}</h3>
              <p className="text-gray-300 mb-6">{type.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Business Applications</h4>
                  <ul className="space-y-2">
                    {type.applications.map((application, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{application}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Metrics</h4>
                  <ul className="space-y-2">
                    {type.metrics.map((metric, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Market Considerations */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Market Survey Considerations</h2>
        <div className="space-y-6">
          {australianSurveyConsiderations.map((consideration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{consideration.factor}</h3>
              <p className="text-gray-300 mb-6">{consideration.description}</p>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Key Considerations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {consideration.considerations.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-300">
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Survey Methodology */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Survey Research Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {surveyMethodology.map((phase, index) => (
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

      {/* Survey Channels */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Survey Collection Methods</h2>
        <div className="space-y-6">
          {surveyChannels.map((channel, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{channel.channel}</h3>
              <p className="text-gray-300 mb-6">{channel.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Advantages</h4>
                  <ul className="space-y-2">
                    {channel.advantages.map((advantage, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Best For</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-gray-300">{channel.bestFor}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Question Types */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Survey Question Design</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {questionTypes.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{question.type}</h3>
              <p className="text-gray-300 mb-6">{question.description}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Example Questions:</h4>
                  <ul className="space-y-1">
                    {question.examples.map((example, i) => (
                      <li key={i} className="text-sm text-gray-300 italic">
                        "• {example}"
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Best For:</h4>
                  <p className="text-sm text-blue-300">{question.bestFor}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample Sizes */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Market Sample Size Guidelines</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Population</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Target Size</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Sample Size</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Margin of Error</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Considerations</th>
                </tr>
              </thead>
              <tbody>
                {australianSampleSizes.map((sample, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-t border-slate-700"
                  >
                    <td className="px-6 py-4 text-white font-medium">{sample.population}</td>
                    <td className="px-6 py-4 text-center text-blue-400 font-semibold">{sample.targetPopulation}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-semibold">{sample.recommendedSample}</td>
                    <td className="px-6 py-4 text-center text-yellow-400 font-semibold">{sample.marginOfError}</td>
                    <td className="px-6 py-4 text-center text-gray-300 text-sm">{sample.considerations}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Survey Best Practices</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {surveyBestPractices.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">{category.category}</h3>
              <ul className="space-y-3">
                {category.practices.map((practice, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{practice}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Technology & Tools */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Survey Technology & Analytics</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Survey Platforms</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Qualtrics Enterprise Platform</li>
                <li>• SurveyMonkey Premier</li>
                <li>• Typeform Professional</li>
                <li>• Custom survey development</li>
                <li>• Mobile-optimized designs</li>
                <li>• Multi-language support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Analytics & Reporting</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• SPSS statistical analysis</li>
                <li>• R and Python programming</li>
                <li>• Tableau data visualization</li>
                <li>• Real-time dashboard creation</li>
                <li>• Advanced statistical modeling</li>
                <li>• Cross-tabulation analysis</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Quality Assurance</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Response quality monitoring</li>
                <li>• Duplicate detection systems</li>
                <li>• Logic validation checks</li>
                <li>• Statistical significance testing</li>
                <li>• Bias detection algorithms</li>
                <li>• Data cleaning protocols</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}