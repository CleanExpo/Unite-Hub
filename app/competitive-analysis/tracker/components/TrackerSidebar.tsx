'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Activity, TrendingUp, Bell, BarChart3, Eye, Zap } from 'lucide-react';

export default function TrackerSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Start Competitor Tracking</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=competitor-tracking"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Tracking Setup
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Intelligence Team
          </a>
          <a
            href="mailto:tracking@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Specialists
          </a>
        </div>
      </div>

      {/* Tracking Performance Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Tracking Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Alert Accuracy</span>
              <span className="text-white font-bold">98.5%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Data Points Monitored</span>
              <span className="text-white font-bold">500+</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Response Time</span>
              <span className="text-white font-bold">&lt; 2 hours</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Client Satisfaction</span>
              <span className="text-white font-bold">96%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tracking Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Tracking Tools</h3>
        <div className="space-y-3">
          <a
            href="/resources/competitor-tracking-checklist.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Competitor Tracking Checklist</span>
          </a>
          <a
            href="/resources/tracking-dashboard-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Tracking Dashboard Template</span>
          </a>
          <a
            href="/resources/alert-system-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Alert System Setup Guide</span>
          </a>
          <a
            href="/resources/competitive-intelligence-toolkit.zip"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Intelligence Toolkit</span>
          </a>
        </div>
      </div>

      {/* Tracking Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pro Tracking Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Set Smart Alerts</p>
            <p className="text-xs text-gray-400 mt-1">
              Focus on actionable changes that impact your strategy
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Track the Right Competitors</p>
            <p className="text-xs text-gray-400 mt-1">
              Monitor 5-10 key competitors for maximum insights
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Act on Intelligence</p>
            <p className="text-xs text-gray-400 mt-1">
              Convert tracking data into strategic advantages
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Review Regularly</p>
            <p className="text-xs text-gray-400 mt-1">
              Weekly reviews ensure you don't miss opportunities
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Activity className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Tracking Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Basic Monitoring</span>
            <span className="text-white font-semibold">$1,500/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Advanced Intelligence</span>
            <span className="text-white font-semibold">$3,500/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Enterprise Tracking</span>
            <span className="text-white font-semibold">$6,500/month</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Includes 24/7 monitoring, custom alerts, and strategic reports
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            MJ
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Michael Johnson</p>
            <p className="text-xs text-gray-400">CMO, FinTech Solutions</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The tracking system alerted us to a competitor's pricing change 3 hours before they announced it. 
          We adjusted our strategy immediately and captured 40% more leads that quarter."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">3hrs</p>
            <p className="text-xs text-gray-400">Early Warning</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">+40%</p>
            <p className="text-xs text-gray-400">Lead Increase</p>
          </div>
        </div>
      </div>

      {/* Tracking Technology */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Our Tracking Tech</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">VP</span>
            </div>
            <span className="text-sm text-gray-300">Visualping Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <span className="text-sm text-gray-300">SEMrush Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-sm text-gray-300">Ahrefs Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B24</span>
            </div>
            <span className="text-sm text-gray-300">Brand24 Enterprise</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Intelligence Services</h3>
        <div className="space-y-3">
          <Link
            href="/competitive-analysis/benchmarking"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Competitive Benchmarking
          </Link>
          <Link
            href="/competitive-analysis/seo-audit"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            SEO Competitive Audit
          </Link>
          <Link
            href="/market-research/industry-reports"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Eye className="inline w-4 h-4 mr-2" />
            Market Intelligence
          </Link>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Alert Configuration</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
            Critical: Immediate alerts (SMS + Email)
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
            Important: Within 2 hours (Email + Slack)
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            Informational: Daily digest (Email)
          </li>
        </ul>
      </div>

      {/* Monitoring Frequency */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Monitoring Frequency</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Website Changes</span>
            <span className="text-white font-semibold">Every 15 min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Ranking Positions</span>
            <span className="text-white font-semibold">Daily</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Social Media</span>
            <span className="text-white font-semibold">Every hour</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Advertising</span>
            <span className="text-white font-semibold">Every 2 hours</span>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Data & Reporting</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Historical Data</span>
            <span className="text-white">24 months</span>
          </div>
          <div className="flex justify-between">
            <span>Weekly Reports</span>
            <span className="text-green-400">✓ Included</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Analysis</span>
            <span className="text-green-400">✓ Included</span>
          </div>
          <div className="flex justify-between">
            <span>Custom Dashboards</span>
            <span className="text-green-400">✓ Included</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Why Choose Our Tracking</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Real-time monitoring & instant alerts
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            AI-powered pattern recognition
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Expert analysis & strategic insights
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Australian market specialization
          </li>
        </ul>
      </div>
    </aside>
  );
}