'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Users, Target, Brain, TrendingUp, Search, BarChart3 } from 'lucide-react';

export default function PersonaDevelopmentSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Start Persona Development</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=persona-development"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Persona Workshop
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Research Team
          </a>
          <a
            href="mailto:personas@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* Persona Development Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Typical Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Marketing ROI Increase</span>
              <span className="text-white font-bold">+180%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Conversion Rate Lift</span>
              <span className="text-white font-bold">+65%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Customer Acquisition Cost</span>
              <span className="text-white font-bold">-45%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Campaign Relevance Score</span>
              <span className="text-white font-bold">9.2/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Persona Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Persona Tools</h3>
        <div className="space-y-3">
          <a
            href="/resources/persona-template.docx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Persona Development Template</span>
          </a>
          <a
            href="/resources/customer-interview-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Customer Interview Guide</span>
          </a>
          <a
            href="/resources/survey-questions-bank.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Survey Questions Bank</span>
          </a>
          <a
            href="/resources/persona-validation-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Persona Validation Checklist</span>
          </a>
        </div>
      </div>

      {/* Research Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Persona Development Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Start with Data</p>
            <p className="text-xs text-gray-400 mt-1">
              Use existing customer data before conducting new research
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Focus on Behaviors</p>
            <p className="text-xs text-gray-400 mt-1">
              What people do is more important than what they say
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Keep It Simple</p>
            <p className="text-xs text-gray-400 mt-1">
              3-5 primary personas are usually sufficient
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Regular Updates</p>
            <p className="text-xs text-gray-400 mt-1">
              Refresh personas every 12-18 months
            </p>
          </div>
        </div>
      </div>

      {/* Investment Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Users className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Research Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Basic Personas</span>
            <span className="text-white font-semibold">$4,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive Research</span>
            <span className="text-white font-semibold">$8,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Advanced Analytics</span>
            <span className="text-white font-semibold">$12,500</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Includes research, analysis, and implementation support
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            SL
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sarah Lee</p>
            <p className="text-xs text-gray-400">Marketing Director, TechFlow</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The persona research transformed our marketing. We went from generic campaigns 
          to highly targeted messages that resonate. Lead quality improved 200% and sales 
          cycles shortened by 6 weeks."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+200%</p>
            <p className="text-xs text-gray-400">Lead Quality</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">-6 weeks</p>
            <p className="text-xs text-gray-400">Sales Cycle</p>
          </div>
        </div>
      </div>

      {/* Research Methodology */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our Research Methods</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">1:1</span>
            </div>
            <span className="text-sm text-gray-300">Customer Interviews</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">FG</span>
            </div>
            <span className="text-sm text-gray-300">Focus Groups</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-sm text-gray-300">Surveys & Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">UX</span>
            </div>
            <span className="text-sm text-gray-300">User Testing</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Research Services</h3>
        <div className="space-y-3">
          <Link
            href="/market-research/surveys"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Customer Surveys
          </Link>
          <Link
            href="/market-research/industry-reports"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Industry Analysis
          </Link>
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Competitive Analysis
          </Link>
        </div>
      </div>

      {/* Sample Size Guidelines */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Sample Size Guidelines</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Customer Interviews</span>
            <span className="text-white font-semibold">15-25</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Focus Groups</span>
            <span className="text-white font-semibold">3-5 groups</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Survey Responses</span>
            <span className="text-white font-semibold">500-2000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">User Testing</span>
            <span className="text-white font-semibold">10-20 sessions</span>
          </div>
        </div>
      </div>

      {/* Research Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Project Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Research Planning</span>
            <span className="text-white font-semibold">Week 1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Data Collection</span>
            <span className="text-white font-semibold">Weeks 2-6</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Analysis & Synthesis</span>
            <span className="text-white font-semibold">Weeks 7-9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Persona Creation</span>
            <span className="text-white font-semibold">Weeks 10-11</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Our Research Advantage</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Deep Australian market knowledge
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Behavioral psychology expertise
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Advanced analytics capabilities
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Implementation support included
          </li>
        </ul>
      </div>

      {/* Quality Assurance */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quality Assurance</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Research Methodology</span>
            <span className="text-green-400">✓ Academic Standard</span>
          </div>
          <div className="flex justify-between">
            <span>Data Validation</span>
            <span className="text-green-400">✓ Multi-source</span>
          </div>
          <div className="flex justify-between">
            <span>Bias Mitigation</span>
            <span className="text-green-400">✓ Systematic</span>
          </div>
          <div className="flex justify-between">
            <span>Actionability Review</span>
            <span className="text-green-400">✓ Guaranteed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}