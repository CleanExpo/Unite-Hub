'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Briefcase, Users, Target, TrendingUp } from 'lucide-react';

export default function LinkedInB2BSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Your B2B Strategy Audit</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=linkedin-b2b-audit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free B2B Audit
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call B2B Experts
          </a>
          <a
            href="mailto:b2b@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* B2B Performance Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">B2B Campaign Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Lead Quality Increase</span>
              <span className="text-white font-bold">3.2x</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Cost Per Lead</span>
              <span className="text-white font-bold">-52%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-bold">6.8%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Sales Qualified Leads</span>
              <span className="text-white font-bold">+240%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free B2B Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free B2B Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/b2b-targeting-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">B2B Targeting Guide</span>
          </a>
          <a
            href="/resources/linkedin-ad-templates.zip"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">LinkedIn Ad Templates</span>
          </a>
          <a
            href="/resources/abm-playbook.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">ABM Playbook</span>
          </a>
          <a
            href="/resources/b2b-roi-calculator.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">B2B ROI Calculator</span>
          </a>
        </div>
      </div>

      {/* B2B Industry Insights */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Australian B2B Insights</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Decision Maker Reach</p>
            <p className="text-xs text-gray-400 mt-1">
              11M+ professionals including 500K+ executives
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Best Performing Time</p>
            <p className="text-xs text-gray-400 mt-1">
              Tuesday-Thursday, 9 AM - 11 AM AEST
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Content Preference</p>
            <p className="text-xs text-gray-400 mt-1">
              Industry insights and thought leadership
            </p>
          </div>
        </div>
      </div>

      {/* LinkedIn Investment Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Briefcase className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">B2B Ad Spend Guide</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Startup/SMB</span>
            <span className="text-white font-semibold">$1K-5K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Mid-Market</span>
            <span className="text-white font-semibold">$5K-20K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Enterprise</span>
            <span className="text-white font-semibold">$20K+/month</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Based on average customer lifetime value
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            SJ
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sarah Johnson</p>
            <p className="text-xs text-gray-400">VP Marketing, TechSolutions Brisbane</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "Our LinkedIn campaigns now generate 300% more qualified leads. The ABM approach 
          helped us close 2 enterprise deals worth $500K each within 6 months."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">$1M+</p>
            <p className="text-xs text-gray-400">Pipeline Generated</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">300%</p>
            <p className="text-xs text-gray-400">Lead Quality</p>
          </div>
        </div>
      </div>

      {/* Industry Certifications */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our Certifications</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">in</span>
            </div>
            <span className="text-sm text-gray-300">LinkedIn Marketing Solutions Certified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">ABM</span>
            </div>
            <span className="text-sm text-gray-300">Account-Based Marketing Expert</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B2B</span>
            </div>
            <span className="text-sm text-gray-300">B2B Marketing Specialist</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related B2B Services</h3>
        <div className="space-y-3">
          <Link
            href="/social-advertising/facebook-ads"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Facebook B2B Advertising
          </Link>
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Competitive Analysis
          </Link>
          <Link
            href="/market-research/persona-development"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Users className="inline w-4 h-4 mr-2" />
            Buyer Persona Development
          </Link>
        </div>
      </div>

      {/* LinkedIn Premium Tips */}
      <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Pro Tips for Brisbane B2B</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Target ASX 200 companies for enterprise deals
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Focus on financial year planning periods
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Leverage local business events and conferences
          </li>
        </ul>
      </div>
    </aside>
  );
}