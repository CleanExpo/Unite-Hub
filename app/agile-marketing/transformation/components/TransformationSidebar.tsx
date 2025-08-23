'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Zap, Users, Target, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';

export default function TransformationSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Start Transformation</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=agile-transformation"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Free Transformation Assessment
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Agile Coaches
          </a>
          <a
            href="mailto:agile@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Specialists
          </a>
        </div>
      </div>

      {/* Transformation Results */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Transformation Impact</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Speed Improvement</span>
              <span className="text-white font-bold">+75%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Team Satisfaction</span>
              <span className="text-white font-bold">+35%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Campaign Performance</span>
              <span className="text-white font-bold">+45%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">ROI Improvement</span>
              <span className="text-white font-bold">+60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Transformation Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Agile Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/agile-marketing-manifesto.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Agile Marketing Manifesto</span>
          </a>
          <a
            href="/resources/transformation-roadmap-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Transformation Roadmap</span>
          </a>
          <a
            href="/resources/scrum-marketing-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Marketing Scrum Guide</span>
          </a>
          <a
            href="/resources/agile-maturity-assessment.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Agile Maturity Assessment</span>
          </a>
        </div>
      </div>

      {/* Transformation Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Transformation Tips</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Start Small</p>
            <p className="text-xs text-gray-400 mt-1">
              Begin with pilot teams to prove value before scaling
            </p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Leadership Support</p>
            <p className="text-xs text-gray-400 mt-1">
              Ensure visible executive sponsorship and commitment
            </p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Embrace Iteration</p>
            <p className="text-xs text-gray-400 mt-1">
              Continuously improve processes based on feedback
            </p>
          </div>
          <div className="border-l-2 border-yellow-500 pl-4">
            <p className="text-sm font-semibold text-white">Measure Progress</p>
            <p className="text-xs text-gray-400 mt-1">
              Track metrics to demonstrate transformation value
            </p>
          </div>
        </div>
      </div>

      {/* Transformation Investment */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Zap className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Transformation Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Assessment & Planning</span>
            <span className="text-white font-semibold">$8,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Pilot Implementation</span>
            <span className="text-white font-semibold">$25,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Full Transformation</span>
            <span className="text-white font-semibold">$50,000+</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          *ROI typically 3-5x within 12 months
        </p>
      </div>

      {/* Client Success Story */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
            SM
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sarah Martinez</p>
            <p className="text-xs text-gray-400">CMO, Melbourne Financial</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic mb-4">
          "The agile transformation completely changed how our marketing team operates. 
          Campaign delivery is 80% faster, team satisfaction is up 45%, and we're seeing 
          35% better ROI across all initiatives."
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+80%</p>
            <p className="text-xs text-gray-400">Delivery Speed</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">+35%</p>
            <p className="text-xs text-gray-400">Better ROI</p>
          </div>
        </div>
      </div>

      {/* Agile Frameworks */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Agile Frameworks</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-sm text-gray-300">Marketing Scrum</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-sm text-gray-300">Marketing Kanban</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm text-gray-300">Growth-Driven Design</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-sm text-gray-300">Lean Marketing</span>
          </div>
        </div>
      </div>

      {/* Related Services */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Agile Services</h3>
        <div className="space-y-3">
          <Link
            href="/agile-marketing/frameworks"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Target className="inline w-4 h-4 mr-2" />
            Agile Frameworks
          </Link>
          <Link
            href="/agile-marketing/team-training"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Users className="inline w-4 h-4 mr-2" />
            Team Training
          </Link>
          <Link
            href="/growth-hacking/workshop"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Growth Workshop
          </Link>
        </div>
      </div>

      {/* Transformation Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Transformation Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Assessment & Planning</span>
            <span className="text-white font-semibold">2-3 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Foundation Building</span>
            <span className="text-white font-semibold">4-6 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Pilot Implementation</span>
            <span className="text-white font-semibold">6-8 weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Scale & Optimize</span>
            <span className="text-white font-semibold">8-12 weeks</span>
          </div>
        </div>
      </div>

      {/* Transformation Challenges */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Common Challenges</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Cultural Resistance</span>
            <span className="text-yellow-400">Manageable</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Process Complexity</span>
            <span className="text-yellow-400">Solvable</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Technology Integration</span>
            <span className="text-green-400">Straightforward</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Measurement Setup</span>
            <span className="text-green-400">Standard</span>
          </div>
        </div>
      </div>

      {/* Industry Focus */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Industry Expertise</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Financial services & banking
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Technology & SaaS companies
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            E-commerce & retail brands
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            Professional services firms
          </li>
        </ul>
      </div>

      {/* Transformation Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Essential Tools</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Project Management</span>
            <span className="text-green-400">✓ Jira, Asana</span>
          </div>
          <div className="flex justify-between">
            <span>Communication</span>
            <span className="text-green-400">✓ Slack, Teams</span>
          </div>
          <div className="flex justify-between">
            <span>Analytics</span>
            <span className="text-green-400">✓ Tableau, Power BI</span>
          </div>
          <div className="flex justify-between">
            <span>Collaboration</span>
            <span className="text-green-400">✓ Miro, Figma</span>
          </div>
        </div>
      </div>

      {/* Success Metrics */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Success Metrics</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Sprint Velocity</span>
            <span className="text-blue-400">Increasing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Time to Market</span>
            <span className="text-blue-400">Decreasing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Team Satisfaction</span>
            <span className="text-blue-400">9/10 average</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Stakeholder NPS</span>
            <span className="text-blue-400">70+ score</span>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Our Transformation Edge</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Certified agile marketing coaches
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Australian business context expertise
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Proven transformation methodologies
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            Ongoing support and optimization
          </li>
        </ul>
      </div>
    </aside>
  );
}