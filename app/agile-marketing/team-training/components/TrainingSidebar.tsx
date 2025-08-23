'use client';

import Link from 'next/link';
import { Calendar, Download, Phone, Mail, Clock, Award, Users, BookOpen } from 'lucide-react';

export default function TrainingSidebar() {
  return (
    <aside className="space-y-8">
      {/* Quick Contact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Get Started Today</h3>
        <div className="space-y-3">
          <Link
            href="/contact?service=agile-training"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Schedule Training
          </Link>
          <a
            href="tel:+61730000000"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </a>
          <a
            href="mailto:training@unitegroup.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>

      {/* Training Stats */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Training Impact</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Teams Trained</span>
              <span className="text-white font-bold">500+</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-white font-bold">98%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Avg. Velocity Increase</span>
              <span className="text-white font-bold">3.2x</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Certification Pass Rate</span>
              <span className="text-white font-bold">94%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Free Resources</h3>
        <div className="space-y-3">
          <a
            href="/resources/agile-marketing-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Agile Marketing Guide</span>
          </a>
          <a
            href="/resources/sprint-planning-template.xlsx"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Sprint Planning Template</span>
          </a>
          <a
            href="/resources/team-assessment.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Team Assessment Tool</span>
          </a>
          <a
            href="/resources/certification-guide.pdf"
            className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Certification Guide</span>
          </a>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Upcoming Sessions</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-sm font-semibold text-white">Agile Fundamentals</p>
            <p className="text-xs text-gray-400 mt-1">
              <Clock className="inline w-3 h-3 mr-1" />
              Feb 5-6, 2025
            </p>
            <p className="text-xs text-blue-400 mt-1">2 seats left</p>
          </div>
          <div className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm font-semibold text-white">Sprint Marketing</p>
            <p className="text-xs text-gray-400 mt-1">
              <Clock className="inline w-3 h-3 mr-1" />
              Feb 12-14, 2025
            </p>
            <p className="text-xs text-purple-400 mt-1">5 seats left</p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-sm font-semibold text-white">Team Leadership</p>
            <p className="text-xs text-gray-400 mt-1">
              <Clock className="inline w-3 h-3 mr-1" />
              Feb 19-20, 2025
            </p>
            <p className="text-xs text-green-400 mt-1">8 seats left</p>
          </div>
        </div>
      </div>

      {/* Certification Benefits */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
        <Award className="w-8 h-8 text-blue-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-3">Get Certified</h3>
        <p className="text-sm text-gray-300 mb-4">
          Join 5,000+ certified Agile marketers and advance your career
        </p>
        <ul className="space-y-2 text-sm text-gray-300 mb-4">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Industry recognition
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Career advancement
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Higher earning potential
          </li>
        </ul>
        <Link
          href="/agile-marketing/certification"
          className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
        >
          Learn More →
        </Link>
      </div>

      {/* Client Testimonial */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Jane Doe</p>
            <p className="text-xs text-gray-400">Marketing Director, TechCorp</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 italic">
          "The Agile training transformed our marketing team. We're now delivering campaigns 
          3x faster with better results. The certification program gave our team credibility 
          and confidence."
        </p>
      </div>

      {/* Related Training */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Related Training</h3>
        <div className="space-y-3">
          <Link
            href="/agile-marketing/frameworks"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <BookOpen className="inline w-4 h-4 mr-2" />
            Agile Frameworks Deep Dive
          </Link>
          <Link
            href="/growth-hacking/workshop"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Users className="inline w-4 h-4 mr-2" />
            Growth Hacking Workshop
          </Link>
          <Link
            href="/agile-marketing/transformation"
            className="block text-sm text-gray-300 hover:text-blue-400 transition-colors"
          >
            <Award className="inline w-4 h-4 mr-2" />
            Organizational Transformation
          </Link>
        </div>
      </div>
    </aside>
  );
}