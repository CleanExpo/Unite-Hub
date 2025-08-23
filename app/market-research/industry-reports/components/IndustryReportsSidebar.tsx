'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, FileText, TrendingUp, BarChart3, Globe, Search, Target } from 'lucide-react';

export default function IndustryReportsSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Request Industry Report</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=industry-reports"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Report Consultation
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Research Team
          </a>
          <a
            href="mailto:reports@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Analysts
          </a>
        </div>
      </div>

      {/* Report Impact Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Report Impact</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Strategic Clarity</span>
              <span className="text-white font-bold">+95%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Investment Decision Speed</span>
              <span className="text-white font-bold">+60%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Market Entry Success</span>
              <span className="text-white font-bold">85%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">ROI on Intelligence</span>
              <span className="text-white font-bold">8:1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Industry Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Industry Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/australian-market-overview-2024.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Australian Market Overview 2024</span>
          </a>
          <a
            href="/resources/industry-research-methodology.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Research Methodology Guide</span>
          </a>
          <a
            href="/resources/market-sizing-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Market Sizing Template</span>
          </a>
          <a
            href="/resources/competitive-landscape-framework.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Competitive Analysis Framework</span>
          </a>
        </div>
      </div>

      {/* Industry Research Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Research Best Practices</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Define Clear Objectives</p>
            <p className="text-xs text-gray-400 mt-1">
              Start with specific business questions you need answered
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Mix Data Sources</p>
            <p className="text-xs text-gray-400 mt-1">
              Combine primary and secondary research for complete picture
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Focus on Trends</p>
            <p className="text-xs text-gray-400 mt-1">
              Look beyond current state to future opportunities
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Validate Findings</p>
            <p className="text-xs text-gray-400 mt-1">
              Cross-reference data from multiple reliable sources
            </p>
          </div>
        </div>
      </div>

      {/* Report Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <FileText className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Report Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Industry Brief</span>
            <span className="text-white font-semibold">$3,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive Report</span>
            <span className="text-white font-semibold">$12,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Custom Research</span>
            <span className="text-white font-semibold">$25,000+</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Includes data analysis, insights, and strategic recommendations
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
            RT
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Rachel Thompson</p>
            <p className="text-xs text-gray-400">Strategy Director, InnovateTech</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The industry report provided critical insights that shaped our $50M market entry strategy. 
          The depth of analysis and Australian market expertise was exceptional. We achieved 150% 
          of our first-year targets."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">$50M</p>
            <p className="text-xs text-gray-400">Strategy Value</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">150%</p>
            <p className="text-xs text-gray-400">Target Achievement</p>
          </div>
        </div>
      </div>

      {/* Research Coverage */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Industry Coverage</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-sm text-gray-300">Technology & Software</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-sm text-gray-300">Healthcare & Medical</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-sm text-gray-300">Financial Services</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-sm text-gray-300">Retail & E-commerce</span>
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
            Market Surveys
          </Link>
          <Link
            href="/market-research/persona-development"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Persona Development
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

      {/* Report Delivery Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Delivery Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Industry Brief</span>
            <span className="text-white font-semibold">2-3 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Standard Report</span>
            <span className="text-white font-semibold">6-8 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive Analysis</span>
            <span className="text-white font-semibold">10-12 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Custom Research</span>
            <span className="text-white font-semibold">12-16 weeks</span>
          </div>
        </div>
      </div>

      {/* Data Quality Assurance */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Quality Assurance</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Multi-source data validation
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Expert review and verification
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Statistical significance testing
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Bias detection and mitigation
          </li>
        </ul>
      </div>

      {/* Sample Report Sections */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Typical Report Sections</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Executive Summary</span>
            <span className="text-blue-400">5-8 pages</span>
          </div>
          <div className="flex justify-between">
            <span>Market Overview</span>
            <span className="text-blue-400">15-20 pages</span>
          </div>
          <div className="flex justify-between">
            <span>Competitive Landscape</span>
            <span className="text-blue-400">20-25 pages</span>
          </div>
          <div className="flex justify-between">
            <span>Trend Analysis</span>
            <span className="text-blue-400">15-20 pages</span>
          </div>
          <div className="flex justify-between">
            <span>Strategic Recommendations</span>
            <span className="text-blue-400">10-15 pages</span>
          </div>
          <div className="flex justify-between">
            <span>Appendices & Data</span>
            <span className="text-blue-400">20-30 pages</span>
          </div>
        </div>
      </div>

      {/* Market Intelligence Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Research Tools Used</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Primary Research</span>
            <span className="text-green-400">✓ Expert Interviews</span>
          </div>
          <div className="flex justify-between">
            <span>Market Data</span>
            <span className="text-green-400">✓ IBISWorld, ABS</span>
          </div>
          <div className="flex justify-between">
            <span>Analytics</span>
            <span className="text-green-400">✓ Statistical Models</span>
          </div>
          <div className="flex justify-between">
            <span>Validation</span>
            <span className="text-green-400">✓ Multi-source</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Our Research Edge</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            15+ years Australian market expertise
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Extensive industry network access
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Proprietary research methodologies
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Real-time market monitoring
          </li>
        </ul>
      </div>
    </aside>
  );
}