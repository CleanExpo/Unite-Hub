'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Search, TrendingUp, Target, AlertTriangle } from 'lucide-react';

export default function SEOAuditSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Your Free SEO Audit</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=seo-audit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free SEO Audit
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call SEO Expert
          </a>
          <a
            href="mailto:seo@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* SEO Audit Results */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Typical Audit Findings</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Critical Issues Found</span>
              <span className="text-white font-bold">15-25</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Traffic Increase Potential</span>
              <span className="text-white font-bold">+180%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Ranking Improvements</span>
              <span className="text-white font-bold">+4.2 positions</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Keywords Missing</span>
              <span className="text-white font-bold">50-100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free SEO Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free SEO Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/seo-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">SEO Audit Checklist</span>
          </a>
          <a
            href="/resources/technical-seo-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Technical SEO Guide</span>
          </a>
          <a
            href="/resources/keyword-research-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Keyword Research Template</span>
          </a>
          <a
            href="/resources/local-seo-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Brisbane Local SEO Guide</span>
          </a>
        </div>
      </div>

      {/* SEO Health Check */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick SEO Health Check</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-red-500 pl-4">
            <p className="text-sm font-semibold text-white">Critical Issues</p>
            <p className="text-xs text-gray-400 mt-1">
              Site speed, mobile issues, broken links
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Optimization Gaps</p>
            <p className="text-xs text-gray-400 mt-1">
              Missing meta tags, poor content structure
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Growth Opportunities</p>
            <p className="text-xs text-gray-400 mt-1">
              New keywords, content gaps, link building
            </p>
          </div>
        </div>
      </div>

      {/* SEO Investment Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Search className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">SEO Audit Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Basic Audit</span>
            <span className="text-white font-semibold">$1,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Comprehensive Audit</span>
            <span className="text-white font-semibold">$3,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Enterprise Audit</span>
            <span className="text-white font-semibold">$7,500</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Free audit available for qualified Brisbane businesses
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            AM
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Anna Mitchell</p>
            <p className="text-xs text-gray-400">Marketing Director, HealthPlus Brisbane</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The SEO audit revealed 23 critical issues we didn't know existed. After implementing 
          the recommendations, our organic traffic increased 220% and we're now ranking #1 for 
          our main keywords."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+220%</p>
            <p className="text-xs text-gray-400">Traffic Increase</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">#1</p>
            <p className="text-xs text-gray-400">Rankings</p>
          </div>
        </div>
      </div>

      {/* SEO Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our SEO Audit Tools</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-sm text-gray-300">Screaming Frog</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-sm text-gray-300">Ahrefs Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <span className="text-sm text-gray-300">SEMrush Professional</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm text-gray-300">Google Tools Suite</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related SEO Services</h3>
        <div className="space-y-3">
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Competitive Benchmarking
          </Link>
          <Link
            href="/competitive-analysis/tracker"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            SEO Performance Tracking
          </Link>
          <Link
            href="/market-research/industry-reports"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Search className="inline w-4 h-4 mr-2" />
            Keyword Research
          </Link>
        </div>
      </div>

      {/* Brisbane SEO Tips */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Brisbane SEO Tips</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Include "Brisbane" in key landing pages
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Optimize for mobile-first indexing
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Target local search features
          </li>
        </ul>
      </div>

      {/* Urgency Indicator */}
      <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-lg p-6">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Don't Wait</h3>
        <p className="text-sm text-gray-300 mb-4">
          Every day without proper SEO is lost traffic and revenue. Competitors are 
          gaining ground while technical issues hold you back.
        </p>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">-$500</div>
          <div className="text-xs text-gray-400">Daily revenue loss estimate</div>
        </div>
      </div>
    </aside>
  );
}