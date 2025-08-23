'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, BarChart3, TrendingUp, Target, Search } from 'lucide-react';

export default function BenchmarkingSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Your Competitive Analysis</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=competitive-benchmarking"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Benchmark Report
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Strategy Team
          </a>
          <a
            href="mailto:benchmarking@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* Benchmarking Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Typical Improvements</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Performance Increase</span>
              <span className="text-white font-bold">+85%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Competitive Gaps Found</span>
              <span className="text-white font-bold">15-25</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Market Position Gain</span>
              <span className="text-white font-bold">+3 ranks</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">ROI Improvement</span>
              <span className="text-white font-bold">+120%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Benchmarking Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Analysis Tools</h3>
        <div className="space-y-3">
          <a
            href="/resources/competitor-analysis-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Competitor Analysis Template</span>
          </a>
          <a
            href="/resources/benchmarking-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Benchmarking Checklist</span>
          </a>
          <a
            href="/resources/industry-benchmark-report.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Australian Industry Benchmarks</span>
          </a>
          <a
            href="/resources/competitive-intelligence-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Competitive Intelligence Guide</span>
          </a>
        </div>
      </div>

      {/* Quick Analysis Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Analysis Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Monitor Regularly</p>
            <p className="text-xs text-gray-400 mt-1">
              Track competitor changes monthly for best insights
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Focus on Leaders</p>
            <p className="text-xs text-gray-400 mt-1">
              Analyze top 3-5 competitors for maximum impact
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Action-Oriented</p>
            <p className="text-xs text-gray-400 mt-1">
              Turn insights into concrete improvement strategies
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Investment Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <BarChart3 className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Analysis Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Basic Report</span>
            <span className="text-white font-semibold">$2,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive Analysis</span>
            <span className="text-white font-semibold">$5,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Ongoing Monitoring</span>
            <span className="text-white font-semibold">$1,200/month</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *ROI typically 5-10x within 6 months
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            DW
          </div>
          <div>
            <p className="text-sm font-semibold text-white">David Wilson</p>
            <p className="text-xs text-gray-400">CEO, TechStart Brisbane</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The competitive analysis revealed 12 gaps in our strategy. Within 6 months of 
          implementing the recommendations, we increased our market share by 35% and revenue by 60%."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+35%</p>
            <p className="text-xs text-gray-400">Market Share</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">+60%</p>
            <p className="text-xs text-gray-400">Revenue Growth</p>
          </div>
        </div>
      </div>

      {/* Analysis Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our Analysis Tools</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <span className="text-sm text-gray-300">SEMrush Professional</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-sm text-gray-300">Ahrefs Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <span className="text-sm text-gray-300">SimilarWeb Pro</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Analysis Services</h3>
        <div className="space-y-3">
          <Link
            href="/competitive-analysis/seo-audit"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Search className="inline w-4 h-4 mr-2" />
            SEO Competitive Audit
          </Link>
          <Link
            href="/competitive-analysis/tracker"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Competitor Tracking
          </Link>
          <Link
            href="/market-research/industry-reports"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Industry Analysis
          </Link>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Competitive Advantage</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            10+ years Brisbane market experience
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Access to premium analysis tools
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Industry-specific expertise
          </li>
        </ul>
      </div>

      {/* Frequency Recommendations */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Analysis Frequency</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Startup/High Growth</span>
            <span className="text-white font-semibold">Monthly</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Established Business</span>
            <span className="text-white font-semibold">Quarterly</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Mature Market</span>
            <span className="text-white font-semibold">Bi-annually</span>
          </div>
        </div>
      </div>
    </aside>
  );
}