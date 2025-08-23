'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Calculator, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export default function ROICalculatorSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Expert ROI Analysis</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=roi-analysis"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free ROI Audit
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Analytics Expert
          </a>
          <a
            href="mailto:analytics@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* ROI Quick Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Average Client Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">ROAS Improvement</span>
              <span className="text-white font-bold">+180%</span>
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
              <span className="text-gray-400">ROI Increase</span>
              <span className="text-white font-bold">+235%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Time to Positive ROI</span>
              <span className="text-white font-bold">30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free ROI Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free ROI Tools & Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/roi-calculator-spreadsheet.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Advanced ROI Calculator</span>
          </a>
          <a
            href="/resources/attribution-model-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Attribution Modeling Guide</span>
          </a>
          <a
            href="/resources/industry-benchmarks.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Industry Benchmark Report</span>
          </a>
          <a
            href="/resources/ga4-setup-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">GA4 Tracking Setup Guide</span>
          </a>
        </div>
      </div>

      {/* ROI Optimization Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick ROI Wins</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Implement Proper Tracking</p>
            <p className="text-xs text-gray-400 mt-1">
              Accurate data = better optimization decisions
            </p>
          </div>
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Focus on High-LTV Customers</p>
            <p className="text-xs text-gray-400 mt-1">
              Target audiences with higher lifetime value
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Optimize Landing Pages</p>
            <p className="text-xs text-gray-400 mt-1">
              Improve conversion rates with better UX
            </p>
          </div>
        </div>
      </div>

      {/* ROI Calculator Features */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Calculator className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Calculator Features</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Real-time ROI calculations
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Industry benchmark comparisons
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Multi-platform analytics
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Optimization recommendations
          </li>
        </ul>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            RL
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Rachel Lee</p>
            <p className="text-xs text-gray-400">Marketing Manager, FitnessPro</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The ROI calculator helped us identify that our Google Ads were underperforming. 
          After optimization, we increased ROAS from 2.1x to 5.8x in just 3 months!"
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">5.8x</p>
            <p className="text-xs text-gray-400">Final ROAS</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">+176%</p>
            <p className="text-xs text-gray-400">ROI Increase</p>
          </div>
        </div>
      </div>

      {/* Analytics Certifications */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our Analytics Expertise</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">GA</span>
            </div>
            <span className="text-sm text-gray-300">Google Analytics Certified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">f</span>
            </div>
            <span className="text-sm text-gray-300">Facebook Analytics Expert</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm text-gray-300">Google Ads Certified</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Analytics Services</h3>
        <div className="space-y-3">
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Competitive Benchmarking
          </Link>
          <Link
            href="/social-advertising/facebook-ads"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Facebook Ads Optimization
          </Link>
          <Link
            href="/growth-hacking/case-studies"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <DollarSign className="inline w-4 h-4 mr-2" />
            Growth Case Studies
          </Link>
        </div>
      </div>

      {/* ROI Guarantee */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">ROI Guarantee</h3>
        <p className="text-sm text-gray-300 mb-4">
          We're so confident in our optimization strategies, we guarantee a 
          minimum 20% improvement in your ROAS within 90 days.
        </p>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">20%+</div>
          <div className="text-xs text-gray-400">Minimum ROAS Improvement</div>
        </div>
      </div>

      {/* Budget Planning Tool */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Budget Planning Guide</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Testing Phase</span>
            <span className="text-white font-semibold">$1K-3K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Scaling Phase</span>
            <span className="text-white font-semibold">$3K-10K/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Growth Phase</span>
            <span className="text-white font-semibold">$10K+/month</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Recommended budgets for optimal ROI
        </p>
      </div>
    </aside>
  );
}