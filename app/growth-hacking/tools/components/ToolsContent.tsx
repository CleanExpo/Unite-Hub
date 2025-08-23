'use client';

import { motion } from 'framer-motion';
import { BarChart3, Mail, Users, Beaker, Target, TrendingUp, Share2, Code, Star, DollarSign } from 'lucide-react';

const toolCategories = [
  {
    name: 'Analytics & Tracking',
    icon: BarChart3,
    color: 'purple',
    tools: [
      {
        name: 'Google Analytics',
        description: 'Free web analytics service',
        pricing: 'Free',
        rating: 4.5,
        bestFor: 'All businesses'
      },
      {
        name: 'Mixpanel',
        description: 'Product analytics for mobile and web',
        pricing: 'From $25/month',
        rating: 4.6,
        bestFor: 'SaaS & Apps'
      },
      {
        name: 'Amplitude',
        description: 'Digital analytics platform',
        pricing: 'Free tier available',
        rating: 4.7,
        bestFor: 'Product teams'
      },
      {
        name: 'Segment',
        description: 'Customer data platform',
        pricing: 'From $120/month',
        rating: 4.5,
        bestFor: 'Data integration'
      }
    ]
  },
  {
    name: 'A/B Testing',
    icon: Beaker,
    color: 'cyan',
    tools: [
      {
        name: 'Optimizely',
        description: 'Enterprise experimentation platform',
        pricing: 'Custom pricing',
        rating: 4.4,
        bestFor: 'Enterprise'
      },
      {
        name: 'VWO',
        description: 'Conversion optimization platform',
        pricing: 'From $199/month',
        rating: 4.3,
        bestFor: 'Mid-market'
      },
      {
        name: 'Google Optimize',
        description: 'Free A/B testing tool',
        pricing: 'Free',
        rating: 4.2,
        bestFor: 'Small business'
      },
      {
        name: 'AB Tasty',
        description: 'Customer experience optimization',
        pricing: 'Custom pricing',
        rating: 4.4,
        bestFor: 'E-commerce'
      }
    ]
  },
  {
    name: 'Email Marketing',
    icon: Mail,
    color: 'green',
    tools: [
      {
        name: 'Mailchimp',
        description: 'All-in-one marketing platform',
        pricing: 'Free tier available',
        rating: 4.3,
        bestFor: 'Small business'
      },
      {
        name: 'SendGrid',
        description: 'Email delivery service',
        pricing: 'From $15/month',
        rating: 4.2,
        bestFor: 'Developers'
      },
      {
        name: 'Klaviyo',
        description: 'E-commerce email marketing',
        pricing: 'From $20/month',
        rating: 4.6,
        bestFor: 'E-commerce'
      },
      {
        name: 'ConvertKit',
        description: 'Creator marketing platform',
        pricing: 'From $29/month',
        rating: 4.4,
        bestFor: 'Creators'
      }
    ]
  },
  {
    name: 'Social Media',
    icon: Share2,
    color: 'pink',
    tools: [
      {
        name: 'Buffer',
        description: 'Social media management',
        pricing: 'From $15/month',
        rating: 4.3,
        bestFor: 'Small teams'
      },
      {
        name: 'Hootsuite',
        description: 'Social media dashboard',
        pricing: 'From $49/month',
        rating: 4.1,
        bestFor: 'Agencies'
      },
      {
        name: 'Sprout Social',
        description: 'Social media management',
        pricing: 'From $99/month',
        rating: 4.4,
        bestFor: 'Enterprise'
      },
      {
        name: 'Later',
        description: 'Visual social media planner',
        pricing: 'From $18/month',
        rating: 4.5,
        bestFor: 'Visual content'
      }
    ]
  },
  {
    name: 'Customer Engagement',
    icon: Users,
    color: 'orange',
    tools: [
      {
        name: 'Intercom',
        description: 'Customer messaging platform',
        pricing: 'From $39/month',
        rating: 4.5,
        bestFor: 'Customer support'
      },
      {
        name: 'Drift',
        description: 'Conversational marketing',
        pricing: 'From $50/month',
        rating: 4.3,
        bestFor: 'B2B sales'
      },
      {
        name: 'Hotjar',
        description: 'Behavior analytics',
        pricing: 'Free tier available',
        rating: 4.3,
        bestFor: 'UX insights'
      },
      {
        name: 'FullStory',
        description: 'Digital experience analytics',
        pricing: 'Custom pricing',
        rating: 4.6,
        bestFor: 'Product teams'
      }
    ]
  },
  {
    name: 'Automation',
    icon: Code,
    color: 'indigo',
    tools: [
      {
        name: 'Zapier',
        description: 'Workflow automation',
        pricing: 'From $19.99/month',
        rating: 4.5,
        bestFor: 'No-code automation'
      },
      {
        name: 'Make (Integromat)',
        description: 'Visual automation platform',
        pricing: 'From $9/month',
        rating: 4.4,
        bestFor: 'Complex workflows'
      },
      {
        name: 'HubSpot',
        description: 'Marketing automation',
        pricing: 'Free tier available',
        rating: 4.4,
        bestFor: 'Inbound marketing'
      },
      {
        name: 'ActiveCampaign',
        description: 'Customer experience automation',
        pricing: 'From $29/month',
        rating: 4.5,
        bestFor: 'Email automation'
      }
    ]
  }
];

