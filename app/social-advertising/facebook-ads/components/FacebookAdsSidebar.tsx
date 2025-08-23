'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Target, TrendingUp, Users, Zap } from 'lucide-react';

export default function FacebookAdsSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Your Facebook Ads Audit</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=facebook-ads-audit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Audit
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </a>
          <a
            href="mailto:facebook@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Campaign Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Average ROAS</span>
              <span className="text-white font-bold">4.2x</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">CTR Improvement</span>
              <span className="text-white font-bold">+85%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">CPA Reduction</span>
              <span className="text-white font-bold">-45%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-bold">8.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Facebook Ads Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/facebook-ads-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Facebook Ads Setup Checklist</span>
          </a>
          <a
            href="/resources/audience-targeting-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Audience Targeting Guide</span>
          </a>
          <a
            href="/resources/creative-templates.zip"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Ad Creative Templates</span>
          </a>
          <a
            href="/resources/facebook-ads-roi-calculator.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">ROI Calculator</span>
          </a>
        </div>
      </div>

      {/* Quick Wins */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Wins for Brisbane Businesses</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Local Targeting</p>
            <p className="text-xs text-gray-400 mt-1">
              Target Brisbane metropolitan area for 25% better engagement
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Video Content</p>
            <p className="text-xs text-gray-400 mt-1">
              Video ads see 3x higher engagement rates
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Mobile Optimization</p>
            <p className="text-xs text-gray-400 mt-1">
              89% of Aussies use mobile - optimize accordingly
            </p>
          </div>
        </div>
      </div>

      {/* Investment Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Target className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Ad Spend Guidelines</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Small Business</span>
            <span className="text-white font-semibold">$500-2K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Medium Business</span>
            <span className="text-white font-semibold">$2K-10K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Enterprise</span>
            <span className="text-white font-semibold">$10K+/month</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Budgets vary by industry and competition
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            MC
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mike Chen</p>
            <p className="text-xs text-gray-400">E-commerce Director, Brisbane</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic">
          "Our Facebook ads were burning money until Unite Group stepped in. They increased our 
          ROAS from 1.8x to 4.6x and reduced our cost per acquisition by 60%. Game changer!"
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+156%</p>
            <p className="text-xs text-gray-400">ROAS Increase</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">-60%</p>
            <p className="text-xs text-gray-400">CPA Reduction</p>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Services</h3>
        <div className="space-y-3">
          <Link
            href="/social-advertising/linkedin-b2b"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            LinkedIn B2B Advertising
          </Link>
          <Link
            href="/social-advertising/roi-calculator"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Zap className="inline w-4 h-4 mr-2" />
            Social ROI Calculator
          </Link>
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Users className="inline w-4 h-4 mr-2" />
            Competitive Benchmarking
          </Link>
        </div>
      </div>

      {/* Facebook Certification */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">f</span>
          </div>
          <h3 className="text-sm font-bold text-white mb-2">Facebook Certified</h3>
          <p className="text-xs text-gray-400">
            Our team holds official Facebook Blueprint certifications
          </p>
        </div>
      </div>
    </aside>
  );
}