'use client';

import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Users, DollarSign, Repeat, Share2, Target, Lightbulb, Beaker } from 'lucide-react';

export default function GuideContent() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Chapter 1: Introduction */}
      <section id="introduction" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Chapter 1: What is Growth Hacking?</h2>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
          <p className="text-lg text-gray-300 leading-relaxed mb-0">
            Growth hacking is a process of rapid experimentation across marketing channels and product development 
            to identify the most efficient ways to grow a business. Unlike traditional marketing, growth hacking 
            focuses on low-cost and innovative alternatives to traditional marketing.
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-white mb-4">The Growth Hacker Mindset</h3>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Data-Driven:</strong> Every decision backed by metrics and analytics
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Experimental:</strong> Constant testing and iteration
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Scalable:</strong> Focus on tactics that can grow exponentially
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Product-Centric:</strong> Product as the primary growth driver
            </span>
          </li>
        </ul>

        <h3 className="text-2xl font-semibold text-white mb-4">Growth Hacking vs Traditional Marketing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-purple-400 mb-3">Growth Hacking</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Rapid experimentation</li>
              <li>• Low budget, high impact</li>
              <li>• Data-driven decisions</li>
              <li>• Cross-functional teams</li>
              <li>• Focus on growth metrics</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-cyan-400 mb-3">Traditional Marketing</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Long-term campaigns</li>
              <li>• Higher budgets</li>
              <li>• Brand-focused</li>
              <li>• Departmental silos</li>
              <li>• Focus on awareness</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Chapter 2: AARRR Framework */}
      <section id="aarrr-framework" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Chapter 2: The AARRR Framework (Pirate Metrics)</h2>
        
        <p className="text-lg text-gray-300 mb-6">
          The AARRR framework, also known as Pirate Metrics, is the foundation of growth hacking. 
          It breaks down the customer journey into five key stages, each with specific metrics and optimization strategies.
        </p>

        <div className="space-y-6">
          {/* Acquisition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-purple-400" />
              <h3 className="text-2xl font-bold text-white">Acquisition</h3>
            </div>
            <p className="text-gray-300 mb-3">How do users find you?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-purple-300 mb-2">Key Metrics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Traffic sources</li>
                  <li>• CAC (Customer Acquisition Cost)</li>
                  <li>• Conversion rates by channel</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-300 mb-2">Growth Tactics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• SEO optimization</li>
                  <li>• Content marketing</li>
                  <li>• Viral loops</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Activation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-900/20 to-transparent border-l-4 border-cyan-500 p-6 rounded-r-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl font-bold text-white">Activation</h3>
            </div>
            <p className="text-gray-300 mb-3">Do users have a great first experience?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Key Metrics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Activation rate</li>
                  <li>• Time to value</li>
                  <li>• Onboarding completion</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Growth Tactics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Simplified onboarding</li>
                  <li>• Interactive tutorials</li>
                  <li>• Quick wins</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Retention */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-500 p-6 rounded-r-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Repeat className="w-6 h-6 text-green-400" />
              <h3 className="text-2xl font-bold text-white">Retention</h3>
            </div>
            <p className="text-gray-300 mb-3">Do users come back?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-green-300 mb-2">Key Metrics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Churn rate</li>
                  <li>• DAU/MAU ratio</li>
                  <li>• Cohort retention</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-300 mb-2">Growth Tactics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Email nurturing</li>
                  <li>• Push notifications</li>
                  <li>• Feature updates</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-500 p-6 rounded-r-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-6 h-6 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">Revenue</h3>
            </div>
            <p className="text-gray-300 mb-3">How do you make money?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-yellow-300 mb-2">Key Metrics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• LTV (Lifetime Value)</li>
                  <li>• ARPU</li>
                  <li>• Conversion rate</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-300 mb-2">Growth Tactics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Pricing optimization</li>
                  <li>• Upselling</li>
                  <li>• Cross-selling</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Referral */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-pink-900/20 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Share2 className="w-6 h-6 text-pink-400" />
              <h3 className="text-2xl font-bold text-white">Referral</h3>
            </div>
            <p className="text-gray-300 mb-3">Do users tell others?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-pink-300 mb-2">Key Metrics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Viral coefficient</li>
                  <li>• NPS score</li>
                  <li>• Referral rate</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-pink-300 mb-2">Growth Tactics:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Referral programs</li>
                  <li>• Social sharing</li>
                  <li>• Incentives</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter 3: Growth Experimentation */}
      <section id="experimentation" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Chapter 3: Growth Experimentation Process</h2>
        
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Beaker className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">The Scientific Method for Growth</h3>
          </div>
          
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Analyze</h4>
                <p className="text-gray-400">Gather data and identify growth opportunities</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Ideate</h4>
                <p className="text-gray-400">Brainstorm hypotheses and potential solutions</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Prioritize</h4>
                <p className="text-gray-400">Use ICE scoring (Impact, Confidence, Ease)</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Test</h4>
                <p className="text-gray-400">Run controlled experiments</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">5</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Learn</h4>
                <p className="text-gray-400">Analyze results and document learnings</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Chapter 4: Growth Tactics */}
      <section id="tactics" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Chapter 4: Proven Growth Tactics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-6">
            <Lightbulb className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-3">Viral Loops</h3>
            <p className="text-gray-400 mb-3">Build mechanisms that encourage users to invite others</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Dropbox: Extra storage for referrals</li>
              <li>• Uber: Free rides for sharing</li>
              <li>• PayPal: $10 for new users</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/30 rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-3">Content Marketing</h3>
            <p className="text-gray-400 mb-3">Create valuable content that attracts and converts</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• HubSpot: Inbound marketing</li>
              <li>• Buffer: Transparency reports</li>
              <li>• Mint: Personal finance blog</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-12 p-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Ready to Implement Growth Hacking?</h2>
        <p className="text-gray-300 text-center mb-6">
          Get expert guidance from our team of growth professionals who've helped 100+ companies achieve exponential growth.
        </p>
        <div className="flex justify-center">
          <a
            href="/contact?service=growth-hacking"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Get Your Free Growth Audit
          </a>
        </div>
      </section>
    </article>
  );
}