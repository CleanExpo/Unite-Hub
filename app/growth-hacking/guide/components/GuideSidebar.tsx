'use client';

import { Download, FileText, PlayCircle, BookOpen, Users, Mail } from 'lucide-react';

export default function GuideSidebar() {
  return (
    <div className="space-y-6">
      {/* Quick Resources */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Resources</h3>
        <div className="space-y-3">
          <a
            href="/downloads/growth-hacking-checklist.pdf"
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-white">Growth Hacking Checklist</p>
              <p className="text-xs text-gray-400">PDF • 2 pages</p>
            </div>
          </a>
          
          <a
            href="/downloads/aarrr-template.xlsx"
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Download className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-white">AARRR Metrics Template</p>
              <p className="text-xs text-gray-400">Excel • Customizable</p>
            </div>
          </a>
          
          <a
            href="/growth-hacking/calculator"
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <PlayCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-white">Growth Calculator</p>
              <p className="text-xs text-gray-400">Interactive Tool</p>
            </div>
          </a>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Growth Hacking Newsletter</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Get weekly growth tactics and case studies delivered to your inbox.
        </p>
        <form className="space-y-3">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Subscribe Free
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">
          Join 5,000+ growth professionals. Unsubscribe anytime.
        </p>
      </div>

      {/* Related Guides */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Related Guides</h3>
        <div className="space-y-3">
          <a
            href="/agile-marketing/frameworks"
            className="block group"
          >
            <p className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
              Agile Marketing Frameworks →
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Implement sprint-based marketing
            </p>
          </a>
          
          <a
            href="/social-advertising/facebook-ads"
            className="block group"
          >
            <p className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
              Facebook Ads Mastery →
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Scale with paid social
            </p>
          </a>
          
          <a
            href="/competitive-analysis/benchmarking"
            className="block group"
          >
            <p className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
              Competitive Analysis →
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Outmaneuver competitors
            </p>
          </a>
        </div>
      </div>

      {/* Expert Help */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Need Expert Help?</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Our growth experts have scaled 100+ companies. Get personalized strategies for your business.
        </p>
        <a
          href="/contact?service=growth-hacking-consultation"
          className="block w-full text-center px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Book Free Consultation
        </a>
      </div>

      {/* Stats */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Guide Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Views</span>
            <span className="text-sm font-semibold text-white">12,847</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Downloads</span>
            <span className="text-sm font-semibold text-white">3,291</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Avg. Rating</span>
            <span className="text-sm font-semibold text-white">4.8/5.0 ⭐</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Last Updated</span>
            <span className="text-sm font-semibold text-white">Jan 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}