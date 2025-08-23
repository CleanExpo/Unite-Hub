'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Users, BarChart3, Target, MessageSquare, TrendingUp, Search } from 'lucide-react';

export default function SurveysSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Start Survey Project</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=survey-research"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Survey Consultation
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Research Team
          </a>
          <a
            href="mailto:surveys@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Specialists
          </a>
        </div>
      </div>

      {/* Survey Performance Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Survey Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Response Rate</span>
              <span className="text-white font-bold">78%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Data Quality Score</span>
              <span className="text-white font-bold">96%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Statistical Accuracy</span>
              <span className="text-white font-bold">±2.8%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Client Satisfaction</span>
              <span className="text-white font-bold">9.4/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Survey Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Survey Tools</h3>
        <div className="space-y-3">
          <a
            href="/resources/survey-design-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Survey Design Best Practices</span>
          </a>
          <a
            href="/resources/question-bank-templates.docx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Question Bank Templates</span>
          </a>
          <a
            href="/resources/sample-size-calculator.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Sample Size Calculator</span>
          </a>
          <a
            href="/resources/data-analysis-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Data Analysis Template</span>
          </a>
        </div>
      </div>

      {/* Survey Design Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Survey Design Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Keep It Short</p>
            <p className="text-xs text-gray-400 mt-1">
              Aim for 5-10 minutes completion time for best response rates
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Test Before Launch</p>
            <p className="text-xs text-gray-400 mt-1">
              Pilot test with 10-20 people to identify issues
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Mobile-First Design</p>
            <p className="text-xs text-gray-400 mt-1">
              60%+ of responses come from mobile devices
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Use Incentives Wisely</p>
            <p className="text-xs text-gray-400 mt-1">
              Appropriate incentives can double response rates
            </p>
          </div>
        </div>
      </div>

      {/* Survey Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Users className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Survey Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Basic Survey (n=500)</span>
            <span className="text-white font-semibold">$2,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive (n=1500)</span>
            <span className="text-white font-semibold">$6,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">National Study (n=2500)</span>
            <span className="text-white font-semibold">$12,500</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Includes design, data collection, analysis, and reporting
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
            AM
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Alex Murphy</p>
            <p className="text-xs text-gray-400">Head of Marketing, GrowthCorp</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The customer satisfaction survey revealed critical insights that led to a 40% 
          increase in NPS scores. The methodology was rigorous and the insights were 
          immediately actionable."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+40%</p>
            <p className="text-xs text-gray-400">NPS Increase</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">2,500</p>
            <p className="text-xs text-gray-400">Responses</p>
          </div>
        </div>
      </div>

      {/* Survey Platforms */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Survey Platforms</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-sm text-gray-300">Qualtrics Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-sm text-gray-300">SurveyMonkey Premier</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-sm text-gray-300">Typeform Professional</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-sm text-gray-300">Custom Development</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Research Services</h3>
        <div className="space-y-3">
          <Link
            href="/market-research/persona-development"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Persona Development
          </Link>
          <Link
            href="/market-research/industry-reports"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Industry Reports
          </Link>
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Competitive Analysis
          </Link>
        </div>
      </div>

      {/* Response Rate Optimization */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Response Rate Factors</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Survey Length</span>
            <span className="text-white font-semibold">5-10 min optimal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Mobile Optimization</span>
            <span className="text-white font-semibold">+25% response</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Personalization</span>
            <span className="text-white font-semibold">+15% response</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Follow-up Reminders</span>
            <span className="text-white font-semibold">+30% response</span>
          </div>
        </div>
      </div>

      {/* Sample Size Guidelines */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Australian Sample Sizes</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">National Consumer</span>
            <span className="text-white font-semibold">1,200-2,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Metro Market</span>
            <span className="text-white font-semibold">400-800</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Business Leaders</span>
            <span className="text-white font-semibold">300-600</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Niche Audiences</span>
            <span className="text-white font-semibold">200-400</span>
          </div>
        </div>
      </div>

      {/* Data Quality Assurance */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Quality Assurance</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Response quality monitoring
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Statistical significance testing
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Bias detection and correction
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Privacy and compliance adherence
          </li>
        </ul>
      </div>

      {/* Survey Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Project Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Design & Setup</span>
            <span className="text-white font-semibold">1-2 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Data Collection</span>
            <span className="text-white font-semibold">2-4 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Analysis & Reporting</span>
            <span className="text-white font-semibold">2-3 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Total Project</span>
            <span className="text-white font-semibold">5-9 weeks</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Our Survey Advantage</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Advanced statistical expertise
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Australian market specialization
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Multi-modal survey capabilities
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Real-time analytics dashboards
          </li>
        </ul>
      </div>
    </aside>
  );
}