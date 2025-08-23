'use client';

import { motion } from 'framer-motion';
import { Users, Target, Brain, Heart, TrendingUp, CheckCircle, ArrowRight, Search, BarChart3, Eye, Lightbulb, UserCheck } from 'lucide-react';

const personaTypes = [
  {
    title: 'Buyer Personas',
    description: 'Detailed profiles of your ideal customers based on demographics, behavior, and motivations',
    elements: [
      'Demographic characteristics',
      'Psychographic insights',
      'Buying behavior patterns',
      'Pain points and challenges',
      'Goals and motivations',
      'Communication preferences'
    ],
    applications: [
      'Marketing message targeting',
      'Product development guidance',
      'Content strategy creation',
      'Sales approach optimization'
    ]
  },
  {
    title: 'User Personas',
    description: 'Focused on how customers interact with your products or services',
    elements: [
      'User journey mapping',
      'Feature usage patterns',
      'Technology adoption',
      'Experience expectations',
      'Support requirements',
      'Feedback preferences'
    ],
    applications: [
      'UX/UI design decisions',
      'Feature prioritization',
      'Support strategy',
      'Onboarding optimization'
    ]
  },
  {
    title: 'Customer Personas',
    description: 'Comprehensive profiles combining buyer and user characteristics',
    elements: [
      'Complete customer lifecycle',
      'Multi-touchpoint interactions',
      'Loyalty drivers',
      'Churn risk factors',
      'Advocacy potential',
      'Lifetime value indicators'
    ],
    applications: [
      'Holistic customer strategy',
      'Retention programs',
      'Cross-selling opportunities',
      'Customer experience design'
    ]
  }
];

const researchMethods = [
  {
    category: 'Quantitative Research',
    methods: [
      {
        name: 'Customer Surveys',
        description: 'Large-scale data collection on demographics, preferences, and behaviors',
        timeline: '2-3 weeks',
        sampleSize: '500-2000 responses'
      },
      {
        name: 'Website Analytics',
        description: 'Behavioral data analysis from Google Analytics and user tracking',
        timeline: '1-2 weeks',
        sampleSize: '6-12 months data'
      },
      {
        name: 'Purchase Data Analysis',
        description: 'Transaction history and buying pattern analysis',
        timeline: '1 week',
        sampleSize: 'All historical data'
      },
      {
        name: 'Social Media Analytics',
        description: 'Audience insights from social platforms and engagement data',
        timeline: '1 week',
        sampleSize: '3-6 months data'
      }
    ]
  },
  {
    category: 'Qualitative Research',
    methods: [
      {
        name: 'Customer Interviews',
        description: 'In-depth one-on-one conversations with existing customers',
        timeline: '3-4 weeks',
        sampleSize: '15-25 interviews'
      },
      {
        name: 'Focus Groups',
        description: 'Facilitated group discussions with target demographics',
        timeline: '2-3 weeks',
        sampleSize: '3-5 groups of 6-8 people'
      },
      {
        name: 'Observational Studies',
        description: 'Real-world behavior observation and journey mapping',
        timeline: '2-4 weeks',
        sampleSize: '20-50 observations'
      },
      {
        name: 'User Testing Sessions',
        description: 'Product/service interaction testing with think-aloud protocols',
        timeline: '2 weeks',
        sampleSize: '10-20 sessions'
      }
    ]
  }
];

const personaDevelopmentProcess = [
  {
    phase: 'Research Planning',
    description: 'Define research objectives and methodology',
    duration: '3-5 days',
    deliverables: [
      'Research strategy document',
      'Target segment identification',
      'Survey and interview guides',
      'Data collection timeline'
    ]
  },
  {
    phase: 'Data Collection',
    description: 'Gather quantitative and qualitative insights',
    duration: '3-6 weeks',
    deliverables: [
      'Survey responses and analytics',
      'Interview transcripts',
      'Focus group recordings',
      'Behavioral observation notes'
    ]
  },
  {
    phase: 'Analysis & Synthesis',
    description: 'Analyze data and identify patterns',
    duration: '2-3 weeks',
    deliverables: [
      'Data analysis reports',
      'Pattern identification',
      'Insight compilation',
      'Segment definitions'
    ]
  },
  {
    phase: 'Persona Creation',
    description: 'Develop detailed persona profiles',
    duration: '1-2 weeks',
    deliverables: [
      'Detailed persona documents',
      'Visual persona cards',
      'Journey maps',
      'Implementation guidelines'
    ]
  },
  {
    phase: 'Validation & Refinement',
    description: 'Test and refine personas with stakeholders',
    duration: '1 week',
    deliverables: [
      'Validated persona profiles',
      'Team training materials',
      'Usage guidelines',
      'Update methodology'
    ]
  }
];

const australianMarketConsiderations = [
  {
    factor: 'Cultural Diversity',
    description: 'Australia\'s multicultural population requires diverse persona considerations',
    implications: [
      'Language preferences and literacy levels',
      'Cultural values and decision-making styles',
      'Family structures and influences',
      'Religious and cultural celebrations'
    ]
  },
  {
    factor: 'Geographic Distribution',
    description: 'Urban vs regional differences in behavior and preferences',
    implications: [
      'Technology adoption rates',
      'Shopping and service preferences',
      'Income and lifestyle differences',
      'Access to services and infrastructure'
    ]
  },
  {
    factor: 'Economic Segments',
    description: 'Varied economic conditions across different regions and demographics',
    implications: [
      'Price sensitivity variations',
      'Spending priority differences',
      'Investment and saving behaviors',
      'Luxury vs necessity purchasing'
    ]
  },
  {
    factor: 'Digital Behavior',
    description: 'Unique Australian digital consumption patterns',
    implications: [
      'Social media platform preferences',
      'Mobile vs desktop usage',
      'E-commerce adoption rates',
      'Digital payment preferences'
    ]
  }
];

