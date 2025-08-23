'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, TrendingUp, Users, DollarSign, Zap, Target, BarChart3 } from 'lucide-react';

export default function CaseStudiesSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Start Growth Strategy</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=growth-hacking"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Growth Consultation
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Growth Team
          </a>
          <a
            href="mailto:growth@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Specialists
          </a>
        </div>
      </div>

      {/* Case Study Results */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Average Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Revenue Growth</span>
              <span className="text-white font-bold">+180%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Customer Acquisition</span>
              <span className="text-white font-bold">+165%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-bold">+125%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Time to Results</span>
              <span className="text-white font-bold">3-6 months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Growth Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Growth Tools</h3>
        <div className="space-y-3">
          <a
            href="/resources/growth-hacking-playbook.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Growth Hacking Playbook</span>
          </a>
          <a
            href="/resources/aarrr-metrics-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">AARRR Metrics Template</span>
          </a>
          <a
            href="/resources/experiment-tracker.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Growth Experiment Tracker</span>
          </a>
          <a
            href="/resources/ice-prioritization-framework.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">ICE Prioritization Framework</span>
          </a>
        </div>
      </div>

      {/* Growth Hacking Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Growth Hacking Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Start with Data</p>
            <p className="text-xs text-gray-400 mt-1">
              Identify your biggest growth bottlenecks first
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Test Everything</p>
            <p className="text-xs text-gray-400 mt-1">
              Run systematic experiments to validate assumptions
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Focus on Retention</p>
            <p className="text-xs text-gray-400 mt-1">
              Keeping customers is cheaper than acquiring new ones
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Automate Success</p>
            <p className="text-xs text-gray-400 mt-1">
              Scale what works with automation and systems
            </p>
          </div>
        </div>
      </div>

      {/* Growth Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Growth Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Growth Audit</span>
            <span className="text-white font-semibold">$2,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Growth Strategy</span>
            <span className="text-white font-semibold">$8,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Full Implementation</span>
            <span className="text-white font-semibold">$15,000+</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *ROI typically 3-8x within 6-12 months
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
            JS
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Jake Sullivan</p>
            <p className="text-xs text-gray-400">CEO, TechFlow Solutions</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The growth hacking strategies transformed our SaaS business. We went from 2,500 
          to 7,200 monthly active users in 6 months, with churn dropping from 8.5% to 3.2%. 
          Revenue increased 240%."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+240%</p>
            <p className="text-xs text-gray-400">Revenue Growth</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">-65%</p>
            <p className="text-xs text-gray-400">Churn Reduction</p>
          </div>
        </div>
      </div>

      {/* Growth Frameworks */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Growth Frameworks</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm text-gray-300">AARRR (Pirate Metrics)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="text-sm text-gray-300">ICE Prioritization</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-sm text-gray-300">North Star Framework</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-sm text-gray-300">Lean Startup Method</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Growth Services</h3>
        <div className="space-y-3">
          <Link
            href="/growth-hacking/tools"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Growth Tools & Analytics
          </Link>
          <Link
            href="/growth-hacking/workshop"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Growth Strategy Workshop
          </Link>
          <Link
            href="/growth-hacking/guide"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Users className="inline w-4 h-4 mr-2" />
            Growth Implementation Guide
          </Link>
        </div>
      </div>

      {/* Experiment Success Rates */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Experiment Success Rates</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">A/B Testing</span>
            <span className="text-white font-semibold">78% success</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Onboarding Optimization</span>
            <span className="text-white font-semibold">85% success</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Referral Programs</span>
            <span className="text-white font-semibold">65% success</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Retention Campaigns</span>
            <span className="text-white font-semibold">72% success</span>
          </div>
        </div>
      </div>

      {/* Growth Metrics Tracking */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Key Growth Metrics</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Customer Acquisition Cost</span>
            <span className="text-blue-400">Track CAC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Lifetime Value</span>
            <span className="text-blue-400">Monitor CLV</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Activation Rate</span>
            <span className="text-blue-400">Optimize Flow</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Viral Coefficient</span>
            <span className="text-blue-400">Increase Referrals</span>
          </div>
        </div>
      </div>

      {/* Industry Focus */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Industry Expertise</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            SaaS & Technology platforms
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            E-commerce & marketplaces
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Mobile apps & digital products
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Professional services scaling
          </li>
        </ul>
      </div>

      {/* Growth Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Growth Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Initial Assessment</span>
            <span className="text-white font-semibold">Week 1-2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Strategy Development</span>
            <span className="text-white font-semibold">Week 3-4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Implementation Start</span>
            <span className="text-white font-semibold">Week 5-6</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">First Results</span>
            <span className="text-white font-semibold">Month 2-3</span>
          </div>
        </div>
      </div>

      {/* Growth Tools & Tech */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Growth Tech Stack</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Analytics</span>
            <span className="text-green-400">✓ Google Analytics 4</span>
          </div>
          <div className="flex justify-between">
            <span>A/B Testing</span>
            <span className="text-green-400">✓ Optimizely, VWO</span>
          </div>
          <div className="flex justify-between">
            <span>Automation</span>
            <span className="text-green-400">✓ Zapier, Make</span>
          </div>
          <div className="flex justify-between">
            <span>Email Marketing</span>
            <span className="text-green-400">✓ Mailchimp, Klaviyo</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Our Growth Edge</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Data-driven experiment design
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Australian market expertise
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Cross-industry best practices
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Rapid implementation capability
          </li>
        </ul>
      </div>
    </aside>
  );
}