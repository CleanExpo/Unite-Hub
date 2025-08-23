'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Users, Target, TrendingUp, BarChart3, Zap, Award } from 'lucide-react';

export default function WorkshopSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Book Growth Workshop</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=growth-workshop"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Schedule Workshop
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Growth Team
          </a>
          <a
            href="mailto:workshop@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Facilitators
          </a>
        </div>
      </div>

      {/* Workshop Results */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Workshop Outcomes</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Growth Ideas Generated</span>
              <span className="text-white font-bold">25-40</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Experiment Roadmap</span>
              <span className="text-white font-bold">3 months</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Team Alignment</span>
              <span className="text-white font-bold">95%+</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Implementation Rate</span>
              <span className="text-white font-bold">85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Workshop Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Workshop Materials</h3>
        <div className="space-y-3">
          <a
            href="/resources/growth-workshop-toolkit.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Growth Workshop Toolkit</span>
          </a>
          <a
            href="/resources/ideation-templates.pptx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Ideation Session Templates</span>
          </a>
          <a
            href="/resources/experiment-planning-canvas.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Experiment Planning Canvas</span>
          </a>
          <a
            href="/resources/growth-metrics-tracker.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Growth Metrics Tracker</span>
          </a>
        </div>
      </div>

      {/* Workshop Preparation Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Workshop Preparation</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Gather Data First</p>
            <p className="text-xs text-gray-400 mt-1">
              Bring current performance metrics and customer insights
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Include Key Stakeholders</p>
            <p className="text-xs text-gray-400 mt-1">
              Involve decision makers from marketing, product, and data teams
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Define Clear Goals</p>
            <p className="text-xs text-gray-400 mt-1">
              Set specific growth targets and business objectives
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Block Adequate Time</p>
            <p className="text-xs text-gray-400 mt-1">
              Reserve full days for maximum engagement and results
            </p>
          </div>
        </div>
      </div>

      {/* Workshop Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Users className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Workshop Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Half-Day Workshop</span>
            <span className="text-white font-semibold">$4,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Full-Day Workshop</span>
            <span className="text-white font-semibold">$8,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Multi-Day Program</span>
            <span className="text-white font-semibold">$15,000</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *Includes facilitation, materials, and follow-up support
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
            TC
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Tom Chen</p>
            <p className="text-xs text-gray-400">VP Marketing, Sydney E-comm</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The growth workshop generated 32 experiment ideas in one day. We implemented 
          the top 8 priorities and saw 45% revenue growth in the next quarter. Best 
          investment we made this year."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">32</p>
            <p className="text-xs text-gray-400">Growth Ideas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">+45%</p>
            <p className="text-xs text-gray-400">Revenue Growth</p>
          </div>
        </div>
      </div>

      {/* Workshop Formats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Workshop Formats</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-sm text-gray-300">Strategy Workshop</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="text-sm text-gray-300">Ideation Session</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-sm text-gray-300">Experiment Design</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-sm text-gray-300">Optimization Sprint</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Growth Services</h3>
        <div className="space-y-3">
          <Link
            href="/growth-hacking/case-studies"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Award className="inline w-4 h-4 mr-2" />
            Growth Case Studies
          </Link>
          <Link
            href="/growth-hacking/tools"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Growth Tools & Analytics
          </Link>
          <Link
            href="/growth-hacking/guide"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Implementation Guide
          </Link>
        </div>
      </div>

      {/* Workshop Schedule */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Typical Workshop Schedule</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Current State Analysis</span>
            <span className="text-white font-semibold">2 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Growth Ideation</span>
            <span className="text-white font-semibold">3 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Prioritization & Planning</span>
            <span className="text-white font-semibold">2 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Next Steps & Roadmap</span>
            <span className="text-white font-semibold">1 hour</span>
          </div>
        </div>
      </div>

      {/* Workshop Deliverables */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">What You'll Receive</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Growth Strategy Document</span>
            <span className="text-green-400">✓ Included</span>
          </div>
          <div className="flex justify-between">
            <span>Experiment Backlog</span>
            <span className="text-green-400">✓ Included</span>
          </div>
          <div className="flex justify-between">
            <span>90-Day Roadmap</span>
            <span className="text-green-400">✓ Included</span>
          </div>
          <div className="flex justify-between">
            <span>Implementation Templates</span>
            <span className="text-green-400">✓ Included</span>
          </div>
        </div>
      </div>

      {/* Participant Guidelines */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Ideal Participants</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Marketing Leaders</span>
            <span className="text-blue-400">Essential</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Product Managers</span>
            <span className="text-blue-400">Recommended</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Data Analysts</span>
            <span className="text-blue-400">Recommended</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Executive Sponsor</span>
            <span className="text-green-400">Critical</span>
          </div>
        </div>
      </div>

      {/* Workshop Locations */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Workshop Delivery</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            On-site at your office
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Virtual workshop sessions
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Our Brisbane training facility
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Hybrid delivery options
          </li>
        </ul>
      </div>

      {/* Follow-up Support */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Post-Workshop Support</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>30-Day Check-in</span>
            <span className="text-green-400">✓ Free</span>
          </div>
          <div className="flex justify-between">
            <span>Implementation Coaching</span>
            <span className="text-blue-400">Optional</span>
          </div>
          <div className="flex justify-between">
            <span>Quarterly Reviews</span>
            <span className="text-blue-400">Available</span>
          </div>
          <div className="flex justify-between">
            <span>Tool Setup Support</span>
            <span className="text-blue-400">Available</span>
          </div>
        </div>
      </div>

      {/* Success Guarantee */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Workshop Guarantee</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            100% satisfaction guarantee
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Minimum 20 actionable growth ideas
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Clear 90-day implementation plan
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Team alignment on growth priorities
          </li>
        </ul>
      </div>
    </aside>
  );
}