const personaTemplateElements = [
  {
    section: 'Basic Demographics',
    fields: [
      'Age range and generation',
      'Gender and family status',
      'Location and housing',
      'Education and career',
      'Income and financial status',
      'Lifestyle and interests'
    ]
  },
  {
    section: 'Psychographics',
    fields: [
      'Values and beliefs',
      'Personality traits',
      'Attitudes and opinions',
      'Lifestyle choices',
      'Motivations and fears',
      'Aspirations and goals'
    ]
  },
  {
    section: 'Behavioral Patterns',
    fields: [
      'Shopping behaviors',
      'Media consumption habits',
      'Technology usage',
      'Social media activity',
      'Information seeking patterns',
      'Decision-making process'
    ]
  },
  {
    section: 'Pain Points & Needs',
    fields: [
      'Primary challenges',
      'Frustrations and obstacles',
      'Unmet needs',
      'Current solutions',
      'Desired outcomes',
      'Success metrics'
    ]
  }
];

const industryPersonaExamples = [
  {
    industry: 'Professional Services',
    persona: 'Strategic Decision Maker',
    profile: {
      demographics: 'C-level executive, 45-55, Brisbane CBD',
      goals: 'Business growth, operational efficiency, competitive advantage',
      painPoints: 'Time constraints, information overload, ROI pressure',
      channels: 'LinkedIn, industry publications, peer recommendations'
    }
  },
  {
    industry: 'E-commerce',
    persona: 'Conscious Consumer',
    profile: {
      demographics: 'Millennial parent, 28-38, suburban Melbourne',
      goals: 'Quality products, value for money, convenience',
      painPoints: 'Product authenticity, delivery concerns, price comparison',
      channels: 'Instagram, product reviews, comparison sites'
    }
  },
  {
    industry: 'Healthcare',
    persona: 'Health-Conscious Researcher',
    profile: {
      demographics: 'Gen X professional, 40-50, various locations',
      goals: 'Health optimization, preventive care, family wellness',
      painPoints: 'Information credibility, appointment availability, cost',
      channels: 'Google search, health websites, referrals'
    }
  }
];

export default function PersonaDevelopmentContent() {
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
            Strategic Persona Development
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Build precise customer personas that drive targeted marketing, product development, 
            and customer experience strategies. Our research-based approach creates actionable 
            profiles that help Australian businesses connect authentically with their target audiences.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Users, label: 'Research Depth', value: '25+ data points' },
            { icon: Target, label: 'Targeting Accuracy', value: '85% improvement' },
            { icon: Brain, label: 'Insight Quality', value: '95% actionable' },
            { icon: Heart, label: 'Customer Connection', value: '+60% engagement' }
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

      {/* Persona Types */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Types of Personas We Develop</h2>
        <div className="space-y-8">
          {personaTypes.map((type, index) => (
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
                  <h4 className="text-lg font-semibold text-white mb-4">Key Elements</h4>
                  <ul className="space-y-2">
                    {type.elements.map((element, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Business Applications</h4>
                  <ul className="space-y-2">
                    {type.applications.map((application, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{application}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Research Methods */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Research Methodology</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {researchMethods.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{category.category}</h3>
              <div className="space-y-6">
                {category.methods.map((method, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">{method.name}</h4>
                    <p className="text-gray-300 mb-4">{method.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Timeline: {method.timeline}</span>
                      <span className="text-green-400">Sample: {method.sampleSize}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Development Process */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Persona Development Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {personaDevelopmentProcess.map((phase, index) => (
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
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Deliverables:</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <div key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {deliverable}
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

      {/* Australian Market Considerations */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Market Considerations</h2>
        <div className="space-y-6">
          {australianMarketConsiderations.map((consideration, index) => (
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
                <h4 className="text-lg font-semibold text-white mb-4">Key Implications</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {consideration.implications.map((implication, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-300">
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>{implication}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Persona Template */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Comprehensive Persona Template</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {personaTemplateElements.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">{section.section}</h3>
              <ul className="space-y-3">
                {section.fields.map((field, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{field}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Industry Examples */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Industry-Specific Persona Examples</h2>
        <div className="space-y-6">
          {industryPersonaExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{example.industry}</h3>
                  <p className="text-blue-400 font-semibold">{example.persona}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Demographics</h4>
                    <p className="text-gray-300">{example.profile.demographics}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Goals</h4>
                    <p className="text-gray-300">{example.profile.goals}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Pain Points</h4>
                    <p className="text-gray-300">{example.profile.painPoints}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Preferred Channels</h4>
                    <p className="text-gray-300">{example.profile.channels}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Implementation & Usage */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Persona Implementation Strategy</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Marketing Applications</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Campaign targeting and segmentation</li>
                <li>• Message and tone development</li>
                <li>• Channel selection and optimization</li>
                <li>• Content creation guidelines</li>
                <li>• Lead scoring and qualification</li>
                <li>• Customer journey mapping</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Product Development</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Feature prioritization decisions</li>
                <li>• User experience design</li>
                <li>• Product positioning strategy</li>
                <li>• Pricing and packaging models</li>
                <li>• Support and documentation</li>
                <li>• Beta testing recruitment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Sales & Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Sales script customization</li>
                <li>• Objection handling strategies</li>
                <li>• Follow-up sequences</li>
                <li>• Support documentation</li>
                <li>• Training program development</li>
                <li>• Customer success metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}