export default function ToolsContent() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">The Ultimate Growth Hacking Toolkit</h2>
        <p className="text-lg text-gray-300 mb-6">
          We've tested hundreds of growth tools so you don't have to. This comprehensive guide covers the 
          best tools across every category, with honest reviews, pricing comparisons, and recommendations 
          based on your business stage and needs.
        </p>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-3">How We Evaluate Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="text-gray-300">✅ Real-world testing (minimum 30 days)</li>
              <li className="text-gray-300">✅ ROI analysis and value assessment</li>
              <li className="text-gray-300">✅ Ease of use and learning curve</li>
            </ul>
            <ul className="space-y-2">
              <li className="text-gray-300">✅ Integration capabilities</li>
              <li className="text-gray-300">✅ Customer support quality</li>
              <li className="text-gray-300">✅ Scalability and pricing tiers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      {toolCategories.map((category, categoryIndex) => (
        <motion.section
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl bg-gradient-to-r from-${category.color}-500 to-${category.color}-600`}>
              <category.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{category.name}</h2>
          </div>

          <div className="grid gap-4">
            {category.tools.map((tool, toolIndex) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: toolIndex * 0.05 }}
                className="bg-slate-800/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{tool.name}</h3>
                    <p className="text-gray-400">{tool.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-white font-medium">{tool.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">Best for: {tool.bestFor}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">{tool.pricing}</span>
                  </div>
                  <a
                    href={`#${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Learn more →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}

      {/* Tool Stack Recommendations */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Recommended Tool Stacks by Business Stage</h2>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-900/30 to-transparent border-l-4 border-green-500 p-6 rounded-r-xl">
            <h3 className="text-xl font-bold text-white mb-3">🌱 Startup Stack (Under $100/month)</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Analytics:</strong> Google Analytics (Free)</li>
              <li>• <strong>Email:</strong> Mailchimp Free Tier</li>
              <li>• <strong>A/B Testing:</strong> Google Optimize (Free)</li>
              <li>• <strong>Social:</strong> Buffer Free</li>
              <li>• <strong>Heatmaps:</strong> Hotjar Free</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-900/30 to-transparent border-l-4 border-blue-500 p-6 rounded-r-xl">
            <h3 className="text-xl font-bold text-white mb-3">🚀 Growth Stage ($500-1000/month)</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Analytics:</strong> Mixpanel + Google Analytics</li>
              <li>• <strong>Email:</strong> Klaviyo or ConvertKit</li>
              <li>• <strong>A/B Testing:</strong> VWO</li>
              <li>• <strong>Automation:</strong> Zapier</li>
              <li>• <strong>Support:</strong> Intercom</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
            <h3 className="text-xl font-bold text-white mb-3">🏢 Enterprise ($2000+/month)</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Analytics:</strong> Amplitude + Segment</li>
              <li>• <strong>Testing:</strong> Optimizely</li>
              <li>• <strong>Marketing:</strong> HubSpot Enterprise</li>
              <li>• <strong>Social:</strong> Sprout Social</li>
              <li>• <strong>Experience:</strong> FullStory</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tool Selection Guide */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">How to Choose the Right Tools</h2>
        
        <div className="bg-slate-800/50 rounded-xl p-8">
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <h4 className="font-semibold text-white mb-2">Define Your Growth Metrics</h4>
                <p className="text-gray-400">Identify which AARRR metrics you need to improve first. This determines your tool priorities.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <h4 className="font-semibold text-white mb-2">Assess Your Technical Capabilities</h4>
                <p className="text-gray-400">Choose tools that match your team's technical skills. No-code tools for non-technical teams.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <h4 className="font-semibold text-white mb-2">Start with Free Trials</h4>
                <p className="text-gray-400">Test tools with free trials before committing. Most offer 14-30 day trials.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
              <div>
                <h4 className="font-semibold text-white mb-2">Check Integration Capabilities</h4>
                <p className="text-gray-400">Ensure tools integrate with your existing stack. Use Zapier for custom integrations.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">5</span>
              <div>
                <h4 className="font-semibold text-white mb-2">Calculate ROI</h4>
                <p className="text-gray-400">Track the ROI of each tool. If it doesn't pay for itself in 3 months, reconsider.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-12 p-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Need Help Choosing the Right Tools?</h2>
        <p className="text-gray-300 text-center mb-6">
          Our growth experts will analyze your needs and recommend the perfect tool stack for your business.
        </p>
        <div className="flex justify-center">
          <a
            href="/contact?service=growth-tools-consultation"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Get Free Tool Recommendations
          </a>
        </div>
      </section>
    </article>
  );
}